import { Router, type IRouter } from "express";
import { db, registeredDevicesTable, tenantsTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const router: IRouter = Router();

// ===== SMTP helper (same pattern as auth.ts) =====
async function getSmtpTransporter() {
  const globalR = await pool.query(`SELECT * FROM email_settings LIMIT 1`);
  const global = globalR.rows[0];
  const host = global?.smtp_host || process.env.SMTP_HOST || "smtp.ionos.de";
  const port = Number(global?.smtp_port || process.env.SMTP_PORT || 587);
  const globalUser = global?.smtp_user || process.env.SMTP_USER;
  const globalPass = global?.smtp_pass || process.env.SMTP_PASS;
  if (globalUser && globalPass) {
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: globalUser, pass: globalPass } });
    return { transporter, fromUser: globalUser, fromName: global?.from_name || "EDEKA Dallmann HACCP" };
  }
  const marketR = await pool.query(
    `SELECT * FROM market_email_configs WHERE smtp_user IS NOT NULL AND smtp_pass IS NOT NULL ORDER BY market_id ASC LIMIT 1`
  );
  const mCfg = marketR.rows[0];
  if (mCfg?.smtp_user && mCfg?.smtp_pass) {
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: mCfg.smtp_user, pass: mCfg.smtp_pass } });
    return { transporter, fromUser: mCfg.smtp_user, fromName: mCfg.from_name || "EDEKA Dallmann HACCP" };
  }
  return { transporter: null, fromUser: "", fromName: "EDEKA Dallmann HACCP" };
}

// ===== EXISTIERENDER FLOW: Master-Passwort-Registrierung (UNVERÄNDERT) =====
router.post("/device/register", async (req, res) => {
  const { password, name } = req.body as { password?: string; name?: string };

  if (!password || !name?.trim()) {
    res.status(400).json({ authorized: false, error: "Passwort und Gerätename sind erforderlich." });
    return;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, 1));

  const validPassword = tenant?.masterPassword ?? process.env.DEVICE_MASTER_PASSWORD ?? "Dallmann2025!";

  if (password !== validPassword) {
    res.status(401).json({ authorized: false, error: "Falsches Master-Passwort." });
    return;
  }

  const token = randomBytes(32).toString("hex");

  const [device] = await db
    .insert(registeredDevicesTable)
    .values({ tenantId: 1, name: name.trim(), token, isActive: true })
    .returning();

  res.json({ authorized: true, token, deviceId: device.id, deviceName: device.name });
});

// ===== Token-Verifikation (UNVERÄNDERT) =====
router.post("/device/verify-token", async (req, res) => {
  const { token } = req.body as { token?: string };

  if (!token) {
    res.json({ valid: false });
    return;
  }

  const [device] = await db
    .select()
    .from(registeredDevicesTable)
    .where(eq(registeredDevicesTable.token, token));

  if (!device || !device.isActive) {
    res.json({ valid: false });
    return;
  }

  res.json({ valid: true, deviceId: device.id, deviceName: device.name });
});

// ===== Alle registrierten Geräte auflisten =====
router.get("/devices", async (req, res) => {
  const devices = await db
    .select()
    .from(registeredDevicesTable)
    .orderBy(desc(registeredDevicesTable.createdAt));

  res.json(devices);
});

// ===== Gerät sperren =====
router.delete("/devices/:id", async (req, res) => {
  const id = Number(req.params.id);

  await db
    .update(registeredDevicesTable)
    .set({ isActive: false, revokedAt: new Date() })
    .where(eq(registeredDevicesTable.id, id));

  res.json({ success: true });
});

// ===== Gerät dauerhaft löschen =====
router.delete("/devices/:id/permanent", async (req, res) => {
  const id = Number(req.params.id);

  await db
    .delete(registeredDevicesTable)
    .where(eq(registeredDevicesTable.id, id));

  res.json({ success: true });
});

