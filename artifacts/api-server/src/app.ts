import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api", router);

// Globaler Error-Handler – fängt unbehandelte Fehler aus allen Routen
// und gibt strukturierte PostgreSQL-Details zurück (Code, Detail, Constraint,
// Spalte, Tabelle, Hinweis), damit Probleme remote diagnostizierbar sind.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = err as {
    message?: string;
    stack?: string;
    code?: string;
    detail?: string;
    constraint?: string;
    hint?: string;
    column?: string;
    table?: string;
    cause?: {
      message?: string;
      code?: string;
      detail?: string;
      constraint?: string;
      hint?: string;
      column?: string;
      table?: string;
    };
  };
  const cause = e?.cause || {};
  console.error(`[API] Unhandled error in ${req.method} ${req.path}:`, err, "cause:", cause);

  if (res.headersSent) return;

  res.status(500).json({
    error: `Server-Fehler: ${cause.message || e?.message || "unbekannt"}`,
    detail: cause.detail || e?.detail || null,
    pgCode: cause.code || e?.code || null,
    constraint: cause.constraint || e?.constraint || null,
    hint: cause.hint || null,
    column: cause.column || e?.column || null,
    table: cause.table || e?.table || null,
    route: `${req.method} ${req.path}`,
  });
});

export default app;
