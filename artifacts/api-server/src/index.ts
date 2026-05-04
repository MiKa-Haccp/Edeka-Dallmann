import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { pool } from "@workspace/db";
import app from "./app";
import { startNotificationCron } from "./services/notificationEngine";
import { startMonatsberichtCron } from "./routes/monatsbericht";
import { startTuevDeadlineCron } from "./services/tuevDeadlineNotifier";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Beim Start: Datenbank-Schema automatisch synchronisieren (neue Tabellen/Spalten hinzufügen)
// Bestehende Daten werden niemals gelöscht – nur fehlende Strukturen ergänzt.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const drizzleConfig = path.resolve(__dirname, "../../../lib/db/drizzle.config.ts");
const drizzleKit = path.resolve(__dirname, "../node_modules/.bin/drizzle-kit");

try {
  console.log("[DB] Schema-Synchronisierung läuft...");
  execSync(`"${drizzleKit}" push --force --config "${drizzleConfig}"`, {
    input: "\n\n\n\n",
    stdio: ["pipe", "pipe", "pipe"],
    env: process.env,
  });
  console.log("[DB] Schema ist aktuell.");
} catch (err) {
  console.error("[DB] Schema-Synchronisierung fehlgeschlagen – Server startet trotzdem:", err);
}

// ── Todo-Modul: Manuelle Migrations (ADD COLUMN IF NOT EXISTS) ─────────────
// Diese Spalten werden per ALTER TABLE verwaltet (nicht per Drizzle-Schema),
// daher müssen sie bei jedem Start geprüft und ggf. ergänzt werden.
async function runTodoMigrations() {
  try {
    console.log("[DB] Todo-Migrationen laufen...");

    // todo_standard_tasks: sort_order für manuelle Reihenfolge
    await pool.query(`
      ALTER TABLE todo_standard_tasks
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    // todo_adhoc_tasks: task_type (heute / sofort / woche)
    await pool.query(`
      ALTER TABLE todo_adhoc_tasks
        ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'heute'
    `);

    // todo_adhoc_tasks: category (in welcher Kategorie-Sektion erscheinen)
    await pool.query(`
      ALTER TABLE todo_adhoc_tasks
        ADD COLUMN IF NOT EXISTS category TEXT
    `);

    // todo_category_order für benutzerdefinierte Kategoriereihenfolge
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todo_category_order (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL DEFAULT 1,
        market_id INTEGER NOT NULL,
        category_order JSONB NOT NULL DEFAULT '["tagesaufgaben","wochenaufgaben","aufgaben","bestellungen","lieferungen"]',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, market_id)
      )
    `);

    console.log("[DB] Todo-Migrationen abgeschlossen.");
  } catch (err) {
    console.error("[DB] Todo-Migrationen fehlgeschlagen:", err);
  }
}

runTodoMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    startNotificationCron();
    startMonatsberichtCron();
    startTuevDeadlineCron();
  });
});
