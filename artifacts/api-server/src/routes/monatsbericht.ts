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

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function verifySuperAdmin(adminEmail: string): Promise<boolean> {
  if (!adminEmail) return false;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail.toLowerCase()));
  return users.length > 0 && users[0].role === "SUPERADMIN";
}

// ─── EMAIL TRANSPORTER ───────────────────────────────────────────────────────

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
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const configs = await db.select().from(monatsberichtConfigTable);
  res.json(configs);
});

router.put("/admin/monatsbericht-config/:marketId", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
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
    wareneingangMarkt,
    wareneingangMetzgerei,
    metzReinigung,
    oeffnungSalate,
    kaesetheke,
    semmelliste,
    besprechung,
    betriebsbegehung,
    gqBegehung,
    probeentnahme,
    produktfehler,
  ] = await Promise.all([
    // Tägliche Reinigung – anzahl unterschiedlicher Tage
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM reinigung_taeglich
       WHERE market_id = $1 AND year = $2 AND month = $3`,
      [marketId, year, month]
    ),
    // Wareneingang O&G
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM wareneingang_og
       WHERE market_id = $1 AND year = $2 AND month = $3`,
      [marketId, year, month]
    ),
    // Wareneingang allgemein (Markt-Bereich)
    pool.query(
      `SELECT COUNT(DISTINCT we.day) AS tage
       FROM wareneingang_entries we
       JOIN wareneingang_types wt ON we.type_id = wt.id
       WHERE we.market_id = $1 AND we.year = $2 AND we.month = $3
         AND wt.section = 'wareneingaenge'`,
      [marketId, year, month]
    ),
    // Wareneingang Metzgerei
    pool.query(
      `SELECT COUNT(DISTINCT we.day) AS tage
       FROM wareneingang_entries we
       JOIN wareneingang_types wt ON we.type_id = wt.id
       WHERE we.market_id = $1 AND we.year = $2 AND we.month = $3
         AND wt.section = 'metzgerei'`,
      [marketId, year, month]
    ),
    // Metzgerei Reinigung
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM metz_reinigung
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ),
    // Öffnung Salate
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM oeffnung_salate
       WHERE market_id = $1 AND year = $2 AND month = $3`,
      [marketId, year, month]
    ),
    // Käsetheke Kontrolle
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM kaesetheke_kontrolle
       WHERE market_id = $1 AND year = $2 AND month = $3`,
      [marketId, year, month]
    ),
    // Semmelliste
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM semmelliste
       WHERE market_id = $1 AND year = $2 AND month = $3`,
      [marketId, year, month]
    ).catch(() => ({ rows: [{ tage: "0" }] })),
    // Besprechungsprotokoll
    pool.query(
      `SELECT datum, thema FROM besprechungsprotokoll
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    // Betriebsbegehung (ganzes Jahr, nach Quartal filtern im Generator)
    pool.query(
      `SELECT quartal, durchgefuehrt_am, durchgefuehrt_von
       FROM betriebsbegehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // GQ-Begehung
    pool.query(
      `SELECT quartal, durchgefuehrt_am
       FROM gq_begehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // Probeentnahmen
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM probeentnahme
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    // Produktfehlermeldungen
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM produktfehlermeldung
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
  ]);

  return {
    reinigungTage:        parseInt(reinigung.rows[0]?.tage ?? "0", 10),
    weOGTage:             parseInt(wareneingangOG.rows[0]?.tage ?? "0", 10),
    weMarktTage:          parseInt(wareneingangMarkt.rows[0]?.tage ?? "0", 10),
    weMetzgereiTage:      parseInt(wareneingangMetzgerei.rows[0]?.tage ?? "0", 10),
    metzReinigungAnzahl:  parseInt(metzReinigung.rows[0]?.anzahl ?? "0", 10),
    salatenTage:          parseInt(oeffnungSalate.rows[0]?.tage ?? "0", 10),
    kaesethekeTage:       parseInt(kaesetheke.rows[0]?.tage ?? "0", 10),
    semmellisteTage:      parseInt(semmelliste.rows[0]?.tage ?? "0", 10),
    besprechung:          besprechung.rows as Record<string, unknown>[],
    betriebsbegehung:     betriebsbegehung.rows as Record<string, unknown>[],
    gqBegehung:           gqBegehung.rows as Record<string, unknown>[],
    probeAnzahl:          parseInt(probeentnahme.rows[0]?.anzahl ?? "0", 10),
    fehlerAnzahl:         parseInt(produktfehler.rows[0]?.anzahl ?? "0", 10),
  };
}

