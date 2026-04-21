import { Router, type IRouter } from "express";
import { db, archivLocksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import pg from "pg";

const router: IRouter = Router();

// GET /archiv/locks?marketId=X[&year=Y]
router.get("/archiv/locks", async (req, res) => {
  const marketId = Number(req.query.marketId);
  if (!marketId) { res.status(400).json({ error: "marketId required" }); return; }
  const cond = req.query.year
    ? and(eq(archivLocksTable.marketId, marketId), eq(archivLocksTable.year, Number(req.query.year)))
    : eq(archivLocksTable.marketId, marketId);
  const rows = await db.select().from(archivLocksTable).where(cond);
  res.json(rows);
});

// POST /archiv/lock
router.post("/archiv/lock", async (req, res) => {
  const { marketId, year, lockedBy, lockedByName, tenantId = 1 } = req.body;
  if (!marketId || !year) { res.status(400).json({ error: "marketId und year erforderlich" }); return; }
  const existing = await db.select().from(archivLocksTable)
    .where(and(eq(archivLocksTable.marketId, marketId), eq(archivLocksTable.year, year)));
  if (existing.length > 0) { res.status(409).json({ error: "Jahr bereits archiviert" }); return; }
  const [row] = await db.insert(archivLocksTable)
    .values({ tenantId, marketId, year, lockedBy: lockedBy || null, lockedByName: lockedByName || null })
    .returning();
  res.json(row);
});

// DELETE /archiv/lock/:marketId/:year
router.delete("/archiv/lock/:marketId/:year", async (req, res) => {
  const marketId = Number(req.params.marketId);
  const year = Number(req.params.year);
  if (!marketId || !year) { res.status(400).json({ error: "Ungültige Parameter" }); return; }
  await db.delete(archivLocksTable)
    .where(and(eq(archivLocksTable.marketId, marketId), eq(archivLocksTable.year, year)));
  res.json({ ok: true });
});

// GET /archiv/revisionslog?marketId=X&year=Y&month=M&modul=string&limit=N
// Uses $1=marketId|null, $2=year|null, $3=month|null, $4=limit
router.get("/archiv/revisionslog", async (req, res) => {
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const year     = req.query.year     ? Number(req.query.year)     : null;
  const month    = req.query.month    ? Number(req.query.month)    : null;
  const modul    = (req.query.modul as string | undefined)?.toLowerCase() ?? "";
  const limit    = Math.min(Number(req.query.limit) || 500, 2000);

  // Shared filter: $1=marketId, $2=year, $3=month, $4=limit
  const params = [marketId, year, month, limit];
  const mf = "($1::integer IS NULL OR market_id = $1)";
  const yf = "($2::integer IS NULL OR year = $2)";
  const mo3 = "($3::integer IS NULL OR month = $3)";

  const subqueries: string[] = [];

  if (!modul || modul.includes("reinigung")) {
    subqueries.push(`SELECT 'Reinigung täglich' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM reinigung_taeglich WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("käse") || modul.includes("kaese")) {
    subqueries.push(`SELECT 'Käsetheke' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM kaesetheke_kontrolle WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("semmel")) {
    subqueries.push(`SELECT 'Semmelliste' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM semmelliste WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("salat")) {
    subqueries.push(`SELECT 'Öffnung Salate' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM oeffnung_salate WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("wareneingang") || modul.includes("eingang")) {
    subqueries.push(`SELECT 'Wareneingänge' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM wareneingang_entries WHERE ${mf} AND ${yf} AND ${mo3}`);
    subqueries.push(`SELECT 'WE Obst & Gemüse' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM wareneingang_og WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("fleisch") || modul.includes("eingefroren")) {
    // no month column — only show if no month filter
    subqueries.push(`SELECT 'Eingefrorenes Fleisch' AS modul, market_id, year, NULL::integer AS month, NULL::integer AS day, kuerzel, user_id, created_at FROM eingefrorenes_fleisch WHERE ${mf} AND ${yf} AND $3::integer IS NULL`);
  }
  if (!modul || modul.includes("temp") || modul.includes("lager")) {
    subqueries.push(`SELECT 'Temp-Lagerkontrolle' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM temp_lager_kontrolle WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("warencheck") || modul.includes("obst")) {
    subqueries.push(`SELECT 'Warencheck OG' AS modul, market_id, year, month, day, kuerzel, user_id, created_at FROM warencheck_og WHERE ${mf} AND ${yf} AND ${mo3}`);
  }
  if (!modul || modul.includes("metz")) {
    subqueries.push(`SELECT 'Metzgerei Reinigung' AS modul, market_id, EXTRACT(YEAR FROM datum)::integer AS year, EXTRACT(MONTH FROM datum)::integer AS month, EXTRACT(DAY FROM datum)::integer AS day, kuerzel, user_id, created_at FROM metz_reinigung WHERE ${mf} AND ($2::integer IS NULL OR EXTRACT(YEAR FROM datum) = $2) AND ($3::integer IS NULL OR EXTRACT(MONTH FROM datum) = $3)`);
  }

  if (subqueries.length === 0) { res.json([]); return; }

  const union = subqueries.join(" UNION ALL ");
  const finalQuery = `
    SELECT r.modul, r.market_id, r.year, r.month, r.day, r.kuerzel, r.user_id,
           r.created_at, u.name AS user_name, m.name AS market_name
    FROM (${union}) r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN markets m ON m.id = r.market_id
    ORDER BY r.created_at DESC
    LIMIT $4
  `;

  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query(finalQuery, params);
    await pool.end();
    res.json(rows);
  } catch (err: any) {
    console.error("Revisionslog error:", err?.message);
    res.status(500).json({ error: err?.message ?? "Unbekannter Fehler" });
  }
});

export default router;
