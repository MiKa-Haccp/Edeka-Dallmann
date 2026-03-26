import { Router, type IRouter } from "express";
import { db, emailSettingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

async function verifySuperAdmin(adminEmail: string): Promise<boolean> {
  if (!adminEmail) return false;
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail.toLowerCase()));
  return users.length > 0 && users[0].role === "SUPERADMIN";
}

async function getSettings() {
  const rows = await db.select().from(emailSettingsTable).limit(1);
  if (rows.length === 0) {
    const inserted = await db
      .insert(emailSettingsTable)
      .values({})
      .returning();
    return inserted[0];
  }
  return rows[0];
}

router.get("/admin/email-settings", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }
  const settings = await getSettings();
  const { smtpPass, ...safe } = settings;
  res.json({ ...safe, hasPassword: !!smtpPass });
});

router.put("/admin/email-settings", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, fromName, defaultRecipient, enabled } = req.body as {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromName?: string;
    defaultRecipient?: string;
    enabled?: boolean;
  };

  const existing = await getSettings();

  const updateData: Partial<typeof emailSettingsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (smtpHost !== undefined) updateData.smtpHost = smtpHost;
  if (smtpPort !== undefined) updateData.smtpPort = smtpPort;
  if (smtpUser !== undefined) updateData.smtpUser = smtpUser;
  if (smtpPass !== undefined && smtpPass !== "") updateData.smtpPass = smtpPass;
  if (fromName !== undefined) updateData.fromName = fromName;
  if (defaultRecipient !== undefined) updateData.defaultRecipient = defaultRecipient;
  if (enabled !== undefined) updateData.enabled = enabled;

  const updated = await db
    .update(emailSettingsTable)
    .set(updateData)
    .where(eq(emailSettingsTable.id, existing.id))
    .returning();

  const { smtpPass: _, ...safe } = updated[0];
  res.json({ ...safe, hasPassword: !!updated[0].smtpPass });
});

router.post("/admin/email-settings/test", async (req, res) => {
  const adminEmail = req.headers["x-admin-email"] as string;
  if (!(await verifySuperAdmin(adminEmail))) {
    res.status(403).json({ error: "Nur für Superadministratoren." });
    return;
  }

  const settings = await getSettings();
  if (!settings.smtpUser || !settings.smtpPass) {
    res.status(400).json({ error: "SMTP-Zugangsdaten nicht vollständig konfiguriert." });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });

    await transporter.sendMail({
      from: `"${settings.fromName || "EDEKA Dallmann HACCP"}" <${settings.smtpUser}>`,
      to: adminEmail,
      subject: "HACCP System – Test-E-Mail",
      text: "Die E-Mail-Konfiguration ist erfolgreich. Der E-Mail-Versand aus dem HACCP-System funktioniert korrekt.",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a3a6b;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:18px;">EDEKA Dallmann – HACCP System</h2>
            <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Test-E-Mail</p>
          </div>
          <div style="background:#f8f9fa;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p style="color:#374151;">Die E-Mail-Konfiguration ist <strong>erfolgreich</strong>.</p>
            <p style="color:#6b7280;font-size:13px;">Der E-Mail-Versand aus dem HACCP-System funktioniert korrekt.</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: `Test-E-Mail erfolgreich an ${adminEmail} gesendet.` });
  } catch (err: any) {
    res.status(500).json({ error: `SMTP-Fehler: ${err.message}` });
  }
});

