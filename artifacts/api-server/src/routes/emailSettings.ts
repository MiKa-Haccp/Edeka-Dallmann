import { Router, type IRouter } from "express";
import { db, emailSettingsTable, marketEmailConfigsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const MARKETS: Record<number, { name: string; email: string }> = {
  1: { name: "Leeder",        email: "markt@edeka-dallmann.de" },
  2: { name: "Buching",       email: "markt-buching@edeka-dallmann.de" },
  3: { name: "Marktoberdorf", email: "markt-mod@edeka-dallmann.de" },
};

async function verifySuperAdmin(adminEmail: string): Promise<boolean> {
  if (!adminEmail) return false;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail.toLowerCase()));
  return users.length > 0 && users[0].role === "SUPERADMIN";
}

async function getGlobalSettings() {
  const rows = await db.select().from(emailSettingsTable).limit(1);
  if (rows.length === 0) {
    const inserted = await db.insert(emailSettingsTable).values({}).returning();
    return inserted[0];
  }
  return rows[0];
}

async function getMarketConfig(marketId: number) {
  const rows = await db.select().from(marketEmailConfigsTable).where(eq(marketEmailConfigsTable.marketId, marketId));
  return rows[0] || null;
}

async function buildTransporter(global: typeof emailSettingsTable.$inferSelect, marketConfig?: typeof marketEmailConfigsTable.$inferSelect | null) {
  const user = marketConfig?.smtpUser || global.smtpUser;
  const pass = marketConfig?.smtpPass || global.smtpPass;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: global.smtpHost,
    port: global.smtpPort,
    secure: global.smtpPort === 465,
    auth: { user, pass },
  });
}

function buildFromAddress(global: typeof emailSettingsTable.$inferSelect, marketConfig?: typeof marketEmailConfigsTable.$inferSelect | null) {
  const user = marketConfig?.smtpUser || global.smtpUser;
  const name = marketConfig?.fromName || global.fromName || "EDEKA Dallmann HACCP";
  return `"${name}" <${user}>`;
}

// ─── GLOBAL SETTINGS ────────────────────────────────────────────────────────

router.get("/admin/email-settings", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const s = await getGlobalSettings();
  const { smtpPass, ...safe } = s;
  res.json({ ...safe, hasPassword: !!smtpPass });
});

router.put("/admin/email-settings", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const { smtpHost, smtpPort, smtpPass, fromName, defaultRecipient, enabled } = req.body as any;
  const existing = await getGlobalSettings();
  const upd: Partial<typeof emailSettingsTable.$inferInsert> = { updatedAt: new Date() };
  if (smtpHost !== undefined) upd.smtpHost = smtpHost;
  if (smtpPort !== undefined) upd.smtpPort = smtpPort;
  if (smtpPass !== undefined && smtpPass !== "") upd.smtpPass = smtpPass;
  if (fromName !== undefined) upd.fromName = fromName;
  if (defaultRecipient !== undefined) upd.defaultRecipient = defaultRecipient;
  if (enabled !== undefined) upd.enabled = enabled;
  const updated = await db.update(emailSettingsTable).set(upd).where(eq(emailSettingsTable.id, existing.id)).returning();
  const { smtpPass: _, ...safe } = updated[0];
  res.json({ ...safe, hasPassword: !!updated[0].smtpPass });
});

// ─── MARKET SETTINGS ─────────────────────────────────────────────────────────

router.get("/admin/market-email-configs", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const all = await db.select().from(marketEmailConfigsTable);
  const result = all.map(({ smtpPass, ...safe }) => ({ ...safe, hasPassword: !!smtpPass }));
  res.json(result);
});

router.put("/admin/market-email-configs/:marketId", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const marketId = parseInt(req.params.marketId);
  if (![1, 2, 3].includes(marketId)) { res.status(400).json({ error: "Ungültige Markt-ID." }); return; }
  const { smtpUser, smtpPass, fromName } = req.body as any;
  const existing = await getMarketConfig(marketId);
  if (!existing) {
    const ins = await db.insert(marketEmailConfigsTable).values({
      marketId,
      smtpUser: smtpUser || null,
      smtpPass: smtpPass && smtpPass !== "" ? smtpPass : null,
      fromName: fromName || null,
    }).returning();
    const { smtpPass: _, ...safe } = ins[0];
    res.json({ ...safe, hasPassword: !!ins[0].smtpPass });
    return;
  }
  const upd: Partial<typeof marketEmailConfigsTable.$inferInsert> = { updatedAt: new Date() };
  if (smtpUser !== undefined) upd.smtpUser = smtpUser;
  if (smtpPass !== undefined && smtpPass !== "") upd.smtpPass = smtpPass;
  if (fromName !== undefined) upd.fromName = fromName;
  const updated = await db.update(marketEmailConfigsTable).set(upd).where(eq(marketEmailConfigsTable.marketId, marketId)).returning();
  const { smtpPass: _, ...safe } = updated[0];
  res.json({ ...safe, hasPassword: !!updated[0].smtpPass });
});

