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
  const user = marketConfig?.smtpUser || global.smtpUser || process.env.SMTP_USER;
  const pass = marketConfig?.smtpPass || global.smtpPass || process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const host = global.smtpHost || process.env.SMTP_HOST || "smtp.ionos.de";
  const port = global.smtpPort || Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
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
  const row = await db.execute(`SELECT qm_email FROM email_settings WHERE id = ${s.id}`);
  const qmEmail = (row as any).rows?.[0]?.qm_email || null;
  res.json({ ...safe, hasPassword: !!smtpPass, qmEmail });
});

router.put("/admin/email-settings", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) { res.status(403).json({ error: "Nur für Superadministratoren." }); return; }
  const { smtpHost, smtpPort, smtpPass, fromName, defaultRecipient, qmEmail, enabled } = req.body as any;
  const existing = await getGlobalSettings();
  const upd: Partial<typeof emailSettingsTable.$inferInsert> = { updatedAt: new Date() };
  if (smtpHost !== undefined) upd.smtpHost = smtpHost;
  if (smtpPort !== undefined) upd.smtpPort = smtpPort;
  if (smtpPass !== undefined && smtpPass !== "") upd.smtpPass = smtpPass;
  if (fromName !== undefined) upd.fromName = fromName;
  if (defaultRecipient !== undefined) upd.defaultRecipient = defaultRecipient;
  if (enabled !== undefined) upd.enabled = enabled;
  const updated = await db.update(emailSettingsTable).set(upd).where(eq(emailSettingsTable.id, existing.id)).returning();
  if (qmEmail !== undefined) {
    await db.execute(`UPDATE email_settings SET qm_email = '${(qmEmail || "").replace(/'/g, "''")}' WHERE id = ${existing.id}`);
  }
  const { smtpPass: _, ...safe } = updated[0];
  const row = await db.execute(`SELECT qm_email FROM email_settings WHERE id = ${existing.id}`);
  const savedQmEmail = (row as any).rows?.[0]?.qm_email || null;
  res.json({ ...safe, hasPassword: !!updated[0].smtpPass, qmEmail: savedQmEmail });
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

// ─── TÜV AKTIONSPLAN EMAIL ───────────────────────────────────────────────────

