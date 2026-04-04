import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/temp-lager-kontrolle", async (req, res) => {
  try {
    const { marketId, year, month } = req.query;
    if (!marketId || !year || !month) return res.status(400).json({ error: "marketId, year, month required" });
    const r = await pool.query(
      `SELECT * FROM temp_lager_kontrolle WHERE market_id=$1 AND year=$2 AND month=$3 ORDER BY day ASC`,
      [marketId, year, month]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/temp-lager-kontrolle", async (req, res) => {
  try {
    const { marketId, year, month, day, tempOk, referenzOk, kuerzel, userId } = req.body;
    const r = await pool.query(
      `INSERT INTO temp_lager_kontrolle (market_id, year, month, day, temp_ok, referenz_ok, kuerzel, user_id, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (market_id, year, month, day)
       DO UPDATE SET temp_ok=COALESCE($5, temp_lager_kontrolle.temp_ok),
                     referenz_ok=COALESCE($6, temp_lager_kontrolle.referenz_ok),
                     kuerzel=$7, user_id=$8, updated_at=NOW()
       RETURNING *`,
      [marketId, year, month, day, tempOk ?? null, referenzOk ?? null, kuerzel || null, userId || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/temp-lager-kontrolle/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM temp_lager_kontrolle WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