// ===== NEU: Registrierungslink erstellen + (optional) per E-Mail senden =====
router.post("/device/create-reg-link", async (req, res) => {
  const { tenantId = 1, deviceNameHint, email, appBaseUrl, expiryDays = 30 } = req.body as {
    tenantId?: number;
    deviceNameHint?: string;
    email?: string;
    appBaseUrl?: string;
    expiryDays?: number;
  };

  const key = randomBytes(24).toString("hex");
  // Codes laufen nicht mehr ab – Spalte expires_at wird mit fernem Datum gefüllt (NOT NULL Spalte)
  const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
  void expiryDays;

  // Kurzen 6-Zeichen-Code generieren (Großbuchstaben + Ziffern, ohne mehrdeutige Zeichen)
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let shortCode = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) shortCode += CHARSET[bytes[i] % CHARSET.length];

  // Kollision vermeiden (sehr unwahrscheinlich, aber sicher)
  const existing = await pool.query(
    `SELECT id FROM device_reg_links WHERE short_code = $1 AND cancelled_at IS NULL AND used_at IS NULL`,
    [shortCode]
  );
  if (existing.rows.length > 0) {
    const extraBytes = randomBytes(6);
    shortCode = "";
    for (let i = 0; i < 6; i++) shortCode += CHARSET[extraBytes[i] % CHARSET.length];
  }

  await pool.query(
    `INSERT INTO device_reg_links (key, tenant_id, device_name_hint, email, expires_at, short_code)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [key, tenantId, deviceNameHint?.trim() || null, email?.trim() || null, expiresAt, shortCode]
  );

  const baseUrl = appBaseUrl || "";
  const regUrl = `${baseUrl}/?reg_key=${key}`;

  let emailSent = false;
  if (email?.trim()) {
    const { transporter, fromUser, fromName } = await getSmtpTransporter();
    if (transporter) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
          <div style="background: #1a3a6b; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">EDEKA Dallmann HACCP</h2>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-top: 0;">Gerät registrieren</p>
            <p style="color: #374151;">
              Klicken Sie auf den Button, um dieses Gerät dauerhaft für die HACCP-App freizuschalten.
              ${deviceNameHint ? `<br><strong>Gerätename:</strong> ${deviceNameHint}` : ""}
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${regUrl}" style="background: #1a3a6b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                Gerät jetzt registrieren
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Oder diesen Link direkt im Browser öffnen:<br>
              <a href="${regUrl}" style="color: #1a3a6b; word-break: break-all;">${regUrl}</a>
            </p>
            <div style="background: #f0f4ff; border: 1px solid #c7d7fc; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #374151; font-weight: bold;">Alternativ: Registrierungscode manuell eingeben</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">Falls der Link nicht funktioniert, können Sie diesen Code direkt in der App eingeben:</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1a3a6b; text-align: center;">${shortCode}</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Einmalige Nutzung – nach der Registrierung ist das Gerät dauerhaft freigeschaltet. Der Code bleibt unbegrenzt gültig, bis er verwendet oder gesperrt wird.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">EDEKA Dallmann HACCP Management System</p>
          </div>
        </div>
      `;
      try {
        await transporter.sendMail({ from: `"${fromName}" <${fromUser}>`, to: email, subject: "HACCP-App: Geräteregistrierung", html });
        emailSent = true;
      } catch (e) {
        console.error("[Device] E-Mail-Versandfehler:", e);
      }
    }
  }

  res.json({ success: true, key, shortCode, regUrl, emailSent });
});

// ===== NEU: Registrierungslink validieren (GET – vor dem Aktivieren prüfen) =====
router.get("/device/reg-link/:key", async (req, res) => {
  const { key } = req.params;
  const r = await pool.query(
    `SELECT * FROM device_reg_links WHERE key = $1`,
    [key]
  );
  const link = r.rows[0];

  if (!link) {
    res.status(404).json({ valid: false, error: "Link nicht gefunden." });
    return;
  }
  if (link.cancelled_at) {
    res.status(400).json({ valid: false, error: "Dieser Link wurde vom Administrator gesperrt." });
    return;
  }
  if (link.used_at) {
    res.status(400).json({ valid: false, error: "Dieser Link wurde bereits verwendet." });
    return;
  }

  res.json({ valid: true, deviceNameHint: link.device_name_hint || "", tenantId: link.tenant_id });
});