// ─── HTML GENERATOR (kompakt, 1 Seite) ───────────────────────────────────────

function formatDate(s: string | null | undefined): string {
  if (!s) return "–";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("de-DE");
}

type RowStatus = "ok" | "warn" | "neutral";

function row(label: string, value: string, status: RowStatus = "neutral"): string {
  const icon =
    status === "ok"   ? `<span style="color:#16a34a;font-weight:bold;margin-right:5px">✓</span>` :
    status === "warn" ? `<span style="color:#dc2626;font-weight:bold;margin-right:5px">✗</span>` :
                        `<span style="color:#9ca3af;margin-right:5px">–</span>`;
  return `
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#374151;width:55%;border-bottom:1px solid #f0f0f0">${label}</td>
      <td style="padding:6px 10px;color:#111;border-bottom:1px solid #f0f0f0">${icon}${value}</td>
    </tr>`;
}

function sectionHeader(title: string): string {
  return `
    <tr>
      <td colspan="2" style="padding:7px 10px 3px;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb">${title}</td>
    </tr>`;
}

function tageText(tage: number, daysInMonth: number): string {
  if (tage === 0) return "Keine Einträge";
  if (tage === daysInMonth) return `an allen ${daysInMonth} Tagen`;
  return `an ${tage} von ${daysInMonth} Tagen`;
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

  const bbInQ = data.betriebsbegehung.filter(r => Number(r.quartal) === currentQuartal);
  const gqInQ = data.gqBegehung.filter(r => Number(r.quartal) === currentQuartal);

  const besprechungen = data.besprechung;
  const bespText = besprechungen.length === 0
    ? "Keine Besprechungen"
    : besprechungen.length === 1
      ? `1 Besprechung am ${formatDate(besprechungen[0].datum as string)}${besprechungen[0].thema ? ` – ${besprechungen[0].thema}` : ""}`
      : `${besprechungen.length} Besprechungen (${besprechungen.map(b => formatDate(b.datum as string)).join(", ")})`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>HACCP Monatsbericht ${monatName} ${year} – ${marktInfo.kurzname}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .page { max-width: 680px; margin: 0 auto; padding: 24px 28px; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .sig { display: inline-block; width: 44%; border-bottom: 1px solid #555; padding-top: 40px; font-size: 10px; color: #666; text-align: center; }
  @media print {
    body { font-size: 11px; }
    .page { padding: 12px 14px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- KOPFZEILE -->
  <table style="border:none;margin-bottom:14px">
    <tr>
      <td style="border:none;padding:0">
        <div style="font-size:20px;font-weight:900;color:#111;letter-spacing:-0.5px">EDEKA <span style="color:#1a3a5c">Dallmann</span></div>
        <div style="font-size:11px;color:#555;margin-top:1px">${marktInfo.name}</div>
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:15px;font-weight:bold;color:#1a3a5c">HACCP Monatsbericht</div>
        <div style="font-size:13px;color:#e31e26;font-weight:bold">${monatName} ${year}</div>
        <div style="font-size:9px;color:#aaa;margin-top:2px">Erstellt: ${new Date().toLocaleDateString("de-DE")}</div>
      </td>
    </tr>
  </table>
  <div style="border-top:3px solid #1a3a5c;margin-bottom:16px"></div>

  <!-- ÜBERSICHTSTABELLE -->
  <table>
    ${sectionHeader("Markt")}
    ${row("Tägliche Reinigung",       tageText(data.reinigungTage, daysInMonth) + " durchgeführt",     data.reinigungTage > 0 ? "ok" : "warn")}
    ${row("Wareneingang Obst &amp; Gemüse", tageText(data.weOGTage, daysInMonth) + " geprüft",         data.weOGTage > 0 ? "ok" : "warn")}
    ${data.weMarktTage > 0 ? row("Wareneingang allgemein", tageText(data.weMarktTage, daysInMonth) + " geprüft", "ok") : ""}

    ${sectionHeader("Metzgerei")}
    ${row("Wareneingang Metzgerei",   tageText(data.weMetzgereiTage, daysInMonth) + " geprüft",        data.weMetzgereiTage > 0 ? "ok" : "warn")}
    ${row("Reinigung Metzgerei",      data.metzReinigungAnzahl === 0 ? "Keine Einträge" : `${data.metzReinigungAnzahl} Einträge dokumentiert`, data.metzReinigungAnzahl > 0 ? "ok" : "warn")}
    ${row("Öffnung Salate",           tageText(data.salatenTage, daysInMonth) + " eingetragen",         data.salatenTage > 0 ? "ok" : "warn")}
    ${row("Käsetheke Kontrolle",      tageText(data.kaesethekeTage, daysInMonth) + " geprüft",          data.kaesethekeTage > 0 ? "ok" : "warn")}
    ${row("Semmelliste",              tageText(data.semmellisteTage, daysInMonth) + " eingetragen",      data.semmellisteTage > 0 ? "ok" : "warn")}

    ${sectionHeader("Besprechungen & Unterweisungen")}
    ${row("Besprechungsprotokoll",    bespText,                                                           besprechungen.length > 0 ? "ok" : "neutral")}

    ${sectionHeader(`Quartalsweise Begehungen (Q${currentQuartal}/${year})`)}
    ${row("Betriebsbegehung",
      bbInQ.length > 0
        ? `Durchgeführt am ${formatDate(bbInQ[0].durchgefuehrt_am as string)}${bbInQ[0].durchgefuehrt_von ? ` von ${bbInQ[0].durchgefuehrt_von}` : ""}`
        : "Nicht dokumentiert",
      bbInQ.length > 0 ? "ok" : "warn"
    )}
    ${row("GQ-Begehung",
      gqInQ.length > 0
        ? `Durchgeführt am ${formatDate(gqInQ[0].durchgefuehrt_am as string)}`
        : "Nicht dokumentiert",
      gqInQ.length > 0 ? "ok" : "warn"
    )}

    ${sectionHeader("Sonstige")}
    ${row("Probeentnahmen",          data.probeAnzahl === 0 ? "Keine Probeentnahmen" : `${data.probeAnzahl} Probe${data.probeAnzahl > 1 ? "n" : ""} entnommen`, "neutral")}
    ${row("Produktfehlermeldungen",  data.fehlerAnzahl === 0 ? "Keine Meldungen" : `${data.fehlerAnzahl} Meldung${data.fehlerAnzahl > 1 ? "en" : ""} eingegangen`, data.fehlerAnzahl > 0 ? "warn" : "neutral")}
  </table>

  <!-- BESTÄTIGUNG & UNTERSCHRIFTEN -->
  <div style="margin-top:22px;font-size:11px;color:#374151;font-style:italic;border-left:3px solid #1a3a5c;padding:6px 10px;background:#f9fafb">
    Hiermit wird die sachgerechte Durchführung und Dokumentation der oben aufgeführten Kontrollen bestätigt.
  </div>

  <div style="margin-top:20px;display:flex;justify-content:space-between">
    <span class="sig">Datum &amp; Unterschrift Marktleitung</span>
    <span class="sig">Datum &amp; Unterschrift QM</span>
  </div>

  <div style="margin-top:18px;font-size:9px;color:#ccc;text-align:center">
    Automatisch generiert aus dem HACCP-System · ${monatName} ${year} · ${marktInfo.name}
  </div>
</div>
</body>
</html>`;
}

// ─── PREVIEW ─────────────────────────────────────────────────────────────────

router.get("/admin/monatsbericht/vorschau", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
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
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }

  const { marketId, jahr, monat, senden, empfaengerEmail: customEmail } = req.body;
  if (!marketId || !jahr || !monat) { res.status(400).json({ error: "marketId, jahr und monat sind erforderlich." }); return; }
  if (!MARKETS[marketId]) { res.status(400).json({ error: "Unbekannte Filiale." }); return; }

  try {
    const data = await aggregateMonthData(Number(marketId), Number(jahr), Number(monat));
    const html = generateHtml(data, Number(marketId), Number(jahr), Number(monat));
    let emailStatus: string | null = null;

    if (senden) {
      const configRows = await db.select().from(monatsberichtConfigTable).where(eq(monatsberichtConfigTable.marketId, Number(marketId)));
      const recipient = customEmail || configRows[0]?.empfaengerEmail;

      if (!recipient) {
        res.json({ success: true, html, emailStatus: "Kein Empfänger konfiguriert – E-Mail nicht gesendet." });
        return;
      }

      const transporter = await getTransporter(Number(marketId));
      if (!transporter) {
        res.json({ success: true, html, emailStatus: "E-Mail-Versand nicht konfiguriert (SMTP deaktiviert)." });
        return;
      }

      const globalRows = await db.select().from(emailSettingsTable).limit(1);
      const monatName = GERMAN_MONTHS[Number(monat)];
      const marktName = MARKETS[Number(marketId)].kurzname;

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
