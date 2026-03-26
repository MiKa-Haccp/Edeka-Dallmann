import { pool } from "@workspace/db";
import nodemailer from "nodemailer";
import cron from "node-cron";

export const MONITORABLE_SECTIONS = [
  { key: "2.1",  label: "Wareneingänge SBF",        group: "HACCP 2 – SBF",     periodType: "daily",     description: "Wareneingänge Selbstbedienungsfrischfleisch" },
  { key: "2.2",  label: "Warencheck OG",             group: "HACCP 2 – SBF",     periodType: "daily",     description: "Warenzustand OG Kontrolle" },
  { key: "2.3",  label: "Reinigung täglich",         group: "HACCP 2 – SBF",     periodType: "daily",     description: "Tägliche Reinigungskontrolle" },
  { key: "3.1",  label: "Metzgerei Wareneingänge",  group: "HACCP 3 – Metzgerei", periodType: "daily",   description: "Wareneingänge Metzgerei" },
  { key: "3.2",  label: "Reinigungsplan Metzgerei", group: "HACCP 3 – Metzgerei", periodType: "monthly", description: "Monatlicher Reinigungsplan Metzgerei" },
  { key: "3.3",  label: "Öffnung Salate",           group: "HACCP 3 – Metzgerei", periodType: "daily",   description: "Öffnungsdokumentation Salate" },
  { key: "3.4",  label: "Käsetheke Kontrolle",      group: "HACCP 3 – Metzgerei", periodType: "daily",   description: "Käsetheke Temperaturkontrolle" },
  { key: "3.5",  label: "Semmelliste",              group: "HACCP 3 – Metzgerei", periodType: "daily",   description: "Semmelliste Kontingent" },
  { key: "1.5",  label: "Jahresreinigungsplan",     group: "HACCP 1 – Allgemein", periodType: "monthly", description: "Monatliche Bestätigungen Jahresreinigungsplan" },
  { key: "1.6",  label: "Betriebsbegehung",         group: "HACCP 1 – Allgemein", periodType: "quarterly", description: "Vierteljährliche Betriebsbegehung" },
  { key: "3.8",  label: "GQ-Begehung",             group: "HACCP 3 – Metzgerei", periodType: "quarterly", description: "Vierteljährliche GQ-Begehung Metzgerei" },
] as const;

export const TRIGGER_TYPES = [
  { key: "no_entry_days",    label: "Keine Einträge seit X Tagen",        unit: "Tage",  description: "Benachrichtigung wenn seit X Tagen kein Eintrag erfolgt ist" },
  { key: "overdue_period",   label: "Aktuelle Periode fehlt",             unit: "—",     description: "Benachrichtigung wenn der Eintrag für den aktuellen Monat/Quartal noch fehlt" },
  { key: "before_due_days",  label: "X Tage vor Periodenende",            unit: "Tage",  description: "Erinnerung X Tage bevor die aktuelle Periode endet" },
] as const;

const MARKETS = [1, 2, 3] as const;