router.post("/send-produktfehlermeldung-email", async (req, res) => {
  const { reportId, tenantId, formData, marktName } = req.body as {
    reportId: number;
    tenantId: number;
    formData: Record<string, any>;
    marktName: string;
  };

  const settings = await getSettings();

  if (!settings.enabled) {
    res.status(400).json({ error: "E-Mail-Versand ist nicht aktiviert. Bitte den Superadministrator kontaktieren." });
    return;
  }
  if (!settings.smtpUser || !settings.smtpPass || !settings.defaultRecipient) {
    res.status(400).json({ error: "E-Mail-Konfiguration unvollständig. Bitte den Superadministrator kontaktieren." });
    return;
  }

  const jaNein = (v: boolean | null) => v === true ? "Ja" : v === false ? "Nein" : "–";
  const val = (v: any) => v || "–";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <div style="background:#1a3a6b;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:20px;">Produktfehlermeldung 3.14</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">EDEKA Dallmann – ${marktName} | Meldungs-ID: ${reportId}</p>
      </div>
      <div style="background:#ffffff;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">

        <h3 style="color:#1a3a6b;font-size:15px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Marktdaten</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><td style="padding:4px 0;color:#6b7280;width:40%;">Markt</td><td style="padding:4px 0;font-weight:600;">${val(formData.markt)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Ansprechpartner</td><td style="padding:4px 0;">${val(formData.ansprechpartner)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Telefon</td><td style="padding:4px 0;">${val(formData.telefon)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">E-Mail</td><td style="padding:4px 0;">${val(formData.email)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Erkannt durch</td><td style="padding:4px 0;">${formData.erkennungDurch === "markt" ? "Markt" : formData.erkennungDurch === "verbraucher" ? "Verbraucher" : "–"}</td></tr>
        </table>

        <h3 style="color:#1a3a6b;font-size:15px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Produktdaten</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><td style="padding:4px 0;color:#6b7280;width:40%;">Markenname / Produkt</td><td style="padding:4px 0;font-weight:600;">${val(formData.markenname)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">EAN / Artikel-Nr.</td><td style="padding:4px 0;">${val(formData.einzelEan)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">MHD</td><td style="padding:4px 0;">${val(formData.mhd)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Losnummer</td><td style="padding:4px 0;">${val(formData.losnummer)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Lieferantencode</td><td style="padding:4px 0;">${val(formData.lieferantencode)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Belieferungsart</td><td style="padding:4px 0;">${formData.belieferungsart === "strecke" ? "Strecke" : formData.belieferungsart === "grosshandel" ? `Großhandel (${val(formData.grosshandelsstandort)})` : "–"}</td></tr>
        </table>

        <h3 style="color:#1a3a6b;font-size:15px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Fehlerbeschreibung</h3>
        <p style="font-size:13px;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:16px;">${val(formData.fehlerbeschreibung)}</p>

        <h3 style="color:#1a3a6b;font-size:15px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Maßnahmen & Mengen</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><td style="padding:4px 0;color:#6b7280;width:40%;">Menge Verbraucher</td><td style="padding:4px 0;">${val(formData.mengeverbraucher)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Menge im Markt</td><td style="padding:4px 0;">${val(formData.mengemarkt)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Kaufdatum</td><td style="padding:4px 0;">${val(formData.kaufdatum)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Kassenbon vorhanden</td><td style="padding:4px 0;">${jaNein(formData.kassenbonVorhanden)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Kunde entschädigt</td><td style="padding:4px 0;">${jaNein(formData.kundeEntschaedigt)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Produkt vorhanden</td><td style="padding:4px 0;">${jaNein(formData.produktVorhanden)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Fremdkörper vorhanden</td><td style="padding:4px 0;">${jaNein(formData.fremdkoerperVorhanden)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Gleiches MHD im Markt</td><td style="padding:4px 0;">${jaNein(formData.gleichesMhdImMarkt)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Gleicher Fehler im Bestand</td><td style="padding:4px 0;">${jaNein(formData.gleicherFehlerImBestand)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Ware aus Regal genommen</td><td style="padding:4px 0;">${jaNein(formData.wareAusRegalGenommen)}</td></tr>
        </table>

        <p style="font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px;margin-top:4px;">
          Diese E-Mail wurde automatisch vom HACCP-System von EDEKA Dallmann erstellt.<br>
          Formblatt muss 3 Jahre von der Marktleitung archiviert werden.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });

    await transporter.sendMail({
      from: `"${settings.fromName || "EDEKA Dallmann HACCP"}" <${settings.smtpUser}>`,
      to: settings.defaultRecipient,
      replyTo: formData.email || settings.smtpUser,
      subject: `Produktfehlermeldung – ${val(formData.markenname)} – ${marktName}`,
      html,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `E-Mail konnte nicht gesendet werden: ${err.message}` });
  }
});

export default router;
