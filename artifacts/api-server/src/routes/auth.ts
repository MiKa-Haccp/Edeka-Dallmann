import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { randomBytes, scryptSync } from "crypto";
import nodemailer from "nodemailer";

const router: IRouter = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function getSmtpTransporter() {
  // Globale email_settings: smtp_host, smtp_port (und ggf. globale Zugangsdaten)
  const globalR = await pool.query(`SELECT * FROM email_settings LIMIT 1`);
  const global = globalR.rows[0];
  const host = global?.smtp_host || process.env.SMTP_HOST || "smtp.ionos.de";
  const port = Number(global?.smtp_port || process.env.SMTP_PORT || 587);

  // 1. Globale Zugangsdaten versuchen
  const globalUser = global?.smtp_user || process.env.SMTP_USER;
  const globalPass = global?.smtp_pass || process.env.SMTP_PASS;
  if (globalUser && globalPass) {
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: globalUser, pass: globalPass } });
    return { transporter, fromUser: globalUser, fromName: global?.from_name || "EDEKA Dallmann HACCP" };
  }

  // 2. Markt-Zugangsdaten (market_id=1 = markt@edeka-dallmann.de bevorzugt)
  const marketR = await pool.query(
    `SELECT * FROM market_email_configs WHERE smtp_user IS NOT NULL AND smtp_pass IS NOT NULL ORDER BY market_id ASC LIMIT 1`
  );
  const mCfg = marketR.rows[0];
  if (mCfg?.smtp_user && mCfg?.smtp_pass) {
    console.log(`[Auth] Verwende Markt-SMTP: ${mCfg.smtp_user} via ${host}:${port}`);
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: mCfg.smtp_user, pass: mCfg.smtp_pass } });
    return { transporter, fromUser: mCfg.smtp_user, fromName: mCfg.from_name || "EDEKA Dallmann HACCP" };
  }

  console.error("[Auth] Keine SMTP-Zugangsdaten gefunden (weder global noch marktspezifisch).");
  return { transporter: null, fromUser: "", fromName: "EDEKA Dallmann HACCP" };
}

async function sendAuthEmail(toEmail: string, toName: string, setPasswordUrl: string, type: "invite" | "reset") {
  const { transporter, fromUser, fromName } = await getSmtpTransporter();
  if (!transporter) {
    console.error("[Auth] Kein SMTP-Transporter für Auth-E-Mail.");
    return false;
  }
  const subject = type === "invite"
    ? "Einladung: Passwort festlegen – EDEKA Dallmann HACCP"
    : "Passwort zurücksetzen – EDEKA Dallmann HACCP";
  const actionLabel = type === "invite" ? "Passwort festlegen" : "Neues Passwort setzen";
  const intro = type === "invite"
    ? `Sie wurden eingeladen, sich im EDEKA Dallmann HACCP-System anzumelden. Klicken Sie auf den Button um Ihr persönliches Passwort festzulegen.`
    : `Sie haben eine Passwortzurücksetzung für Ihr HACCP-Konto angefordert. Klicken Sie auf den Button um ein neues Passwort zu setzen.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <div style="background: #1a3a6b; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">EDEKA Dallmann HACCP</h2>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; margin-top: 0;">Hallo ${toName},</p>
        <p style="color: #374151;">${intro}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${setPasswordUrl}" style="background: #1a3a6b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            ${actionLabel}
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 0;">Dieser Link ist 48 Stunden gültig. Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">EDEKA Dallmann HACCP Management System</p>
      </div>
    </div>
  `;
  try {
    await transporter.sendMail({ from: `"${fromName}" <${fromUser}>`, to: toEmail, subject, html });
    return true;
  } catch (e) {
    console.error("[Auth] E-Mail-Versandfehler:", e);
    return false;
  }
}

router.post("/auth/send-invite", async (req, res) => {
  const { userId, type = "invite", appBaseUrl } = req.body;
  if (!userId) { res.status(400).json({ error: "userId ist erforderlich." }); return; }
  const r = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [userId]);
  const user = r.rows[0];
  if (!user) { res.status(404).json({ error: "Benutzer nicht gefunden." }); return; }
  if (!user.email) { res.status(400).json({ error: "Dieser Benutzer hat keine E-Mail-Adresse hinterlegt." }); return; }
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO password_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, token, type, expiresAt]
  );
  const baseUrl = appBaseUrl || "";
  const setPasswordUrl = `${baseUrl}/set-password?token=${token}`;
  const emailSent = await sendAuthEmail(user.email, user.name, setPasswordUrl, type as "invite" | "reset");
  res.json({ success: true, token, setPasswordUrl, emailSent });
});

router.get("/auth/token/:token", async (req, res) => {
  const { token } = req.params;
  const r = await pool.query(
    `SELECT pt.*, u.name, u.email FROM password_tokens pt JOIN users u ON u.id = pt.user_id WHERE pt.token = $1`,
    [token]
  );
  if (r.rows.length === 0) { res.status(404).json({ error: "Link ungültig oder nicht gefunden." }); return; }
  const row = r.rows[0];
  if (row.used_at) { res.status(400).json({ error: "Dieser Link wurde bereits verwendet." }); return; }
  if (new Date() > new Date(row.expires_at)) { res.status(400).json({ error: "Dieser Link ist abgelaufen." }); return; }
  res.json({ valid: true, name: row.name, email: row.email, type: row.type });
});

router.post("/auth/set-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ error: "Token und Passwort sind erforderlich." }); return; }
  if (password.length < 8) { res.status(400).json({ error: "Passwort muss mindestens 8 Zeichen lang sein." }); return; }
  const r = await pool.query(
    `SELECT pt.*, u.name, u.email FROM password_tokens pt JOIN users u ON u.id = pt.user_id WHERE pt.token = $1`,
    [token]
  );
  if (r.rows.length === 0) { res.status(404).json({ error: "Link ungültig oder nicht gefunden." }); return; }
  const row = r.rows[0];
  if (row.used_at) { res.status(400).json({ error: "Dieser Link wurde bereits verwendet." }); return; }
  if (new Date() > new Date(row.expires_at)) { res.status(400).json({ error: "Dieser Link ist abgelaufen." }); return; }
  const hashedPassword = hashPassword(password);
  await pool.query(`UPDATE users SET password = $1, is_registered = TRUE WHERE id = $2`, [hashedPassword, row.user_id]);
  await pool.query(`UPDATE password_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);
  res.json({ success: true, name: row.name });
});

router.post("/auth/forgot-password", async (req, res) => {
  const { email, appBaseUrl } = req.body;
  if (!email) { res.status(400).json({ error: "E-Mail ist erforderlich." }); return; }
  const r = await pool.query(
    `SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) AND password IS NOT NULL`,
    [email]
  );
  if (r.rows.length === 0) { res.json({ success: true }); return; }
  const user = r.rows[0];
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO password_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'reset', $3)`,
    [user.id, token, expiresAt]
  );
  const baseUrl = appBaseUrl || "";
  const setPasswordUrl = `${baseUrl}/set-password?token=${token}`;
  await sendAuthEmail(user.email, user.name, setPasswordUrl, "reset");
  res.json({ success: true });
});

export default router;
