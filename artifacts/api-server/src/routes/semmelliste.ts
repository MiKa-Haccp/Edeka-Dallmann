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
    res.json({ market_id: Number(marketId), semmel_standard: 0, freifeld_label: "Sandwich", freifeld_standard: 0 });
  } else {
    res.json(rows[0]);
  }
});

// POST /semmelliste/kontingent
router.post("/semmelliste/kontingent", async (req, res) => {
  const { marketId, semmelStandard, freifelLabel, freifelStandard } = req.body;
  if (!marketId) { res.status(400).json({ error: "marketId required" }); return; }
  const { rows } = await pool.query(
    `INSERT INTO semmelliste_kontingent (market_id, tenant_id, semmel_standard, freifeld_label, freifeld_standard)
     VALUES ($1, 1, $2, $3, $4)
     ON CONFLICT (market_id) DO UPDATE
       SET semmel_standard=$2, freifeld_label=$3, freifeld_standard=$4
     RETURNING *`,
    [marketId, semmelStandard ?? 0, freifelLabel ?? "Sandwich", freifelStandard ?? 0]
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
    `SELECT * FROM semmelliste WHERE market_id=$1 AND year=$2 AND month=$3 ORDER BY day`,
    [marketId, year, month]
  );
  res.json(rows);
});

// POST /semmelliste
router.post("/semmelliste", async (req, res) => {
  const { marketId, year, month, day, semmel, sandwich, kuerzel, userId } = req.body;
  if (!marketId || !year || !month || !day || !kuerzel) {
    res.status(400).json({ error: "marketId, year, month, day, kuerzel required" });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO semmelliste (tenant_id, market_id, year, month, day, semmel, sandwich, kuerzel, user_id)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT DO NOTHING RETURNING *`,
    [marketId, year, month, day, semmel || null, sandwich || null, kuerzel, userId || null]
  );
  if (rows.length === 0) {
    const upd = await pool.query(
      `UPDATE semmelliste SET semmel=$5, sandwich=$6, kuerzel=$7, user_id=$8
       WHERE market_id=$1 AND year=$2 AND month=$3 AND day=$4 RETURNING *`,
      [marketId, year, month, day, semmel || null, sandwich || null, kuerzel, userId || null]
    );
    res.json(upd.rows[0]);
    return;
  }
  res.json(rows[0]);
});

// DELETE /semmelliste/:id
router.delete("/semmelliste/:id", async (req, res) => {
  await pool.query("DELETE FROM semmelliste WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
