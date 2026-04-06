import { pool } from "@workspace/db";
import nodemailer from "nodemailer";
import cron from "node-cron";

export const MONITORABLE_SECTIONS = [
  { key: "1.1",  label: "Verantwortlichkeiten",            group: "HACCP 1 – Allgemein",  periodType: "yearly",    description: "Jährliche Pflege der Verantwortlichkeiten im Markt" },
  { key: "1.4",  label: "Schulungsnachweise",              group: "HACCP 1 – Allgemein",  periodType: "yearly",    description: "Jahresschulungen — mind. 1 Nachweis pro Jahr und Filiale" },
  { key: "1.5",  label: "Reinigungsplan Jahr",             group: "HACCP 1 – Allgemein",  periodType: "monthly",   description: "Monatliche Bestätigungen im Reinigungsplan" },
  { key: "1.6",  label: "Betriebsbegehung",                group: "HACCP 1 – Allgemein",  periodType: "quarterly", description: "Vierteljährliche Betriebsbegehung" },
  { key: "2.1",  label: "Wareneingaenge",                  group: "HACCP 2 – Markt",      periodType: "daily",     description: "Tägliche Wareneingangskontrolle" },
  { key: "2.2",  label: "Warenzustand Obst & Gemüse",      group: "HACCP 2 – Markt",      periodType: "daily",     description: "Tägliche Kontrolle Warenzustand Obst & Gemüse" },
  { key: "2.3",  label: "Reinigungsdokumentation täglich", group: "HACCP 2 – Markt",      periodType: "daily",     description: "Tägliche Reinigungsdokumentation" },
  { key: "3.1",  label: "Wareneingaenge Metzgerei",        group: "HACCP 3 – Metzgerei",  periodType: "daily",     description: "Tägliche Wareneingangskontrolle Metzgerei" },
  { key: "3.2",  label: "Reinigungspläne Metzgerei",       group: "HACCP 3 – Metzgerei",  periodType: "monthly",   description: "Monatliche Reinigungspläne Metzgerei" },
  { key: "3.3",  label: "Öffnung Salate",                  group: "HACCP 3 – Metzgerei",  periodType: "daily",     description: "Tägliche Öffnungsdokumentation Salate" },
  { key: "3.4",  label: "Käsetheke und Reifeschrank",      group: "HACCP 3 – Metzgerei",  periodType: "daily",     description: "Tägliche Käsetheke-Kontrolle" },
  { key: "3.8",  label: "GQ-Betriebsbegehung",             group: "HACCP 3 – Metzgerei",  periodType: "quarterly", description: "Vierteljährliche GQ-Betriebsbegehung Metzgerei" },
] as const;

