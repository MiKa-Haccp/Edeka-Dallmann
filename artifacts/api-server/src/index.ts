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

// ── Sequence-Reparatur: SERIAL-Sequenzen auf MAX(id)+1 setzen ─────────────
// Wenn Daten mit expliziten IDs importiert wurden (z.B. via Backup-Restore
// oder Drizzle-Push), bleibt die zugehörige Sequence auf 1 stehen. Beim
// nächsten Insert wirft Postgres dann "duplicate key value violates unique
// constraint". Diese Routine synchronisiert alle Sequenzen automatisch.
async function fixSequences() {
  try {
    console.log("[DB] Sequence-Reparatur läuft...");
    // Erfasst sowohl SERIAL- als auch IDENTITY-Spalten via pg_get_serial_sequence,
    // das in beiden Fällen die zugehörige Sequenz liefert.
    const result = await pool.query<{
      table_name: string;
      column_name: string;
      sequence_name: string;
    }>(`
      SELECT
        c.relname AS table_name,
        a.attname AS column_name,
        pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) AS sequence_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
    `);

    let fixed = 0;
    let skipped = 0;
    for (const row of result.rows) {
      try {
        const ident = (s: string) => '"' + s.replace(/"/g, '""') + '"';
        const tableQ = ident(row.table_name);
        const columnQ = ident(row.column_name);

        const maxRes = await pool.query<{ m: string | null }>(
          `SELECT COALESCE(MAX(${columnQ}), 0)::bigint AS m FROM ${tableQ}`
        );
        const seqRes = await pool.query<{ last_value: string; is_called: boolean }>(
          `SELECT last_value, is_called FROM ${row.sequence_name}`
        );
        const maxVal = BigInt(maxRes.rows[0]?.m ?? 0);
        const lastValue = BigInt(seqRes.rows[0]?.last_value ?? 0);
        const isCalled = seqRes.rows[0]?.is_called ?? false;
        // Wert, der beim nächsten nextval() vergeben würde
        const nextEmit = isCalled ? lastValue + 1n : lastValue;
        // Nur reparieren, wenn die nächste Vergabe eine Kollision erzeugen würde.
        // Sequenzen werden NIE zurückgesetzt – nur erhöht.
        if (maxVal >= nextEmit) {
          const target = maxVal + 1n;
          await pool.query(`SELECT setval($1, $2, false)`, [row.sequence_name, target.toString()]);
          fixed++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.warn(`[DB] Sequence-Fix fehlgeschlagen für ${row.table_name}.${row.column_name}:`, e);
      }
    }
    console.log(`[DB] Sequence-Reparatur abgeschlossen: ${fixed} repariert, ${skipped} bereits korrekt.`);
  } catch (err) {
    console.error("[DB] Sequence-Reparatur fehlgeschlagen:", err);
  }
}

runTodoMigrations().then(() => fixSequences()).then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    startNotificationCron();
    startMonatsberichtCron();
    startTuevDeadlineCron();
  });
});