async function getLastEntryDate(sectionKey: string, marketId: number): Promise<Date | null> {
  const toDate = (y: number, m: number, d: number) => new Date(y, m - 1, d);
  let row: any;

  try {
    switch (sectionKey) {
      case "2.1": {
        const r = await pool.query(
          `SELECT year, month, day FROM wareneingang_entries WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "2.2": {
        const r = await pool.query(
          `SELECT year, month, day FROM warencheck_og WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "2.3": {
        const r = await pool.query(
          `SELECT year, month, day FROM reinigung_taeglich WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "3.1": {
        const r = await pool.query(
          `SELECT year, month, day FROM wareneingang_entries WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "3.2": {
        const r = await pool.query(
          `SELECT datum FROM metz_reinigung WHERE market_id = $1 ORDER BY datum DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row?.datum ? new Date(row.datum) : null;
      }
      case "3.3": {
        const r = await pool.query(
          `SELECT year, month, day FROM oeffnung_salate WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "3.4": {
        const r = await pool.query(
          `SELECT year, month, day FROM kaesetheke_kontrolle WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "3.5": {
        const r = await pool.query(
          `SELECT year, month, day FROM semmelliste WHERE market_id = $1 ORDER BY year DESC, month DESC, day DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, row.day) : null;
      }
      case "1.5": {
        const r = await pool.query(
          `SELECT year, month FROM cleaning_plan_confirmations WHERE tenant_id = 1 ORDER BY year DESC, month DESC LIMIT 1`
        );
        row = r.rows[0];
        return row ? toDate(row.year, row.month, 1) : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

async function currentPeriodHasEntry(sectionKey: string, marketId: number): Promise<boolean> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  try {
    switch (sectionKey) {
      case "3.2": {
        const r = await pool.query(
          `SELECT id FROM metz_reinigung WHERE market_id = $1 AND EXTRACT(year FROM datum) = $2 AND EXTRACT(month FROM datum) = $3 LIMIT 1`,
          [marketId, year, month]
        );
        return r.rows.length > 0;
      }
      case "1.5": {
        const r = await pool.query(
          `SELECT id FROM cleaning_plan_confirmations WHERE tenant_id = 1 AND year = $1 AND month = $2 LIMIT 1`,
          [year, month]
        );
        return r.rows.length > 0;
      }
      case "1.6": {
        const r = await pool.query(
          `SELECT id FROM betriebsbegehung WHERE quartal = $1 AND year = $2 LIMIT 1`,
          [quarter, year]
        );
        return r.rows.length > 0;
      }
      case "3.8": {
        const r = await pool.query(
          `SELECT id FROM gq_begehung WHERE market_id = $1 AND quartal = $2 AND year = $3 LIMIT 1`,
          [marketId, quarter, year]
        );
        return r.rows.length > 0;
      }
      default:
        return true;
    }
  } catch {
    return true;
  }
}

function daysUntilPeriodEnd(sectionKey: string): number {
  const now = new Date();
  const section = MONITORABLE_SECTIONS.find(s => s.key === sectionKey);
  if (!section) return 999;

  if (section.periodType === "monthly") {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000);
  }
  if (section.periodType === "quarterly") {
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const endMonth = quarter * 3;
    const endOfQuarter = new Date(now.getFullYear(), endMonth, 0);
    return Math.ceil((endOfQuarter.getTime() - now.getTime()) / 86400000);
  }
  return 999;
}

async function shouldTrigger(rule: any, marketId: number): Promise<{ triggered: boolean; reason: string }> {
  const now = new Date();

  if (rule.trigger_type === "no_entry_days") {
    const lastEntry = await getLastEntryDate(rule.section_key, marketId);
    if (!lastEntry) {
      return { triggered: true, reason: `Noch nie ein Eintrag für diesen Bereich erfasst.` };
    }
    const diffDays = Math.floor((now.getTime() - lastEntry.getTime()) / 86400000);
    if (diffDays >= rule.trigger_value) {
      return {
        triggered: true,
        reason: `Seit ${diffDays} Tagen (${lastEntry.toLocaleDateString("de-DE")}) kein neuer Eintrag.`,
      };
    }
  }

  if (rule.trigger_type === "overdue_period") {
    const hasEntry = await currentPeriodHasEntry(rule.section_key, marketId);
    if (!hasEntry) {
      return { triggered: true, reason: `Eintrag für den aktuellen Zeitraum fehlt noch.` };
    }
  }

  if (rule.trigger_type === "before_due_days") {
    const daysLeft = daysUntilPeriodEnd(rule.section_key);
    const hasEntry = await currentPeriodHasEntry(rule.section_key, marketId);
    if (!hasEntry && daysLeft <= rule.trigger_value) {
      return {
        triggered: true,
        reason: `Eintrag fehlt noch – nur noch ${daysLeft} Tag(e) bis zum Periodenende.`,
      };
    }
  }

  return { triggered: false, reason: "" };
}

async function getSmtpTransporter() {
  const r = await pool.query(`SELECT * FROM email_settings LIMIT 1`);
  const cfg = r.rows[0];
  if (!cfg?.smtp_user || !cfg?.smtp_pass) return null;
  return nodemailer.createTransport({
    host: cfg.smtp_host || "smtp.gmail.com",
    port: cfg.smtp_port || 587,
    secure: (cfg.smtp_port || 587) === 465,
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  });
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const transporter = await getSmtpTransporter();
    if (!transporter) return false;
    await transporter.sendMail({
      from: `"EDEKA Dallmann HACCP" <${(await pool.query(`SELECT smtp_user FROM email_settings LIMIT 1`)).rows[0]?.smtp_user}>`,
      to,
      subject,
      html: body,
    });
    return true;
  } catch (e) {
    console.error("[Notifications] Email-Fehler:", e);
    return false;
  }
}

async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    return resp.ok;
  } catch (e) {
    console.error("[Notifications] Telegram-Fehler:", e);
    return false;
  }
}

function formatEmailBody(sectionLabel: string, marketName: string, reason: string, ruleTrigger: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <div style="background: #1a3a6b; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">⚠️ HACCP Benachrichtigung</h2>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">EDEKA Dallmann – ${marketName}</p>
      </div>
      <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Bereich:</td><td style="font-weight: bold; font-size: 14px;">${sectionLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Grund:</td><td style="font-size: 14px;">${reason}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td><td style="font-size: 14px;">${new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 6px; font-size: 13px; color: #92400e;">
          Bitte tragen Sie die fehlenden Daten zeitnah in das HACCP-System nach.
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">Automatisch generiert vom HACCP-System · EDEKA Dallmann</p>
    </div>
  `;
}

function formatTelegramMessage(sectionLabel: string, marketName: string, reason: string): string {
  return `⚠️ <b>HACCP Benachrichtigung</b>\n📍 ${marketName}\n\n<b>Bereich:</b> ${sectionLabel}\n<b>Grund:</b> ${reason}\n\n📅 ${new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}\n\n<i>Bitte fehlende Einträge nachholen.</i>`;
}

const MARKET_NAMES: Record<number, string> = {
  1: "Leeder",
  2: "Buching",
  3: "Marktoberdorf",
};

export async function runNotificationCheck(): Promise<{ checked: number; sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  const rulesResult = await pool.query(
    `SELECT * FROM notification_rules WHERE is_active = TRUE AND tenant_id = 1`
  );
  const rules = rulesResult.rows;

  const usersResult = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, nc.channel_type, nc.telegram_chat_id, nc.email_override
     FROM users u
     LEFT JOIN notification_channels nc ON nc.user_id = u.id
     WHERE u.is_registered = TRUE`
  );
  const usersMap = new Map(usersResult.rows.map(u => [u.id, u]));

  for (const rule of rules) {
    const section = MONITORABLE_SECTIONS.find(s => s.key === rule.section_key);
    if (!section) continue;

    const userIds: number[] = rule.notify_user_ids || [];
    if (userIds.length === 0) continue;

    for (const marketId of MARKETS) {
      const { triggered, reason } = await shouldTrigger(rule, marketId);
      if (!triggered) continue;

      const marketName = MARKET_NAMES[marketId] || `Markt ${marketId}`;

      for (const userId of userIds) {
        const user = usersMap.get(userId);
        if (!user) continue;

        const channel = user.channel_type || "off";
        if (channel === "off") continue;

        const alreadySent = await pool.query(
          `SELECT id FROM notification_log WHERE rule_id = $1 AND user_id = $2 AND market_id = $3 AND sent_at > NOW() - INTERVAL '20 hours'`,
          [rule.id, userId, marketId]
        );
        if (alreadySent.rows.length > 0) continue;

        let status = "failed";

        if (channel === "email") {
          const emailTo = user.email_override || user.email;
          if (emailTo) {
            const ok = await sendEmail(
              emailTo,
              `⚠️ HACCP: ${section.label} – ${marketName}`,
              formatEmailBody(section.label, marketName, reason, rule.trigger_type)
            );
            status = ok ? "sent" : "failed";
            if (ok) sent++;
            else errors++;
          }
        }

        if (channel === "telegram") {
          const chatId = user.telegram_chat_id;
          if (chatId) {
            const ok = await sendTelegram(
              chatId,
              formatTelegramMessage(section.label, marketName, reason)
            );
            status = ok ? "sent" : "failed";
            if (ok) sent++;
            else errors++;
          }
        }

        await pool.query(
          `INSERT INTO notification_log (rule_id, user_id, market_id, channel_type, message, status) VALUES ($1, $2, $3, $4, $5, $6)`,
          [rule.id, userId, marketId, channel, reason, status]
        );
      }
    }
  }

  return { checked: rules.length, sent, errors };
}

export function startNotificationCron() {
  console.log("[Notifications] Starte täglichen Check (07:00 Uhr)...");
  cron.schedule("0 7 * * *", async () => {
    console.log("[Notifications] Starte tägliche Prüfung...");
    try {
      const result = await runNotificationCheck();
      console.log(`[Notifications] Abgeschlossen: ${result.checked} Regeln, ${result.sent} gesendet, ${result.errors} Fehler`);
    } catch (e) {
      console.error("[Notifications] Fehler beim täglichen Check:", e);
    }
  }, { timezone: "Europe/Berlin" });
}
