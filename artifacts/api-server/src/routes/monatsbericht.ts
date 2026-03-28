import { Router, type IRouter } from "express";
import { db, pool, emailSettingsTable, marketEmailConfigsTable, monatsberichtConfigTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const MARKETS: Record<number, { name: string; kurzname: string }> = {
  1: { name: "EDEKA Dallmann – Leeder",        kurzname: "Leeder"        },
  2: { name: "EDEKA Dallmann – Buching",       kurzname: "Buching"       },
  3: { name: "EDEKA Dallmann – Marktoberdorf", kurzname: "Marktoberdorf" },
};

const GERMAN_MONTHS = [
  "", "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// ─── AUTH ───────────────────────────────────────────────────────────────────

async function verifySuperAdmin(adminEmail: string): Promise<boolean> {
  if (!adminEmail) return false;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail.toLowerCase()));
  return users.length > 0 && users[0].role === "SUPERADMIN";
}

// ─── EMAIL TRANSPORTER ──────────────────────────────────────────────────────

async function getTransporter(marketId: number) {
  const globalRows = await db.select().from(emailSettingsTable).limit(1);
  const global = globalRows[0];
  if (!global?.enabled) return null;

  const marketRows = await db.select().from(marketEmailConfigsTable).where(eq(marketEmailConfigsTable.marketId, marketId));
  const marketCfg = marketRows[0] || null;

  const user = marketCfg?.smtpUser || global.smtpUser;
  const pass = marketCfg?.smtpPass || global.smtpPass;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: global.smtpHost,
    port: global.smtpPort,
    secure: global.smtpPort === 465,
    auth: { user, pass },
  });
}

// ─── CONFIG CRUD ─────────────────────────────────────────────────────────────

router.get("/admin/monatsbericht-config", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }
  const configs = await db.select().from(monatsberichtConfigTable);
  res.json(configs);
});

router.put("/admin/monatsbericht-config/:marketId", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }
  const marketId = parseInt(req.params.marketId);
  if (!MARKETS[marketId]) { res.status(400).json({ error: "Unbekannte Filiale." }); return; }

  const { empfaengerEmail, autoSend, sendDay, isActive } = req.body;

  const existing = await db.select().from(monatsberichtConfigTable).where(eq(monatsberichtConfigTable.marketId, marketId));

  if (existing.length > 0) {
    const updated = await db.update(monatsberichtConfigTable)
      .set({ empfaengerEmail, autoSend: !!autoSend, sendDay: sendDay || 1, isActive: isActive !== false, updatedAt: new Date() })
      .where(eq(monatsberichtConfigTable.marketId, marketId))
      .returning();
    res.json(updated[0]);
  } else {
    const inserted = await db.insert(monatsberichtConfigTable)
      .values({ marketId, empfaengerEmail, autoSend: !!autoSend, sendDay: sendDay || 1, isActive: isActive !== false })
      .returning();
    res.json(inserted[0]);
  }
});

// ─── DATA AGGREGATION ────────────────────────────────────────────────────────