router.post("/admin/email-settings/test", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const marketId = req.body?.marketId ? parseInt(req.body.marketId) : null;
  const global = await getGlobalSettings();
  const marketConfig = marketId ? await getMarketConfig(marketId) : null;
  const transporter = await buildTransporter(global, marketConfig);
  if (!transporter) { res.status(400).json({ error: "Zugangsdaten nicht vollständig konfiguriert." }); return; }
  const fromUser = marketConfig?.smtpUser || global.smtpUser;
  const fromName = marketConfig?.fromName || global.fromName || "EDEKA Dallmann HACCP";
  const label = marketId ? `Markt ${MARKETS[marketId]?.name || marketId}` : "Global";
  try {
    const testRecipient = "kai.martin@edeka-dallmann.de";
    await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: testRecipient,
      subject: `HACCP System – Test-E-Mail (${label})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1a3a6b;color:white;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">EDEKA Dallmann – HACCP System</h2><p style="margin:4px 0 0;opacity:0.8;font-size:13px;">Test-E-Mail · ${label}</p></div><div style="background:#f8f9fa;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;"><p style="color:#374151;">Die E-Mail-Konfiguration für <strong>${label}</strong> ist erfolgreich.</p><p style="color:#6b7280;font-size:13px;">Absender: ${fromUser}</p></div></div>`,
    });
    res.json({ success: true, message: `Test-E-Mail von ${fromUser} an ${testRecipient} gesendet.` });
  } catch (err: any) {
    res.status(500).json({ error: `SMTP-Fehler: ${err.message}` });
  }
});

// ─── SEND EMAILS ─────────────────────────────────────────────────────────────

