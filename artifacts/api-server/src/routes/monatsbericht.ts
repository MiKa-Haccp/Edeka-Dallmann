import { Router, type IRouter } from "express";
import { db, pool, emailSettingsTable, marketEmailConfigsTable, monatsberichtConfigTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import cron from "node-cron";

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

// ─── BAYERISCHE FEIERTAGE ────────────────────────────────────────────────────

function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date); r.setDate(r.getDate() + days); return r;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getBavarianHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  return new Set([
    `${year}-01-01`, `${year}-01-06`, `${year}-05-01`,
    `${year}-08-15`, `${year}-10-03`, `${year}-11-01`,
    `${year}-12-25`, `${year}-12-26`,
    fmtDate(addDays(easter, -2)),  // Karfreitag
    fmtDate(easter),               // Ostersonntag
    fmtDate(addDays(easter, 1)),   // Ostermontag
    fmtDate(addDays(easter, 39)),  // Christi Himmelfahrt
    fmtDate(addDays(easter, 49)),  // Pfingstsonntag
    fmtDate(addDays(easter, 50)),  // Pfingstmontag
    fmtDate(addDays(easter, 60)),  // Fronleichnam
  ]);
}

function getWorkdaysInMonth(year: number, month: number): number {
  const holidays = getBavarianHolidays(year);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (date.getDay() !== 0 && !holidays.has(dateStr)) count++;
  }
  return count;
}

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
  const dateTo   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [
    reinigung, wareneingangOG, wareneingangMarkt, wareneingangMetzgerei,
    metzReinigung, oeffnungSalate, kaesetheke, semmelliste,
    tempLager, rindfleisch, trainingSessions,
    besprechung, betriebsbegehung, gqBegehung,
    probeentnahme, produktfehler,
  ] = await Promise.all([
    // 2.3 Tägliche Reinigung
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM reinigung_taeglich
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ),
    // 2.2 Wareneingang O&G
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM wareneingang_og
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ),
    // 2.1 Wareneingang allgemein
    pool.query(
      `SELECT COUNT(DISTINCT we.day) AS tage
       FROM wareneingang_entries we
       JOIN wareneingang_types wt ON we.type_id=wt.id
       WHERE we.market_id=$1 AND we.year=$2 AND we.month=$3
         AND wt.section='wareneingaenge'`,
      [marketId, year, month]
    ),
    // 3.1 Wareneingang Metzgerei
    pool.query(
      `SELECT COUNT(DISTINCT we.day) AS tage
       FROM wareneingang_entries we
       JOIN wareneingang_types wt ON we.type_id=wt.id
       WHERE we.market_id=$1 AND we.year=$2 AND we.month=$3
         AND wt.section='metzgerei'`,
      [marketId, year, month]
    ),
    // 3.2 Metzgerei Reinigung
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM metz_reinigung
       WHERE market_id=$1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ),
    // 3.3 Öffnung Salate
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM oeffnung_salate
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ),
    // 3.4 Käsetheke Kontrolle
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM kaesetheke_kontrolle
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ),
    // Semmelliste
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM semmelliste
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ).catch(() => ({ rows: [{ tage: "0" }] })),
    // Temperatur-Lagerkontrolle
    pool.query(
      `SELECT COUNT(DISTINCT day) AS tage FROM temp_lager_kontrolle
       WHERE market_id=$1 AND year=$2 AND month=$3`,
      [marketId, year, month]
    ).catch(() => ({ rows: [{ tage: "0" }] })),
    // Rindfleisch-Etikettierung
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM rindfleisch_etiketten
       WHERE market_id=$1 AND datum BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ).catch(() => ({ rows: [{ anzahl: "0" }] })),
    // 1.4 Schulungen / Besprechungen (training sessions)
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM training_sessions
       WHERE market_id=$1 AND session_date BETWEEN $2 AND $3`,
      [marketId, dateFrom, dateTo]
    ).catch(() => ({ rows: [{ anzahl: "0" }] })),
    // Besprechungsprotokoll
    pool.query(
      `SELECT datum, thema FROM besprechungsprotokoll
       WHERE market_id=$1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    // 1.6 Betriebsbegehung (ganzes Jahr, Quartal im Generator)
    pool.query(
      `SELECT quartal, durchgefuehrt_am, durchgefuehrt_von
       FROM betriebsbegehung
       WHERE (market_id=$1 OR market_id IS NULL) AND year=$2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // 3.8 GQ-Begehung
    pool.query(
      `SELECT quartal, durchgefuehrt_am
       FROM gq_begehung
       WHERE (market_id=$1 OR market_id IS NULL) AND year=$2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // Probeentnahmen
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM probeentnahme
       WHERE market_id=$1 AND created_at BETWEEN $2 AND $3`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    // Produktfehlermeldungen
    pool.query(
      `SELECT COUNT(*) AS anzahl FROM produktfehlermeldung
       WHERE market_id=$1 AND created_at BETWEEN $2 AND $3`,
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
    tempLagerTage:        parseInt(tempLager.rows[0]?.tage ?? "0", 10),
    rindfleischAnzahl:    parseInt(rindfleisch.rows[0]?.anzahl ?? "0", 10),
    trainingAnzahl:       parseInt(trainingSessions.rows[0]?.anzahl ?? "0", 10),
    besprechung:          besprechung.rows as Record<string, unknown>[],
    betriebsbegehung:     betriebsbegehung.rows as Record<string, unknown>[],
    gqBegehung:           gqBegehung.rows as Record<string, unknown>[],
    probeAnzahl:          parseInt(probeentnahme.rows[0]?.anzahl ?? "0", 10),
    fehlerAnzahl:         parseInt(produktfehler.rows[0]?.anzahl ?? "0", 10),
  };
}

// ─── HTML GENERATOR ───────────────────────────────────────────────────────────

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

function tageText(tage: number, workdays: number): string {
  if (tage === 0) return "Keine Einträge";
  if (tage >= workdays) return `an allen ${workdays} Werktagen`;
  return `an ${tage} von ${workdays} Werktagen`;
}

function generateHtml(
  data: Awaited<ReturnType<typeof aggregateMonthData>>,
  marketId: number, year: number, month: number
): string {
  const marktInfo   = MARKETS[marketId] || { name: "Unbekannte Filiale", kurzname: "?" };
  const monatName   = GERMAN_MONTHS[month];
  const daysInMonth = new Date(year, month, 0).getDate();
  const workdays    = getWorkdaysInMonth(year, month);
  const currentQ    = Math.ceil(month / 3);

  const bbInQ = data.betriebsbegehung.filter(r => Number(r.quartal) === currentQ);
  const gqInQ = data.gqBegehung.filter(r => Number(r.quartal) === currentQ);

  const bespText = data.besprechung.length === 0
    ? "Keine Besprechungen"
    : data.besprechung.length === 1
      ? `1 Besprechung am ${formatDate(data.besprechung[0].datum as string)}${data.besprechung[0].thema ? ` – ${data.besprechung[0].thema}` : ""}`
      : `${data.besprechung.length} Besprechungen (${data.besprechung.map(b => formatDate(b.datum as string)).join(", ")})`;

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
  @media print { body { font-size: 11px; } .page { padding: 12px 14px; } }
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
        <div style="font-size:9px;color:#aaa;margin-top:2px">Erstellt: ${new Date().toLocaleDateString("de-DE")} · ${workdays} Werktage (ohne So./Feiertage)</div>
      </td>
    </tr>
  </table>
  <div style="border-top:3px solid #1a3a5c;margin-bottom:16px"></div>

  <!-- ÜBERSICHTSTABELLE -->
  <table>

    ${sectionHeader("1 – Allgemeiner Markt")}
    ${row("2.3 Tägliche Reinigung",
      tageText(data.reinigungTage, workdays) + " durchgeführt",
      data.reinigungTage >= workdays ? "ok" : data.reinigungTage > 0 ? "neutral" : "warn")}
    ${row("2.1 Wareneingang Markt",
      tageText(data.weMarktTage, workdays) + " geprüft",
      data.weMarktTage >= workdays ? "ok" : data.weMarktTage > 0 ? "neutral" : "warn")}
    ${row("2.2 Wareneingang Obst &amp; Gemüse",
      tageText(data.weOGTage, workdays) + " geprüft",
      data.weOGTage >= workdays ? "ok" : data.weOGTage > 0 ? "neutral" : "warn")}
    ${data.tempLagerTage > 0 || true ? row("Temperatur-Lagerkontrolle",
      tageText(data.tempLagerTage, workdays) + " kontrolliert",
      data.tempLagerTage >= workdays ? "ok" : data.tempLagerTage > 0 ? "neutral" : "warn") : ""}

    ${sectionHeader("3 – Metzgerei / Frischetheke")}
    ${row("3.1 Wareneingang Metzgerei",
      tageText(data.weMetzgereiTage, workdays) + " geprüft",
      data.weMetzgereiTage >= workdays ? "ok" : data.weMetzgereiTage > 0 ? "neutral" : "warn")}
    ${row("3.2 Reinigung Metzgerei",
      data.metzReinigungAnzahl === 0 ? "Keine Einträge" : `${data.metzReinigungAnzahl} Einträge dokumentiert`,
      data.metzReinigungAnzahl > 0 ? "ok" : "warn")}
    ${row("3.3 Öffnung Salate",
      tageText(data.salatenTage, workdays) + " eingetragen",
      data.salatenTage >= workdays ? "ok" : data.salatenTage > 0 ? "neutral" : "warn")}
    ${row("3.4 Käsetheke Kontrolle",
      tageText(data.kaesethekeTage, workdays) + " geprüft",
      data.kaesethekeTage >= workdays ? "ok" : data.kaesethekeTage > 0 ? "neutral" : "warn")}
    ${row("Semmelliste",
      tageText(data.semmellisteTage, workdays) + " eingetragen",
      data.semmellisteTage >= workdays ? "ok" : data.semmellisteTage > 0 ? "neutral" : "warn")}
    ${data.rindfleischAnzahl > 0 ? row("Rindfleisch-Etikettierung",
      `${data.rindfleischAnzahl} Etikett${data.rindfleischAnzahl !== 1 ? "en" : ""} dokumentiert`,
      "ok") : row("Rindfleisch-Etikettierung", "Keine Einträge", "neutral")}

    ${sectionHeader("1.4 – Schulungen &amp; Besprechungen")}
    ${row("Schulungsnachweis (Training Sessions)",
      data.trainingAnzahl === 0 ? "Keine Schulungen" : `${data.trainingAnzahl} Schulung${data.trainingAnzahl !== 1 ? "en" : ""} dokumentiert`,
      data.trainingAnzahl > 0 ? "ok" : "neutral")}
    ${row("Besprechungsprotokoll", bespText, data.besprechung.length > 0 ? "ok" : "neutral")}

    ${sectionHeader(`1.6 / 3.8 – Quartalsbegehungen (Q${currentQ}/${year})`)}
    ${row("1.6 Betriebsbegehung",
      bbInQ.length > 0
        ? `Durchgeführt am ${formatDate(bbInQ[0].durchgefuehrt_am as string)}${bbInQ[0].durchgefuehrt_von ? ` von ${bbInQ[0].durchgefuehrt_von}` : ""}`
        : "Noch nicht dokumentiert",
      bbInQ.length > 0 ? "ok" : month % 3 === 0 ? "warn" : "neutral")}
    ${row("3.8 GQ-Begehung",
      gqInQ.length > 0
        ? `Durchgeführt am ${formatDate(gqInQ[0].durchgefuehrt_am as string)}`
        : "Noch nicht dokumentiert",
      gqInQ.length > 0 ? "ok" : month % 3 === 0 ? "warn" : "neutral")}

    ${sectionHeader("Ereignisse &amp; Vorfälle")}
    ${row("Probeentnahmen",
      data.probeAnzahl === 0 ? "Keine Probeentnahmen" : `${data.probeAnzahl} Probe${data.probeAnzahl > 1 ? "n" : ""} entnommen`,
      "neutral")}
    ${row("Produktfehlermeldungen",
      data.fehlerAnzahl === 0 ? "Keine Meldungen" : `${data.fehlerAnzahl} Meldung${data.fehlerAnzahl > 1 ? "en" : ""} eingegangen`,
      data.fehlerAnzahl > 0 ? "warn" : "neutral")}

  </table>

  <!-- HINWEIS -->
  <div style="margin-top:14px;font-size:10px;color:#6b7280;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:8px 10px">
    <strong>Werktage ${monatName} ${year}:</strong> ${workdays} Tage (${daysInMonth} Kalendertage abzüglich Sonntage und bayerische Feiertage).
    Grün ✓ = vollständig dokumentiert · Grau – = keine Pflicht oder keine Einträge · Rot ✗ = fehlende Dokumentation
  </div>

  <!-- BESTÄTIGUNG & UNTERSCHRIFTEN -->
  <div style="margin-top:16px;font-size:11px;color:#374151;font-style:italic;border-left:3px solid #1a3a5c;padding:6px 10px;background:#f0f4fa">
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
  const year     = parseInt(req.query.jahr as string);
  const month    = parseInt(req.query.monat as string);
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

async function sendMonatsbericht(marketId: number, year: number, month: number, recipient: string): Promise<string> {
  const data = await aggregateMonthData(marketId, year, month);
  const html = generateHtml(data, marketId, year, month);
  const transporter = await getTransporter(marketId);
  if (!transporter) return "SMTP nicht konfiguriert – E-Mail nicht gesendet.";

  const globalRows = await db.select().from(emailSettingsTable).limit(1);
  const monatName  = GERMAN_MONTHS[month];
  const marktName  = MARKETS[marketId].kurzname;

  await transporter.sendMail({
    from: `"EDEKA Dallmann HACCP" <${globalRows[0]?.smtpUser}>`,
    to: recipient,
    subject: `HACCP Monatsbericht ${monatName} ${year} – ${marktName}`,
    html,
    attachments: [{
      filename: `HACCP_Monatsbericht_${marktName}_${year}_${String(month).padStart(2, "0")}.html`,
      content: html,
      contentType: "text/html",
    }],
  });

  return `Erfolgreich gesendet an: ${recipient}`;
}

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
      const recipient  = customEmail || configRows[0]?.empfaengerEmail;
      if (!recipient) {
        res.json({ success: true, html, emailStatus: "Kein Empfänger konfiguriert – E-Mail nicht gesendet." });
        return;
      }
      emailStatus = await sendMonatsbericht(Number(marketId), Number(jahr), Number(monat), recipient);
    }

    res.json({ success: true, html, emailStatus });
  } catch (err) {
    console.error("Monatsbericht Generieren Fehler:", err);
    res.status(500).json({ error: "Fehler beim Generieren des Monatsberichts." });
  }
});

// ─── AUTO-SEND CRON (täglich 06:00) ─────────────────────────────────────────

export function startMonatsberichtCron() {
  cron.schedule("0 6 * * *", async () => {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const configs = await db.select().from(monatsberichtConfigTable);
    for (const cfg of configs) {
      if (!cfg.autoSend || !cfg.isActive || cfg.sendDay !== dayOfMonth) continue;
      if (!cfg.empfaengerEmail) continue;
      if (!MARKETS[cfg.marketId]) continue;

      const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth();
      const prevYear  = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

      try {
        const status = await sendMonatsbericht(cfg.marketId, prevYear, prevMonth, cfg.empfaengerEmail);
        console.log(`[Monatsbericht] ${MARKETS[cfg.marketId].kurzname}: ${status}`);
      } catch (e) {
        console.error(`[Monatsbericht] Fehler für Markt ${cfg.marketId}:`, e);
      }
    }
  }, { timezone: "Europe/Berlin" });

  console.log("[Monatsbericht] Auto-Send Cron gestartet (täglich 06:00 Uhr).");
}

export default router;