// ===== NEU: Registrierungslink aktivieren – Gerät wird dauerhaft registriert =====
router.post("/device/use-reg-link", async (req, res) => {
  const { key, deviceName } = req.body as { key?: string; deviceName?: string };

  try {
    if (!key || !deviceName?.trim()) {
      res.status(400).json({ authorized: false, error: "Key und Gerätename sind erforderlich." });
      return;
    }

    const r = await pool.query(
      `SELECT * FROM device_reg_links WHERE key = $1`,
      [key]
    );
    const link = r.rows[0];

    if (!link) {
      res.status(404).json({ authorized: false, error: "Registrierungslink nicht gefunden." });
      return;
    }
    if (link.cancelled_at) {
      res.status(400).json({ authorized: false, error: "Dieser Link wurde vom Administrator gesperrt." });
      return;
    }
    if (link.used_at) {
      res.status(400).json({ authorized: false, error: "Dieser Link wurde bereits verwendet." });
      return;
    }

    const token = randomBytes(32).toString("hex");

    const [device] = await db
      .insert(registeredDevicesTable)
      .values({ tenantId: link.tenant_id, name: deviceName.trim(), token, isActive: true })
      .returning();

    await pool.query(
      `UPDATE device_reg_links SET used_at = NOW(), device_id = $1 WHERE key = $2`,
      [device.id, key]
    );

    res.json({ authorized: true, token, deviceId: device.id, deviceName: device.name });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; detail?: string; constraint?: string };
    console.error("[Device] use-reg-link Fehler:", err);
    res.status(500).json({
      authorized: false,
      error: `Server-Fehler: ${e?.message || "unbekannt"}`,
      detail: e?.detail || null,
      pgCode: e?.code || null,
      constraint: e?.constraint || null,
    });
  }
});

// ===== NEU: Registrierungscode validieren (vor dem Aktivieren prüfen) =====
router.get("/device/reg-link-by-code/:code", async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const r = await pool.query(
    `SELECT * FROM device_reg_links WHERE upper(short_code) = $1`,
    [code]
  );
  const link = r.rows[0];

  if (!link) {
    res.status(404).json({ valid: false, error: "Ungültiger Registrierungscode." });
    return;
  }
  if (link.cancelled_at) {
    res.status(400).json({ valid: false, error: "Dieser Code wurde vom Administrator gesperrt." });
    return;
  }
  if (link.used_at) {
    res.status(400).json({ valid: false, error: "Dieser Code wurde bereits verwendet." });
    return;
  }

  res.json({ valid: true, key: link.key, deviceNameHint: link.device_name_hint || "", tenantId: link.tenant_id });
});

// ===== NEU: Registrierungscode aktivieren =====
router.post("/device/use-reg-code", async (req, res) => {
  try {
    const { code, deviceName } = req.body as { code?: string; deviceName?: string };

    if (!code || !deviceName?.trim()) {
      res.status(400).json({ authorized: false, error: "Code und Gerätename sind erforderlich." });
      return;
    }

    const r = await pool.query(
      `SELECT * FROM device_reg_links WHERE upper(short_code) = $1`,
      [code.toUpperCase().trim()]
    );
    const link = r.rows[0];

    if (!link) {
      res.status(404).json({ authorized: false, error: "Ungültiger Registrierungscode." });
      return;
    }
    if (link.cancelled_at) {
      res.status(400).json({ authorized: false, error: "Dieser Code wurde vom Administrator gesperrt." });
      return;
    }
    if (link.used_at) {
      res.status(400).json({ authorized: false, error: "Dieser Code wurde bereits verwendet." });
      return;
    }

    const token = randomBytes(32).toString("hex");

    const [device] = await db
      .insert(registeredDevicesTable)
      .values({ tenantId: link.tenant_id, name: deviceName.trim(), token, isActive: true })
      .returning();

    await pool.query(
      `UPDATE device_reg_links SET used_at = NOW(), device_id = $1 WHERE id = $2`,
      [device.id, link.id]
    );

    res.json({ authorized: true, token, deviceId: device.id, deviceName: device.name });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; detail?: string; constraint?: string };
    console.error("[Device] use-reg-code Fehler:", err);
    res.status(500).json({
      authorized: false,
      error: `Server-Fehler: ${e?.message || "unbekannt"}`,
      detail: e?.detail || null,
      pgCode: e?.code || null,
      constraint: e?.constraint || null,
    });
  }
});

// ===== NEU: Alle Registrierungslinks auflisten =====
router.get("/device/reg-links", async (req, res) => {
  const r = await pool.query(
    `SELECT l.*, d.name AS device_name
     FROM device_reg_links l
     LEFT JOIN registered_devices d ON d.id = l.device_id
     ORDER BY l.created_at DESC
     LIMIT 100`
  );
  res.json(r.rows);
});

// ===== NEU: Registrierungslink sperren (nicht löschen, nur deaktivieren) =====
router.post("/device/reg-links/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(`UPDATE device_reg_links SET cancelled_at = NOW() WHERE id = $1`, [id]);
  res.json({ success: true });
});

// ===== NEU: Registrierungslink löschen =====
router.delete("/device/reg-links/:id", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(`DELETE FROM device_reg_links WHERE id = $1`, [id]);
  res.json({ success: true });
});

export default router;