export const CHECK_RHYTHMS = [
  { key: "daily",          label: "Täglich",                    description: "Wird jeden Tag geprüft" },
  { key: "weekly_monday",  label: "Wöchentlich (jeden Montag)", description: "Wird jeden Montag geprüft" },
  { key: "monthly",        label: "Monatlich (1. des Monats)",  description: "Wird am 1. jedes Monats geprüft" },
  { key: "quarterly",      label: "Quartalsweise",              description: "Wird am Quartalsbeginn geprüft" },
  { key: "yearly",         label: "Jährlich (1. Januar)",       description: "Wird einmal jährlich geprüft" },
];

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
      case "1.1": {
        const r = await pool.query(
          `SELECT created_at FROM responsibilities WHERE market_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row?.created_at ? new Date(row.created_at) : null;
      }
      case "1.4": {
        const r = await pool.query(
          `SELECT created_at FROM schulungsnachweise WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [marketId]
        );
        row = r.rows[0];
        return row?.created_at ? new Date(row.created_at) : null;
      }
      case "1.5": {
        const r = await pool.query(
          `SELECT year, month FROM cleaning_plan_confirmations WHERE tenant_id = $1 ORDER BY year DESC, month DESC LIMIT 1`,
          [marketId]
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
  if (section.periodType === "yearly") {
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    return Math.ceil((endOfYear.getTime() - now.getTime()) / 86400000);
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

async function getMarketSmtpConfig(marketId?: number) {
  const global = await pool.query(`SELECT * FROM email_settings LIMIT 1`).then(r => r.rows[0]);
  let market: any = null;
  if (marketId) {
    market = await pool.query(`SELECT * FROM market_email_configs WHERE market_id = $1`, [marketId]).then(r => r.rows[0] || null);
  }
  const user = market?.smtp_user || global?.smtp_user || process.env.SMTP_USER;
  const pass = market?.smtp_pass || global?.smtp_pass || process.env.SMTP_PASS;
  const host = global?.smtp_host || process.env.SMTP_HOST || "smtp.ionos.de";
  const port = Number(global?.smtp_port || process.env.SMTP_PORT || 587);
  const fromName = market?.from_name || global?.from_name || "EDEKA Dallmann HACCP";
  return { user, pass, host, port, fromName };
}

async function getSmtpTransporter(marketId?: number) {
  const { user, pass, host, port } = await getMarketSmtpConfig(marketId);
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getSmtpFromAddress(marketId?: number): Promise<string> {
  const { user, fromName } = await getMarketSmtpConfig(marketId);
  return `"${fromName}" <${user || ""}>`;
}

async function sendEmail(to: string, subject: string, body: string, marketId?: number): Promise<boolean> {
  try {
    const transporter = await getSmtpTransporter(marketId);
    if (!transporter) {
      console.error(`[Notifications] Kein SMTP-Transporter für Markt ${marketId} – Zugangsdaten fehlen.`);
      return false;
    }
    const from = await getSmtpFromAddress(marketId);
    console.log(`[Notifications] Sende E-Mail von ${from} an ${to} (Markt ${marketId})`);
    await transporter.sendMail({ from, to, subject, html: body });
    return true;
  } catch (e) {
    console.error("[Notifications] Email-Fehler:", e);
    return false;
  }
}

function shouldCheckToday(rhythm: string | null): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const date = now.getDate();
  const month = now.getMonth(); // 0-indexed

  switch (rhythm || "daily") {
    case "daily":         return true;
    case "weekly_monday": return day === 1;
    case "monthly":       return date === 1;
    case "quarterly": {
      const quarterStartMonths = [0, 3, 6, 9];
      return date === 1 && quarterStartMonths.includes(month);
    }
    case "yearly":        return date === 1 && month === 0;
    default:              return true;
  }
}

async function getTelegramBotToken(): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  try {
    const r = await pool.query(`SELECT telegram_bot_token FROM email_settings LIMIT 1`);
    return r.rows[0]?.telegram_bot_token || null;
  } catch { return null; }
}

async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  const token = await getTelegramBotToken();
  if (!token) { console.error("[Notifications] Kein Telegram-Bot-Token konfiguriert."); return false; }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      console.error(`[Notifications] Telegram-Fehler für Chat-ID ${chatId}: ${body.description || resp.statusText} (Code: ${body.error_code || resp.status})`);
      return false;
    }
    return true;
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
    `SELECT u.id, u.name, u.email, u.role, u.assigned_market_ids,
            nc.channel_type, nc.telegram_chat_id, nc.email_override
     FROM users u
     LEFT JOIN notification_channels nc ON nc.user_id = u.id
     WHERE u.is_registered = TRUE`
  );
  const usersMap = new Map(usersResult.rows.map(u => [u.id, u]));

  for (const rule of rules) {
    const section = MONITORABLE_SECTIONS.find(s => s.key === rule.section_key);
    if (!section) continue;

    // Skip if today is not a check day for this rule's rhythm
    if (!shouldCheckToday(rule.check_rhythm || "daily")) continue;

    const userIds: number[] = rule.notify_user_ids || [];
    if (userIds.length === 0) continue;

    // Determine which markets this rule applies to
    const ruleMarkets: number[] = (rule.market_ids && rule.market_ids.length > 0)
      ? rule.market_ids.filter((id: number) => MARKETS.includes(id))
      : MARKETS;

    for (const marketId of ruleMarkets) {
      const { triggered, reason } = await shouldTrigger(rule, marketId);
      if (!triggered) continue;

      const marketName = MARKET_NAMES[marketId] || `Markt ${marketId}`;

      for (const userId of userIds) {
        const user = usersMap.get(userId);
        if (!user) continue;

        // Skip if user is restricted to specific markets and this market is not in their list
        const assignedMarkets: number[] | null = user.assigned_market_ids;
        if (assignedMarkets && assignedMarkets.length > 0 && !assignedMarkets.includes(marketId)) continue;

        const channel = user.channel_type || "off";
        if (channel === "off") continue;

        const alreadySent = await pool.query(
          `SELECT id FROM notification_log WHERE rule_id = $1 AND user_id = $2 AND market_id = $3 AND status = 'sent' AND sent_at > NOW() - INTERVAL '20 hours'`,
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
              formatEmailBody(section.label, marketName, reason, rule.trigger_type),
              marketId
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

export interface PendingRuleItem {
  sectionKey: string;
  sectionLabel: string;
  marketId: number;
  triggered: boolean;
  reason: string;
  triggerType: string;
  triggerValue: number;
}

export async function getPendingRulesForUser(userId: number, marketId: number | null): Promise<PendingRuleItem[]> {
  const rulesRes = await pool.query(
    `SELECT * FROM notification_rules WHERE is_active = true AND $1 = ANY(notify_user_ids)`,
    [userId]
  );
  const rules = rulesRes.rows;
  const results: PendingRuleItem[] = [];

  for (const rule of rules) {
    const section = MONITORABLE_SECTIONS.find(s => s.key === rule.section_key);
    const label = section?.label ?? rule.section_key;
    const marketsToCheck: number[] = rule.market_ids?.length
      ? rule.market_ids
      : marketId
        ? [marketId]
        : [1, 2, 3];

    for (const mid of marketsToCheck) {
      const { triggered, reason } = await shouldTrigger(rule, mid);
      results.push({
        sectionKey: rule.section_key,
        sectionLabel: label,
        marketId: mid,
        triggered,
        reason,
        triggerType: rule.trigger_type,
        triggerValue: rule.trigger_value,
      });
    }
  }

  return results;
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
