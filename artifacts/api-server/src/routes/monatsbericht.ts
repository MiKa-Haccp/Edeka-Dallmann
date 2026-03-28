import { Router, type IRouter } from "express";
import { db, pool, emailSettingsTable, marketEmailConfigsTable, monatsberichtConfigTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const MARKETS: Record<number, { name: string; kurzname: string }> = {
  1: { name: "EDEKA Dallmann – Leeder",       kurzname: "Leeder"        },
  2: { name: "EDEKA Dallmann – Buching",      kurzname: "Buching"       },
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
    // Tägliche Reinigung
    pool.query(
      `SELECT day, area, STRING_AGG(DISTINCT kuerzel, ', ' ORDER BY kuerzel) AS kuerzel_list
       FROM reinigung_taeglich
       WHERE market_id = $1 AND year = $2 AND month = $3
       GROUP BY day, area ORDER BY day, area`,
      [marketId, year, month]
    ),
    // Wareneingang O&G
    pool.query(
      `SELECT day, kuerzel, temp_celsius, hygiene, etikettierung, qualitaet, mhd, notizen
       FROM wareneingang_og
       WHERE market_id = $1 AND year = $2 AND month = $3
       ORDER BY day`,
      [marketId, year, month]
    ),
    // MHD Kontrolle
    pool.query(
      `SELECT datum, bereich, artikel, mhd_datum, menge, aktion, kuerzel
       FROM mhd_kontrolle
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    // Metzgerei Reinigung
    pool.query(
      `SELECT datum, item_key, kuerzel
       FROM metz_reinigung
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    // Besprechungsprotokoll
    pool.query(
      `SELECT datum, leiter_name, thema
       FROM besprechungsprotokoll
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ),
    // Betriebsbegehung (aktuelles Jahr)
    pool.query(
      `SELECT quartal, year, durchgefuehrt_am, durchgefuehrt_von
       FROM betriebsbegehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // GQ-Begehung (aktuelles Jahr)
    pool.query(
      `SELECT quartal, year, durchgefuehrt_am, kuerzel
       FROM gq_begehung
       WHERE (market_id = $1 OR market_id IS NULL) AND year = $2
       ORDER BY quartal`,
      [marketId, year]
    ),
    // Probeentnahme
    pool.query(
      `SELECT created_at, ansprechpartner, uebergabe_ort_datum
       FROM probeentnahme
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3
       ORDER BY created_at`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    // Produktfehlermeldungen
    pool.query(
      `SELECT created_at, markenname, erkennung_durch, fehlerbeschreibung
       FROM produktfehlermeldung
       WHERE market_id = $1 AND created_at BETWEEN $2 AND $3
       ORDER BY created_at`,
      [marketId, `${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]
    ),
    // Ware Einräumservice
    pool.query(
      `SELECT datum, lieferant, bereich, kuerzel
       FROM ware_einraeumservice
       WHERE market_id = $1 AND datum BETWEEN $2 AND $3
       ORDER BY datum`,
      [marketId, dateFrom, dateTo]
    ).catch(() => ({ rows: [] })),
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

// ─── HTML GENERATOR ───────────────────────────────────────────────────────────

function formatDate(s: string | null | undefined): string {
  if (!s) return "–";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("de-DE");
}

function td(v: unknown): string {
  const val = (v === null || v === undefined || v === "") ? "–" : String(v);
  return `<td>${val}</td>`;
}

function sectionHeader(title: string, color = "#1a3a5c"): string {
  return `<tr><td colspan="99" style="background:${color};color:#fff;font-weight:bold;font-size:13px;padding:6px 8px;letter-spacing:.3px">${title}</td></tr>`;
}

function emptyRow(cols: number, msg = "Keine Einträge im Berichtsmonat"): string {
  return `<tr><td colspan="${cols}" style="color:#888;font-style:italic;padding:6px 8px">${msg}</td></tr>`;
}

function generateHtml(
  data: Awaited<ReturnType<typeof aggregateMonthData>>,
  marketId: number,
  year: number,
  month: number
): string {
  const marktInfo = MARKETS[marketId] || { name: "Unbekannte Filiale", kurzname: "?" };
  const monatName = GERMAN_MONTHS[month];

  // Build reinigung table: days as columns, areas as rows
  const reinigungByArea: Record<string, Record<number, string>> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (const row of data.reinigung) {
    if (!reinigungByArea[row.area]) reinigungByArea[row.area] = {};
    reinigungByArea[row.area][row.day] = row.kuerzel_list;
  }
  const areas = Object.keys(reinigungByArea).sort();

  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `<th>${i + 1}</th>`).join("");
  const reinigungRows = areas.map(area => {
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const v = reinigungByArea[area][i + 1];
      return `<td style="text-align:center;font-size:9px">${v || ""}</td>`;
    }).join("");
    return `<tr><td style="white-space:nowrap;font-weight:600;font-size:10px;min-width:100px">${area}</td>${dayCells}</tr>`;
  }).join("");

  // Quartals-Check for Betriebsbegehung
  const currentQuartal = Math.ceil(month / 3);
  const bbInQuartal = data.betriebsbegehung.filter((b: Record<string, unknown>) => Number(b.quartal) === currentQuartal);
  const gqInQuartal = data.gqBegehung.filter((g: Record<string, unknown>) => Number(g.quartal) === currentQuartal);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Monatsbericht ${monatName} ${year} – ${marktInfo.kurzname}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .page { max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 18px; font-weight: bold; color: #1a3a5c; margin-bottom: 2px; }
  h2 { font-size: 11px; font-weight: normal; color: #555; margin-bottom: 16px; }
  .header-bar { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0 14px; border-bottom: 3px solid #1a3a5c; margin-bottom: 20px; }
  .logo-area { font-size: 22px; font-weight: 900; color: #e31e26; letter-spacing: -0.5px; }
  .logo-area span { color: #1a3a5c; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
  th { background: #e8edf3; color: #1a3a5c; font-weight: bold; padding: 4px 6px; border: 1px solid #ccc; text-align: left; font-size: 10px; }
  td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .section-title { font-size: 14px; font-weight: bold; color: #1a3a5c; border-left: 4px solid #e31e26; padding: 4px 8px; margin: 20px 0 8px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .summary-card { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .summary-card .val { font-size: 24px; font-weight: 900; color: #1a3a5c; line-height: 1; margin-bottom: 4px; }
  .summary-card .lbl { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: .3px; }
  .footer { border-top: 2px solid #1a3a5c; margin-top: 30px; padding-top: 16px; }
  .sig-row { display: flex; gap: 30px; margin-top: 10px; }
  .sig-box { flex: 1; border-bottom: 1px solid #555; padding-top: 40px; font-size: 10px; color: #555; text-align: center; }
  .badge-ok { color: #16a34a; font-weight: bold; }
  .badge-warn { color: #d97706; font-weight: bold; }
  .badge-nok { color: #dc2626; font-weight: bold; }
  .scroll-x { overflow-x: auto; }
  @media print {
    .page { padding: 10px; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header-bar">
    <div>
      <div class="logo-area">EDEKA <span>Dallmann</span></div>
      <div style="font-size:10px;color:#555;margin-top:2px">${marktInfo.name}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:bold;color:#1a3a5c">HACCP Monatsbericht</div>
      <div style="font-size:13px;color:#e31e26;font-weight:bold">${monatName} ${year}</div>
      <div style="font-size:9px;color:#888;margin-top:2px">Erstellt am: ${new Date().toLocaleDateString("de-DE")} ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  </div>

  <!-- ZUSAMMENFASSUNG -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="val">${data.reinigung.length > 0 ? [...new Set(data.reinigung.map((r: Record<string, unknown>) => r.day))].length : 0}</div>
      <div class="lbl">Reinigungstage</div>
    </div>
    <div class="summary-card">
      <div class="val">${data.wareneingangOG.length}</div>
      <div class="lbl">WE O&amp;G</div>
    </div>
    <div class="summary-card">
      <div class="val">${data.mhdKontrolle.length}</div>
      <div class="lbl">MHD-Prüfungen</div>
    </div>
    <div class="summary-card">
      <div class="val">${data.besprechung.length}</div>
      <div class="lbl">Besprechungen</div>
    </div>
  </div>

  <!-- 1. TÄGLICHE REINIGUNG -->
  <div class="section-title">1. Tägliche Reinigung</div>
  ${areas.length === 0 ? '<p style="color:#888;font-style:italic;margin-bottom:20px">Keine Einträge im Berichtsmonat.</p>' : `
  <div class="scroll-x">
  <table>
    <thead>
      <tr>
        <th style="min-width:100px">Bereich</th>
        ${dayHeaders}
      </tr>
    </thead>
    <tbody>
      ${reinigungRows}
    </tbody>
  </table>
  </div>`}

  <!-- 2. WARENEINGANG O&G -->
  <div class="section-title">2. Wareneingang Obst &amp; Gemüse</div>
  <table>
    <thead>
      <tr>
        <th>Tag</th><th>Kürzel</th><th>Temp (°C)</th><th>Hygiene</th><th>Etikettierung</th><th>Qualität</th><th>MHD</th><th>Notizen</th>
      </tr>
    </thead>
    <tbody>
      ${data.wareneingangOG.length === 0 ? emptyRow(8) : data.wareneingangOG.map((r: Record<string, unknown>) => `
      <tr>
        ${td(r.day)}${td(r.kuerzel)}${td(r.temp_celsius ? `${r.temp_celsius} °C` : "–")}
        ${td(r.hygiene)}${td(r.etikettierung)}${td(r.qualitaet)}${td(r.mhd)}${td(r.notizen)}
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- 3. MHD-KONTROLLE -->
  <div class="section-title">3. MHD-Kontrolle</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Bereich</th><th>Artikel</th><th>MHD</th><th>Menge</th><th>Aktion</th><th>Kürzel</th></tr>
    </thead>
    <tbody>
      ${data.mhdKontrolle.length === 0 ? emptyRow(7) : data.mhdKontrolle.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.datum as string))}${td(r.bereich)}${td(r.artikel)}${td(formatDate(r.mhd_datum as string))}${td(r.menge)}
        <td><span class="${r.aktion === "aussortiert" ? "badge-nok" : r.aktion === "reduziert" ? "badge-warn" : "badge-ok"}">${r.aktion || "–"}</span></td>
        ${td(r.kuerzel)}
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- 4. METZGEREI REINIGUNG -->
  <div class="section-title">4. Metzgerei – Reinigung</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Reinigungsposition</th><th>Kürzel</th></tr>
    </thead>
    <tbody>
      ${data.metzReinigung.length === 0 ? emptyRow(3) : data.metzReinigung.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.datum as string))}${td(r.item_key)}${td(r.kuerzel)}
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- 5. BESPRECHUNGSPROTOKOLL -->
  <div class="section-title">5. Besprechungen / Unterweisungen</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Leitung</th><th>Thema</th></tr>
    </thead>
    <tbody>
      ${data.besprechung.length === 0 ? emptyRow(3) : data.besprechung.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.datum as string))}${td(r.leiter_name)}${td(r.thema)}
      </tr>`).join("")}
    </tbody>
  </table>

  <!-- 6. BETRIEBSBEGEHUNG -->
  <div class="section-title">6. Betriebsbegehung (Quartal ${currentQuartal}/${year})</div>
  <table>
    <thead>
      <tr><th>Quartal</th><th>Durchgeführt am</th><th>Durchgeführt von</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${bbInQuartal.length === 0 ? emptyRow(4, "Keine Betriebsbegehung in diesem Quartal dokumentiert.") :
        bbInQuartal.map((r: Record<string, unknown>) => `
        <tr>
          ${td(`Q${r.quartal}/${r.year}`)}${td(formatDate(r.durchgefuehrt_am as string))}${td(r.durchgefuehrt_von)}
          <td><span class="badge-ok">✓ Durchgeführt</span></td>
        </tr>`).join("")}
    </tbody>
  </table>

  <!-- 7. GQ-BEGEHUNG -->
  <div class="section-title">7. GQ-Begehung (Quartal ${currentQuartal}/${year})</div>
  <table>
    <thead>
      <tr><th>Quartal</th><th>Durchgeführt am</th><th>Kürzel</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${gqInQuartal.length === 0 ? emptyRow(4, "Keine GQ-Begehung in diesem Quartal dokumentiert.") :
        gqInQuartal.map((r: Record<string, unknown>) => `
        <tr>
          ${td(`Q${r.quartal}/${r.year}`)}${td(formatDate(r.durchgefuehrt_am as string))}${td(r.kuerzel)}
          <td><span class="badge-ok">✓ Durchgeführt</span></td>
        </tr>`).join("")}
    </tbody>
  </table>

  <!-- 8. WARE EINRÄUMSERVICE -->
  ${data.wareEinraeumservice.length > 0 ? `
  <div class="section-title">8. Ware Einräumservice (Fremdpersonal)</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Lieferant</th><th>Bereich</th><th>Kürzel</th></tr>
    </thead>
    <tbody>
      ${data.wareEinraeumservice.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.datum as string))}${td(r.lieferant)}${td(r.bereich)}${td(r.kuerzel)}
      </tr>`).join("")}
    </tbody>
  </table>` : ""}

  <!-- 9. PROBEENTNAHME -->
  ${data.probeentnahme.length > 0 ? `
  <div class="section-title">9. Probeentnahmen</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Ansprechpartner</th><th>Übergabe Ort/Datum</th></tr>
    </thead>
    <tbody>
      ${data.probeentnahme.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.created_at as string))}${td(r.ansprechpartner)}${td(r.uebergabe_ort_datum)}
      </tr>`).join("")}
    </tbody>
  </table>` : ""}

  <!-- 10. PRODUKTFEHLERMELDUNGEN -->
  ${data.produktfehler.length > 0 ? `
  <div class="section-title">10. Produktfehlermeldungen</div>
  <table>
    <thead>
      <tr><th>Datum</th><th>Produkt</th><th>Erkannt durch</th><th>Beschreibung</th></tr>
    </thead>
    <tbody>
      ${data.produktfehler.map((r: Record<string, unknown>) => `
      <tr>
        ${td(formatDate(r.created_at as string))}${td(r.markenname)}${td(r.erkennung_durch)}${td(r.fehlerbeschreibung)}
      </tr>`).join("")}
    </tbody>
  </table>` : ""}

  <!-- FOOTER / UNTERSCHRIFTEN -->
  <div class="footer">
    <div style="font-size:10px;color:#555;margin-bottom:8px">
      Dieser Monatsbericht wurde automatisch aus dem HACCP-System generiert. Alle Einträge basieren auf den im System gespeicherten Daten für ${monatName} ${year}.
    </div>
    <div class="sig-row">
      <div class="sig-box">Datum, Unterschrift Marktleitung</div>
      <div class="sig-box">Datum, Unterschrift QM-Verantwortliche/r</div>
      <div class="sig-box">Datum, Unterschrift Abteilungsleitung</div>
    </div>
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
      // Determine recipient
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

      await transporter.sendMail({
        from: `"EDEKA Dallmann HACCP" <${(await db.select().from(emailSettingsTable).limit(1))[0]?.smtpUser}>`,
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
