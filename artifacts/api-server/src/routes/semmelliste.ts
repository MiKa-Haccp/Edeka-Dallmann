import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ─── Kontingent ─────────────────────────────────────────────────────────────

// GET /semmelliste/kontingent?marketId=
router.get("/semmelliste/kontingent", async (req, res) => {
  const { marketId } = req.query;
  if (!marketId) { res.status(400).json({ error: "marketId required" }); return; }
  const { rows } = await pool.query(
    `SELECT * FROM semmelliste_kontingent WHERE market_id=$1`,
    [marketId]
  );
  if (rows.length === 0) {
    res.json({
      market_id: Number(marketId),
      semmel_standard: 0,
      freifeld_label: "Sandwich",
      freifeld_standard: 0,
      items: [],
    });
  } else {
    res.json(rows[0]);
  }
});

// POST /semmelliste/kontingent
router.post("/semmelliste/kontingent", async (req, res) => {
  const { marketId, semmelStandard, freifelLabel, freifelStandard, items } = req.body;
  if (!marketId) { res.status(400).json({ error: "marketId required" }); return; }
  const { rows } = await pool.query(
    `INSERT INTO semmelliste_kontingent (market_id, tenant_id, semmel_standard, freifeld_label, freifeld_standard, items)
     VALUES ($1, 1, $2, $3, $4, $5)
     ON CONFLICT (market_id) DO UPDATE
       SET semmel_standard=$2, freifeld_label=$3, freifeld_standard=$4, items=$5
     RETURNING *`,
    [
      marketId,
      semmelStandard ?? 0,
      freifelLabel ?? "Sandwich",
      freifelStandard ?? 0,
      JSON.stringify(items ?? []),
    ]
  );
  res.json(rows[0]);
});

// ─── Eintraege ───────────────────────────────────────────────────────────────

// GET /semmelliste?marketId=&year=&month=
router.get("/semmelliste", async (req, res) => {
  const { marketId, year, month } = req.query;
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const { rows } = await pool.query(
    `SELECT *, to_char(created_at AT TIME ZONE 'Europe/Berlin', 'HH24:MI') as zeit
     FROM semmelliste
     WHERE market_id=$1 AND year=$2 AND month=$3
     ORDER BY day, created_at`,
    [marketId, year, month]
  );
  res.json(rows);
});

// POST /semmelliste — immer neuen Eintrag hinzufügen (kein Upsert)
router.post("/semmelliste", async (req, res) => {
  const { marketId, year, month, day, semmel, sandwich, kuerzel, userId, items } = req.body;
  if (!marketId || !year || !month || !day || !kuerzel) {
    res.status(400).json({ error: "marketId, year, month, day, kuerzel required" });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO semmelliste (tenant_id, market_id, year, month, day, semmel, sandwich, kuerzel, user_id, items)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *, to_char(created_at AT TIME ZONE 'Europe/Berlin', 'HH24:MI') as zeit`,
    [marketId, year, month, day, semmel || null, sandwich || null, kuerzel, userId || null, JSON.stringify(items ?? {})]
  );
  res.json(rows[0]);
});

// DELETE /semmelliste/:id
router.delete("/semmelliste/:id", async (req, res) => {
  await pool.query("DELETE FROM semmelliste WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