async function aggregateMonthData(marketId: number, year: number, month: number) {
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [
    reinigung,
    wareneingangOG,
    mhdKontrolle,
    metzReinigung,
    besprechung,
    betriebsbegehung,
    gqBegehung,
    probeentnahme,
    produktfehler,
    wareEinraeumservice,
  ] = await Promise.all([
    pool.query(
      `SELECT day, area, STRING_AGG(DISTINCT kuerzel, ', ' ORDER BY kuerzel) AS kuerzel_list
       FROM reinigung_taeglich
       WHERE market_id = $1 AND year = $2 AND month = $3
       GROUP BY day, area ORDER BY day, area`,
      [marketId, year, month]
    ),
    pool.query(
      `SELECT day FROM wareneingang_og
       WHERE market_id = $1 AND year = $2 AND month = $3
       ORDER BY day`,
      [marketId, year, month]
    ),
    pool.query(
      `SELECT aktion FROM mhd_kontrolle
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ),
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM metz_reinigung
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ),
    pool.query(
      `SELECT datum, thema FROM besprechungsprotokoll
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    pool.query(
      `SELECT quartal, durchgefuehrt_am, durchgefuehrt_von
       FROM betriebsbegehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    pool.query(
      `SELECT quartal, durchgefuehrt_am
       FROM gq_begehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM probeentnahme
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM produktfehlermeldung
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM ware_einraeumservice
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ).catch(() => ({ rows: [{ anzahl: "0" }] })),
  ]);

  return {
    reinigung: reinigung.rows,
    wareneingangOG: wareneingangOG.rows,
    mhdKontrolle: mhdKontrolle.rows,
    metzReinigung: metzReinigung.rows,
    besprechung: besprechung.rows,
    betriebsbegehung: betriebsbegehung.rows,
    gqBegehung: gqBegehung.rows,
    probeentnahme: probeentnahme.rows,
    produktfehler: produktfehler.rows,
    wareEinraeumservice: wareEinraeumservice.rows,
  };
}

// ─── HTML GENERATOR (kompakt, 1 Seite) ───────────────────────────────────────

function formatDate(s: string | null | undefined): string {
  if (!s) return "–";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("de-DE");
}

function row(label: string, value: string, ok: boolean | null = null): string {
  const icon = ok === null ? "" : ok
    ? `<span style="color:#16a34a;font-weight:bold;margin-right:6px">✓</span>`
    : `<span style="color:#dc2626;font-weight:bold;margin-right:6px">✗</span>`;
  return `
    <tr>
      <td style="padding:7px 10px;font-weight:600;color:#374151;width:55%;border-bottom:1px solid #f0f0f0">${label}</td>
      <td style="padding:7px 10px;color:#111;border-bottom:1px solid #f0f0f0">${icon}${value}</td>
    </tr>`;
}

function section(title: string, rows: string): string {
  return `
    <tr>
      <td colspan="2" style="padding:8px 10px 3px;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb">${title}</td>
    </tr>
    ${rows}`;
}

function generateHtml(
  data: Awaited<ReturnType<typeof aggregateMonthData>>,
  marketId: number,
  year: number,
  month: number
): string {
  const marktInfo = MARKETS[marketId] || { name: "Unbekannte Filiale", kurzname: "?" };
  const monatName = GERMAN_MONTHS[month];
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentQuartal = Math.ceil(month / 3);

  // Tägliche Reinigung
  const reinigungDays = new Set(data.reinigung.map((r: Record<string, unknown>) => r.day));
  const reinigungAreas = [...new Set(data.reinigung.map((r: Record<string, unknown>) => r.area as string))].sort();

  // Wareneingang O&G
  const weOGDays = new Set(data.wareneingangOG.map((r: Record<string, unknown>) => r.day));

  // MHD Kontrolle
  const mhdGesamt = data.mhdKontrolle.length;
  const mhdAussortiert = data.mhdKontrolle.filter((r: Record<string, unknown>) => r.aktion === "aussortiert").length;
  const mhdReduziert = data.mhdKontrolle.filter((r: Record<string, unknown>) => r.aktion === "reduziert").length;
  const mhdGeprueft = mhdGesamt - mhdAussortiert - mhdReduziert;

  // Metzgerei Reinigung
  const metzAnzahl = parseInt(String(data.metzReinigung[0]?.anzahl ?? "0"), 10);

  // Betriebsbegehung
  const bbInQuartal = data.betriebsbegehung.filter((r: Record<string, unknown>) => Number(r.quartal) === currentQuartal);

  // GQ Begehung
  const gqInQuartal = data.gqBegehung.filter((r: Record<string, unknown>) => Number(r.quartal) === currentQuartal);

  // Counts
  const probeAnzahl = parseInt(String(data.probeentnahme[0]?.anzahl ?? "0"), 10);
  const fehlerAnzahl = parseInt(String(data.produktfehler[0]?.anzahl ?? "0"), 10);
  const einraeumAnzahl = parseInt(String(data.wareEinraeumservice[0]?.anzahl ?? "0"), 10);

  // Besprechungen
  const besprechungen = data.besprechung as Record<string, unknown>[];

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>HACCP Monatsbericht ${monatName} ${year} – ${marktInfo.kurzname}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .page { max-width: 680px; margin: 0 auto; padding: 24px 28px; }
  table { width: 100%; border-collapse: collapse; }
  .footer-line { border-top: 1px solid #ccc; margin-top: 28px; padding-top: 16px; }
  .sig { display: inline-block; width: 45%; border-bottom: 1px solid #666; padding-top: 36px; font-size: 10px; color: #666; text-align: center; margin-right: 8%; }
  @media print {
    body { font-size: 11px; }
    .page { padding: 12px 14px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- KOPFZEILE -->
  <table style="margin-bottom:18px">
    <tr>
      <td>
        <div style="font-size:20px;font-weight:900;color:#e31e26;letter-spacing:-0.5px">EDEKA <span style="color:#1a3a5c">Dallmann</span></div>
        <div style="font-size:11px;color:#555;margin-top:1px">${marktInfo.name}</div>
      </td>
      <td style="text-align:right;vertical-align:top">
        <div style="font-size:15px;font-weight:bold;color:#1a3a5c">HACCP Monatsbericht</div>
        <div style="font-size:13px;color:#e31e26;font-weight:bold">${monatName} ${year}</div>
        <div style="font-size:9px;color:#aaa;margin-top:2px">Erstellt: ${new Date().toLocaleDateString("de-DE")}</div>
      </td>
    </tr>
  </table>
  <div style="border-top:3px solid #1a3a5c;margin-bottom:16px"></div>

  <!-- ÜBERSICHTSTABELLE -->
  <table style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">

    ${section("Tägliche Kontrollen", `
      ${row(
        "Tägliche Reinigung",
        reinigungDays.size === 0
          ? "Keine Einträge"
          : `an ${reinigungDays.size} von ${daysInMonth} Tagen erledigt${reinigungAreas.length > 0 ? ` (${reinigungAreas.join(", ")})` : ""}`,
        reinigungDays.size > 0
      )}
      ${row(
        "Wareneingang Obst &amp; Gemüse",
        weOGDays.size === 0 ? "Keine Einträge" : `an ${weOGDays.size} von ${daysInMonth} Tagen geprüft`,
        weOGDays.size > 0
      )}
      ${row(
        "MHD-Kontrolle",
        mhdGesamt === 0
          ? "Keine Prüfungen"
          : `${mhdGesamt} Artikel geprüft${mhdGeprueft > 0 ? `, ${mhdGeprueft} i.O.` : ""}${mhdReduziert > 0 ? `, ${mhdReduziert} reduziert` : ""}${mhdAussortiert > 0 ? `, ${mhdAussortiert} aussortiert` : ""}`,
        mhdGesamt > 0
      )}
    `)}

    ${section("Metzgerei", `
      ${row(
        "Reinigung Metzgerei",
        metzAnzahl === 0 ? "Keine Einträge" : `${metzAnzahl} Reinigungseinträge dokumentiert`,
        metzAnzahl > 0
      )}
    `)}

    ${section("Besprechungen & Unterweisungen", `
      ${row(
        "Besprechungsprotokoll",
        besprechungen.length === 0
          ? "Keine Besprechungen"
          : besprechungen.length === 1
          ? `1 Besprechung am ${formatDate(besprechungen[0].datum as string)}${besprechungen[0].thema ? ` – ${besprechungen[0].thema}` : ""}`
          : `${besprechungen.length} Besprechungen (${besprechungen.map((b: Record<string, unknown>) => formatDate(b.datum as string)).join(", ")})`,
        besprechungen.length > 0
      )}
    `)}

    ${section(`Quartalsweise Begehungen (Q${currentQuartal}/${year})`, `
      ${row(
        "Betriebsbegehung",
        bbInQuartal.length > 0
          ? `Durchgeführt am ${formatDate(bbInQuartal[0].durchgefuehrt_am as string)}${bbInQuartal[0].durchgefuehrt_von ? ` von ${bbInQuartal[0].durchgefuehrt_von}` : ""}`
          : "Nicht dokumentiert",
        bbInQuartal.length > 0
      )}
      ${row(
        "GQ-Begehung",
        gqInQuartal.length > 0
          ? `Durchgeführt am ${formatDate(gqInQuartal[0].durchgefuehrt_am as string)}`
          : "Nicht dokumentiert",
        gqInQuartal.length > 0
      )}
    `)}

    ${section("Sonstige", `
      ${row(
        "Einräumservice (Fremdpersonal)",
        einraeumAnzahl === 0 ? "Keine Einsätze" : `${einraeumAnzahl} Einsätze dokumentiert`,
        einraeumAnzahl > 0 ? null : null
      )}
      ${row(
        "Probeentnahmen",
        probeAnzahl === 0 ? "Keine Probeentnahmen" : `${probeAnzahl} Probe${probeAnzahl > 1 ? "n" : ""} entnommen`,
        probeAnzahl > 0 ? null : null
      )}
      ${row(
        "Produktfehlermeldungen",
        fehlerAnzahl === 0 ? "Keine Meldungen" : `${fehlerAnzahl} Meldung${fehlerAnzahl > 1 ? "en" : ""} eingegangen`,
        fehlerAnzahl === 0 ? null : false
      )}
    `)}

  </table>

  <!-- UNTERSCHRIFTEN -->
  <div class="footer-line">
    <div style="font-size:9px;color:#aaa;margin-bottom:14px">
      Automatisch generiert aus dem HACCP-System · ${monatName} ${year} · ${marktInfo.name}
    </div>
    <span class="sig">Datum &amp; Unterschrift Marktleitung</span>
    <span class="sig">Datum &amp; Unterschrift QM</span>
  </div>

</div>
</body>
</html>`;
}

// ─── PREVIEW ─────────────────────────────────────────────────────────────────

router.get("/admin/monatsbericht/vorschau", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }
  const marketId = parseInt(req.query.marketId as string);
  const year = parseInt(req.query.jahr as string);
  const month = parseInt(req.query.monat as string);

  if (!marketId || !year || !month) { res.status(400).json({ error: "marketId, jahr und monat erforderlich." }); return; }
  if (!MARKETS[marketId]) { res.status(400).json({ error: "Unbekannte Filiale." }); return; }

  try {
    const data = await aggregateMonthData(marketId, year, month);
    const html = generateHtml(data, marketId, year, month);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Monatsbericht Vorschau Fehler:", err);
    res.status(500).json({ error: "Fehler beim Generieren der Vorschau." });
  }
});

// ─── GENERIEREN & SENDEN ─────────────────────────────────────────────────────

router.post("/admin/monatsbericht/generieren", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }

  const { marketId, jahr, monat, senden, empfaengerEmail: customEmail } = req.body;

  if (!marketId || !jahr || !monat) {
    res.status(400).json({ error: "marketId, jahr und monat sind erforderlich." });
    return;
  }
  if (!MARKETS[marketId]) { res.status(400).json({ error: "Unbekannte Filiale." }); return; }

  try {
    const data = await aggregateMonthData(Number(marketId), Number(jahr), Number(monat));
    const html = generateHtml(data, Number(marketId), Number(jahr), Number(monat));

    let emailStatus: string | null = null;

    if (senden) {
      const configRows = await db.select().from(monatsberichtConfigTable).where(eq(monatsberichtConfigTable.marketId, Number(marketId)));
      const config = configRows[0];
      const recipient = customEmail || config?.empfaengerEmail;

      if (!recipient) {
        res.json({ success: true, html, emailStatus: "Kein Empfänger konfiguriert – E-Mail nicht gesendet." });
        return;
      }

      const transporter = await getTransporter(Number(marketId));
      if (!transporter) {
        res.json({ success: true, html, emailStatus: "E-Mail-Versand nicht konfiguriert (SMTP deaktiviert)." });
        return;
      }

      const monatName = GERMAN_MONTHS[Number(monat)];
      const marktName = MARKETS[Number(marketId)].kurzname;
      const globalRows = await db.select().from(emailSettingsTable).limit(1);

      await transporter.sendMail({
        from: `"EDEKA Dallmann HACCP" <${globalRows[0]?.smtpUser}>`,
        to: recipient,
        subject: `HACCP Monatsbericht ${monatName} ${jahr} – ${marktName}`,
        html,
        attachments: [{
          filename: `HACCP_Monatsbericht_${marktName}_${jahr}_${String(monat).padStart(2, "0")}.html`,
          content: html,
          contentType: "text/html",
        }],
      });

      emailStatus = `Erfolgreich gesendet an: ${recipient}`;
    }

    res.json({ success: true, html, emailStatus });
  } catch (err) {
    console.error("Monatsbericht Generieren Fehler:", err);
    res.status(500).json({ error: "Fehler beim Generieren des Monatsberichts." });
  }
});

export default router;
