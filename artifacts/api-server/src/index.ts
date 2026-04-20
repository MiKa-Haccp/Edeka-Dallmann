import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startNotificationCron();
  startMonatsberichtCron();
  startTuevDeadlineCron();
});