function buildEmailHtml(title: string, subtitle: string, sections: { heading: string; rows: [string, string][] }[]): string {
  const rowsHtml = sections.map(s => `
    <h3 style="color:#1a3a6b;font-size:14px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:16px 0 6px;">${s.heading}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${s.rows.map(([k, v]) => `<tr><td style="padding:3px 0;color:#6b7280;width:42%;">${k}</td><td style="padding:3px 0;font-weight:${v ? '600' : '400'};color:${v ? '#111' : '#9ca3af'};">${v || '–'}</td></tr>`).join('')}
    </table>
  `).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#1a3a6b;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:19px;">${title}</h2>
      <p style="margin:5px 0 0;opacity:0.8;font-size:13px;">${subtitle}</p>
    </div>
    <div style="background:#fff;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
      ${rowsHtml}
      <p style="font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px;margin-top:16px;">Diese E-Mail wurde automatisch vom HACCP-System von EDEKA Dallmann erstellt.</p>
    </div>
  </div>`;
}

const jaNein = (v: boolean | null | undefined) => v === true ? "Ja" : v === false ? "Nein" : "–";
const val = (v: any) => String(v || "").trim() || "–";

router.post("/send-produktfehlermeldung-email", async (req, res) => {
  const { reportId, marketId, formData, marktName } = req.body as { reportId: number; marketId?: number; formData: Record<string, any>; marktName: string };
  const global = await getGlobalSettings();
  if (!global.enabled) { res.status(400).json({ error: "E-Mail-Versand ist nicht aktiviert. Superadministrator kontaktieren." }); return; }
  const marketConfig = marketId ? await getMarketConfig(marketId) : null;
  const transporter = await buildTransporter(global, marketConfig);
  if (!transporter || !global.defaultRecipient) { res.status(400).json({ error: "E-Mail-Konfiguration unvollständig." }); return; }
  const html = buildEmailHtml(
    "Produktfehlermeldung 3.14",
    `EDEKA Dallmann – ${marktName} | Meldungs-ID: ${reportId}`,
    [
      { heading: "Marktdaten", rows: [
        ["Markt", val(formData.markt)], ["Ansprechpartner", val(formData.ansprechpartner)],
        ["Telefon", val(formData.telefon)], ["E-Mail", val(formData.email)],
        ["Erkannt durch", formData.erkennungDurch === "markt" ? "Markt" : formData.erkennungDurch === "verbraucher" ? "Verbraucher" : "–"],
      ]},
      { heading: "Produktdaten", rows: [
        ["Markenname / Produkt", val(formData.markenname)], ["EAN", val(formData.einzelEan)],
        ["MHD", val(formData.mhd)], ["Losnummer", val(formData.losnummer)],
        ["Lieferantencode", val(formData.lieferantencode)],
        ["Belieferungsart", formData.belieferungsart === "strecke" ? "Strecke" : formData.belieferungsart === "grosshandel" ? `Großhandel (${val(formData.grosshandelsstandort)})` : "–"],
      ]},
      { heading: "Fehlerbeschreibung", rows: [["Beschreibung", val(formData.fehlerbeschreibung)]] },
      { heading: "Maßnahmen", rows: [
        ["Menge Verbraucher", val(formData.mengeverbraucher)], ["Menge im Markt", val(formData.mengemarkt)],
        ["Kaufdatum", val(formData.kaufdatum)], ["Kassenbon vorhanden", jaNein(formData.kassenbonVorhanden)],
        ["Kunde entschädigt", jaNein(formData.kundeEntschaedigt)], ["Produkt vorhanden", jaNein(formData.produktVorhanden)],
        ["Fremdkörper vorhanden", jaNein(formData.fremdkoerperVorhanden)], ["Gleiches MHD im Markt", jaNein(formData.gleichesMhdImMarkt)],
        ["Gleicher Fehler im Bestand", jaNein(formData.gleicherFehlerImBestand)], ["Ware aus Regal genommen", jaNein(formData.wareAusRegalGenommen)],
      ]},
    ]
  );
  try {
    await transporter.sendMail({
      from: buildFromAddress(global, marketConfig),
      to: global.defaultRecipient,
      replyTo: formData.email || undefined,
      subject: `Produktfehlermeldung – ${val(formData.markenname)} – ${marktName}`,
      html,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `E-Mail konnte nicht gesendet werden: ${err.message}` });
  }
});

router.post("/send-probeentnahme-email", async (req, res) => {
  const { recordId, marketId, formData, marktName } = req.body as { recordId: number; marketId?: number; formData: Record<string, any>; marktName: string };
  const global = await getGlobalSettings();
  if (!global.enabled) { res.status(400).json({ error: "E-Mail-Versand ist nicht aktiviert. Superadministrator kontaktieren." }); return; }
  const marketConfig = marketId ? await getMarketConfig(marketId) : null;
  const transporter = await buildTransporter(global, marketConfig);
  if (!transporter || !global.defaultRecipient) { res.status(400).json({ error: "E-Mail-Konfiguration unvollständig." }); return; }
  const html = buildEmailHtml(
    "Probeentnahme-Protokoll 3.22",
    `EDEKA Dallmann – ${marktName} | Protokoll-ID: ${recordId}`,
    [
      { heading: "Marktdaten", rows: [
        ["Markt", val(formData.markt)], ["Ansprechpartner", val(formData.ansprechpartner)],
      ]},
      { heading: "Behörde & Datum", rows: [
        ["Behörde", val(formData.behoerdeBezeichnung)],
        ["Datum der Probenentnahme", val(formData.datumEntnahme)],
        ["Grund der Probenahme", val(formData.grundProbenahme)],
        ["Untersuchungsziel", val(formData.untersuchungsziel)],
      ]},
      { heading: "Probe", rows: [
        ["Art der Rückhalteprobe", formData.gegenprobeArt === "gegenprobe" ? "Gegenprobe" : formData.gegenprobeArt === "zweitprobe" ? "Zweitprobe" : "–"],
        ["Status", formData.gegenprobeStatus === "hinterlassen" ? "Hinterlassen" : formData.gegenprobeStatus === "nicht_vorhanden" ? "Nicht vorhanden" : "–"],
        ["Art der Probe", formData.probentyp === "fertigpackung" ? "Fertigpackung" : formData.probentyp === "lose_ware" ? "Lose Ware" : formData.probentyp === "bedientheke" ? "Bedientheke" : "–"],
      ]},
      { heading: "Produktdaten", rows: [
        ["EAN / PLU", val(formData.ean)], ["Artikel-Nr.", val(formData.artikelNr)],
        ["Verkehrsbezeichnung", val(formData.verkehrsbezeichnung)],
        ["MHD", val(formData.mhd)], ["Losnummer", val(formData.losnummer)],
        ["Füllmenge", val(formData.fuellmenge)], ["Hersteller", val(formData.hersteller)],
      ]},
      { heading: "Weiterleitung", rows: [
        ["Durchschrift gefaxt durch", val(formData.durchschriftGefaxtDurch)],
        ["Gefaxt am", val(formData.durchschriftGefaxtAm)],
      ]},
    ]
  );
  try {
    await transporter.sendMail({
      from: buildFromAddress(global, marketConfig),
      to: global.defaultRecipient,
      subject: `Probeentnahme-Protokoll – ${val(formData.verkehrsbezeichnung)} – ${marktName}`,
      html,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `E-Mail konnte nicht gesendet werden: ${err.message}` });
  }
});

export default router;