function buildTuevHtml(opts: {
  marktName: string;
  year: number;
  aktionsplanDatum: string;
  massnahmen: { nr: string; massnahme: string; durchgefuehrtVon: string; datum?: string; pinBestaetigtVon?: string }[];
  nachbesserungName: string;
  nachbesserungDatum: string;
  nachbesserungUnterschrift: string;
  hatFoto: boolean;
  istBild: boolean;
}): string {
  const { marktName, year, aktionsplanDatum, massnahmen, nachbesserungName, nachbesserungDatum, nachbesserungUnterschrift, hatFoto, istBild } = opts;
  const fristStr = aktionsplanDatum ? new Date(aktionsplanDatum).toLocaleDateString("de-DE") : "–";
  const pruefungStr = nachbesserungDatum ? new Date(nachbesserungDatum).toLocaleDateString("de-DE") : "–";

  const massnahmenRows = massnahmen.length > 0
    ? massnahmen.map((m, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"};">
        <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#1a3a6b;white-space:nowrap;">${val(m.nr)}</td>
        <td style="padding:8px 10px;font-size:13px;color:#111;">${val(m.massnahme)}</td>
        <td style="padding:8px 10px;font-size:12px;color:#374151;white-space:nowrap;">${m.datum ? new Date(m.datum).toLocaleDateString("de-DE") : "–"}</td>
        <td style="padding:8px 10px;font-size:12px;color:${m.pinBestaetigtVon ? "#059669" : "#374151"};">
          ${m.pinBestaetigtVon ? `✓ ${m.pinBestaetigtVon}` : val(m.durchgefuehrtVon)}
        </td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="padding:12px 10px;font-size:13px;color:#9ca3af;font-style:italic;">Keine Maßnahmen eingetragen</td></tr>`;

  const fotoSection = hatFoto ? (
    istBild
      ? `<div style="margin:12px 0;">
           <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">Aktionsplan-Dokument (Bild):</p>
           <img src="cid:aktionsplan-foto@haccp" style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb;" alt="Aktionsplan" />
         </div>`
      : `<div style="margin:12px 0;padding:10px 14px;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;">
           <p style="font-size:13px;color:#1a3a6b;margin:0;">📎 PDF des Aktionsplans ist als Anhang beigefügt.</p>
         </div>`
  ) : `<p style="font-size:13px;color:#9ca3af;font-style:italic;margin:8px 0;">Kein Dokument hochgeladen</p>`;

  const bestaetigung = nachbesserungDatum
    ? `<div style="margin-top:4px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
         <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 8px;">✓ Maßnahmen bestätigt – Aktionsplan abgeschlossen</p>
         <table style="width:100%;font-size:13px;border-collapse:collapse;">
           <tr><td style="color:#6b7280;width:45%;padding:3px 0;">Name (Betriebsleitung)</td><td style="font-weight:600;color:#111;">${val(nachbesserungName)}</td></tr>
           <tr><td style="color:#6b7280;padding:3px 0;">Datum der Prüfung</td><td style="font-weight:600;color:#111;">${pruefungStr}</td></tr>
           <tr><td style="color:#6b7280;padding:3px 0;">Unterschrift (PIN)</td><td style="font-weight:600;color:${nachbesserungUnterschrift ? "#059669" : "#9ca3af"};">${nachbesserungUnterschrift ? `✓ ${nachbesserungUnterschrift}` : "–"}</td></tr>
         </table>
       </div>`
    : `<div style="padding:12px 14px;background:#fefce8;border:1px solid #fde047;border-radius:8px;">
         <p style="color:#92400e;font-size:13px;margin:0;">⏳ Maßnahmen noch nicht abschließend bestätigt</p>
       </div>`;

  return `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#1a3a6b;color:white;padding:22px 26px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:20px;">TÜV Aktionsplan & Maßnahmenumsetzung</h2>
      <p style="margin:5px 0 0;opacity:0.8;font-size:13px;">EDEKA Dallmann – ${marktName} | Jahr ${year}</p>
    </div>
    <div style="background:#fff;padding:22px 26px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">

      <h3 style="color:#1a3a6b;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:0 0 12px;">Aktionsplan</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:12px;">
        <tr><td style="color:#6b7280;width:45%;padding:4px 0;">Frist (Deadline)</td><td style="font-weight:600;color:#111;">${fristStr}</td></tr>
      </table>
      ${fotoSection}

      <h3 style="color:#1a3a6b;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:20px 0 12px;">Erforderliche Nachbesserungen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#1a3a6b;color:white;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;width:50px;">Nr.</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;">Maßnahme</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;width:90px;">Datum</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;width:140px;">Durchgeführt von</th>
          </tr>
        </thead>
        <tbody>${massnahmenRows}</tbody>
      </table>

      <h3 style="color:#1a3a6b;font-size:15px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:20px 0 12px;">Bestätigung der Maßnahmenumsetzung – Betriebsleitung</h3>
      ${bestaetigung}

      <p style="font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:14px;margin-top:20px;">
        Erstellt am ${new Date().toLocaleString("de-DE")} · HACCP-Management-System EDEKA Dallmann
      </p>
    </div>
  </div>`;
}

router.post("/send-tuev-aktionsplan-email", async (req, res) => {
  const {
    marketId, marktName, year,
    aktionsplanFoto, aktionsplanDatum,
    massnahmen,
    nachbesserungName, nachbesserungDatum, nachbesserungUnterschrift,
  } = req.body as {
    marketId?: number; marktName: string; year: number;
    aktionsplanFoto?: string; aktionsplanDatum?: string;
    massnahmen?: { nr: string; massnahme: string; durchgefuehrtVon: string; datum?: string; pinBestaetigtVon?: string }[];
    nachbesserungName?: string; nachbesserungDatum?: string; nachbesserungUnterschrift?: string;
  };

  const global = await getGlobalSettings();
  if (!global.enabled) { res.status(400).json({ error: "E-Mail-Versand ist nicht aktiviert." }); return; }

  const qmEmailRow = await db.execute(`SELECT qm_email FROM email_settings WHERE id = ${global.id}`);
  const qmEmail = (qmEmailRow as any).rows?.[0]?.qm_email || global.defaultRecipient;
  if (!qmEmail) { res.status(400).json({ error: "Keine QM-E-Mail-Adresse konfiguriert." }); return; }

  const marketConfig = marketId ? await getMarketConfig(marketId) : null;
  const transporter = await buildTransporter(global, marketConfig);
  if (!transporter) { res.status(400).json({ error: "SMTP nicht konfiguriert." }); return; }

  // Anhang vorbereiten
  const attachments: any[] = [];
  let istBild = false;
  const foto = aktionsplanFoto || "";

  if (foto && foto.startsWith("data:image/")) {
    istBild = true;
    const [header, b64] = foto.split(",");
    const mime = header.split(";")[0].split(":")[1];
    attachments.push({
      filename: "aktionsplan-foto.jpg",
      content: Buffer.from(b64, "base64"),
      contentType: mime,
      cid: "aktionsplan-foto@haccp",
    });
  } else if (foto && (foto.startsWith("data:application/pdf") || foto.startsWith("["))) {
    let pdfBase64 = "";
    if (foto.startsWith("[")) {
      try {
        const arr = JSON.parse(foto);
        if (Array.isArray(arr) && arr[0]?.data) pdfBase64 = arr[0].data.split(",")[1] || "";
        else if (Array.isArray(arr) && typeof arr[0] === "string") pdfBase64 = arr[0].split(",")[1] || "";
      } catch { /* ignore */ }
    } else {
      pdfBase64 = foto.split(",")[1] || "";
    }
    if (pdfBase64) {
      attachments.push({
        filename: `aktionsplan-${marktName}-${year}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf",
      });
    }
  }

  const html = buildTuevHtml({
    marktName, year,
    aktionsplanDatum: aktionsplanDatum || "",
    massnahmen: massnahmen || [],
    nachbesserungName: nachbesserungName || "",
    nachbesserungDatum: nachbesserungDatum || "",
    nachbesserungUnterschrift: nachbesserungUnterschrift || "",
    hatFoto: attachments.length > 0,
    istBild,
  });

  const statusLabel = nachbesserungDatum ? "abgeschlossen" : "offen";
  try {
    await transporter.sendMail({
      from: buildFromAddress(global, marketConfig),
      to: qmEmail,
      subject: `TÜV Aktionsplan ${year} – ${marktName} [${statusLabel}]`,
      html,
      attachments,
    });
    res.json({ success: true, recipient: qmEmail });
  } catch (err: any) {
    res.status(500).json({ error: `E-Mail konnte nicht gesendet werden: ${err.message}` });
  }
});

export default router;
