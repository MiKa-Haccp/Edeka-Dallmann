import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

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
    // Update existing
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
