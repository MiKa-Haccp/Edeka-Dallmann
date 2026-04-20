import { db, emailSettingsTable, marketEmailConfigsTable, usersTable, tuevJahresberichtTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";
import nodemailer from "nodemailer";
import cron from "node-cron";

const MARKETS: Record<number, { name: string }> = {
  1: { name: "Leeder" },
  2: { name: "Buching" },
  3: { name: "Marktoberdorf" },
};

async function getGlobalSettings() {
  const rows = await db.select().from(emailSettingsTable).limit(1);
  return rows[0] || null;
}

async function getMarketConfig(marketId: number) {
  const rows = await db.select().from(marketEmailConfigsTable).where(eq(marketEmailConfigsTable.marketId, marketId));
  return rows[0] || null;
}

function resolveSmtpUser(
  global: typeof emailSettingsTable.$inferSelect,
  marketConfig?: typeof marketEmailConfigsTable.$inferSelect | null
): string | undefined {
  return marketConfig?.smtpUser || global.smtpUser || process.env.SMTP_USER || undefined;
}

async function buildTransporter(
  global: typeof emailSettingsTable.$inferSelect,
  marketConfig?: typeof marketEmailConfigsTable.$inferSelect | null
) {
  const user = resolveSmtpUser(global, marketConfig);
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

function buildFromAddress(
  global: typeof emailSettingsTable.$inferSelect,
  marketConfig?: typeof marketEmailConfigsTable.$inferSelect | null
): string {
  const user = resolveSmtpUser(global, marketConfig);
  const name = marketConfig?.fromName || global.fromName || "EDEKA Dallmann HACCP";
  return `"${name}" <${user ?? ""}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(marktName: string, year: number, fristDatum: Date, massnahmen: string): string {
  const fristFormatted = fristDatum.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  let massnahmenHtml = "<em style='color:#9ca3af;'>Keine Maßnahmen eingetragen.</em>";
  try {
    const parsed: unknown = JSON.parse(massnahmen);
    if (Array.isArray(parsed) && parsed.length > 0) {
      massnahmenHtml = `<ul style="margin:0;padding-left:18px;font-size:13px;color:#111;">
        ${parsed.map((m: unknown) => {
          if (typeof m === "string") return `<li>${escapeHtml(m)}</li>`;
          if (typeof m === "object" && m !== null) {
            const obj = m as Record<string, unknown>;
            const text = obj.text ?? obj.titel ?? obj.massnahme ?? obj.beschreibung ?? JSON.stringify(m);
            return `<li>${escapeHtml(String(text))}</li>`;
          }
          return `<li>${escapeHtml(String(m))}</li>`;
        }).join("")}
      </ul>`;
    }
  } catch {
    if (massnahmen && massnahmen.trim() && massnahmen !== "[]") {
      massnahmenHtml = `<p style="margin:0;font-size:13px;color:#111;">${escapeHtml(massnahmen)}</p>`;
    }
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || ""}`;
  const kontrollberichtLink = `${appUrl}/kontrollberichte`;

  return `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
    <div style="background:#1a3a6b;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:19px;">TÜV-Aktionsplan – Frist läuft ab</h2>
      <p style="margin:5px 0 0;opacity:0.8;font-size:13px;">EDEKA Dallmann – ${marktName} | Jahr ${year}</p>
    </div>
    <div style="background:#fff;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-bottom:16px;">
        <strong style="color:#856404;">Erinnerung:</strong>
        <span style="color:#856404;"> Die TÜV-Aktionsplan-Frist für <strong>${marktName}</strong> läuft in 2 Tagen ab.</span>
      </div>

      <h3 style="color:#1a3a6b;font-size:14px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:16px 0 6px;">Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:3px 0;color:#6b7280;width:42%;">Filiale</td><td style="padding:3px 0;font-weight:600;color:#111;">${marktName}</td></tr>
        <tr><td style="padding:3px 0;color:#6b7280;">Berichtsjahr</td><td style="padding:3px 0;font-weight:600;color:#111;">${year}</td></tr>
        <tr><td style="padding:3px 0;color:#6b7280;">Fälligkeitsdatum</td><td style="padding:3px 0;font-weight:600;color:#c0392b;">${fristFormatted}</td></tr>
      </table>

      <h3 style="color:#1a3a6b;font-size:14px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:16px 0 6px;">Eingetragene Maßnahmen</h3>
      ${massnahmenHtml}

      <div style="margin-top:20px;text-align:center;">
        <a href="${kontrollberichtLink}" style="display:inline-block;background:#1a3a6b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Zu den Kontrollberichten →</a>
      </div>

      <p style="font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px;margin-top:16px;">Diese E-Mail wurde automatisch vom HACCP-System von EDEKA Dallmann erstellt.</p>
    </div>
  </div>`;
}

const AKTIONSPLAN_FRIST_DAYS = 21;
const NOTIFY_DAYS_BEFORE = 2;

async function checkAndNotifyExpiringAktionsplaene() {
  console.log("[TÜV-Notifier] Prüfe ablaufende Aktionsplan-Fristen...");

  const global = await getGlobalSettings();
  if (!global?.enabled) {
    console.log("[TÜV-Notifier] E-Mail-Versand deaktiviert – übersprungen.");
    return;
  }

  // dueDate = aktionsplanDatum + 21 days
  // We want records where dueDate is exactly 2 days from now:
  //   aktionsplanDatum + 21 = today + 2
  //   aktionsplanDatum = today + 2 - 21 = today - 19
  const now = new Date();
  const aktionsplanTargetDate = new Date(now);
  aktionsplanTargetDate.setDate(aktionsplanTargetDate.getDate() + NOTIFY_DAYS_BEFORE - AKTIONSPLAN_FRIST_DAYS);

  const targetStart = new Date(aktionsplanTargetDate);
  targetStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(targetStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const records = await db
    .select()
    .from(tuevJahresberichtTable)
    .where(
      and(
        gte(tuevJahresberichtTable.aktionsplanDatum, targetStart),
        lt(tuevJahresberichtTable.aktionsplanDatum, nextDayStart)
      )
    );

  if (records.length === 0) {
    console.log("[TÜV-Notifier] Keine ablaufenden Fristen gefunden.");
    return;
  }

  console.log(`[TÜV-Notifier] ${records.length} Frist(en) laufen in 2 Tagen ab.`);

  for (const record of records) {
    const marktName = MARKETS[record.marketId]?.name || `Markt ${record.marketId}`;
    const marketConfig = await getMarketConfig(record.marketId);
    const transporter = await buildTransporter(global, marketConfig);
    if (!transporter) {
      console.warn(`[TÜV-Notifier] Kein Transporter für Markt ${marktName} – übersprungen.`);
      continue;
    }

    const recipients = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.tenantId, record.tenantId));

    const emailRecipients = recipients.filter(
      (u) => (u.role === "ADMIN" || u.role === "MARKTLEITER" || u.role === "SUPERADMIN") &&
              u.email &&
              u.email.trim() !== "" &&
              u.status === "aktiv"
    );

    if (emailRecipients.length === 0) {
      console.warn(`[TÜV-Notifier] Keine Empfänger (Admin/Marktleiter) für Tenant ${record.tenantId} gefunden.`);
      continue;
    }

    const erstelltAm = record.aktionsplanDatum!;
    const fristDatum = new Date(erstelltAm);
    fristDatum.setDate(fristDatum.getDate() + AKTIONSPLAN_FRIST_DAYS);
    const massnahmen = record.aktionsplanMassnahmen || "[]";
    const html = buildEmailHtml(marktName, record.year, fristDatum, massnahmen);
    const fristFormatted = fristDatum.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const subject = `Erinnerung: TÜV-Aktionsplan-Frist läuft ab – ${marktName} (${fristFormatted})`;
    const from = buildFromAddress(global, marketConfig);

    for (const user of emailRecipients) {
      try {
        await transporter.sendMail({ from, to: user.email!, subject, html });
        console.log(`[TÜV-Notifier] E-Mail gesendet an ${user.email} (${user.name}, ${marktName}).`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[TÜV-Notifier] Fehler beim Senden an ${user.email}: ${message}`);
      }
    }
  }
}

export function startTuevDeadlineCron() {
  cron.schedule("0 7 * * *", async () => {
    try {
      await checkAndNotifyExpiringAktionsplaene();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[TÜV-Notifier] Unerwarteter Fehler:", message);
    }
  }, { timezone: "Europe/Berlin" });

  console.log("[TÜV-Notifier] Cron gestartet – prüft täglich um 07:00 Uhr (Berlin).");
}
