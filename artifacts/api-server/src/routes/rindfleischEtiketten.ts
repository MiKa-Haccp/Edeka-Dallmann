import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/rindfleisch-etiketten", async (req, res) => {
  try {
    const { marketId, year, month } = req.query;
    if (!marketId) return res.status(400).json({ error: "marketId required" });
    let query = `SELECT id, market_id, datum, kategorie, name_unterschrift, kuerzel, created_at,
      CASE WHEN foto1 IS NOT NULL THEN true ELSE false END as has_foto1,
      CASE WHEN foto2 IS NOT NULL THEN true ELSE false END as has_foto2,
      CASE WHEN foto3 IS NOT NULL THEN true ELSE false END as has_foto3,
      CASE WHEN foto4 IS NOT NULL THEN true ELSE false END as has_foto4
      FROM rindfleisch_etiketten WHERE market_id=$1`;
    const params: any[] = [marketId];
    let idx = 2;
    if (year && month) {
      query += ` AND EXTRACT(YEAR FROM datum)=$${idx++} AND EXTRACT(MONTH FROM datum)=$${idx++}`;
      params.push(year, month);
    }
    query += ` ORDER BY datum DESC, created_at DESC`;
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/rindfleisch-etiketten/:id", async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM rindfleisch_etiketten WHERE id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/rindfleisch-etiketten", async (req, res) => {
  try {
    const { marketId, datum, kategorie, foto1, foto2, foto3, foto4, nameUnterschrift, kuerzel, userId } = req.body;
    const r = await pool.query(
      `INSERT INTO rindfleisch_etiketten (market_id, datum, kategorie, foto1, foto2, foto3, foto4, name_unterschrift, kuerzel, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, market_id, datum, kategorie, name_unterschrift, kuerzel, created_at`,
      [marketId, datum, kategorie || null, foto1 || null, foto2 || null, foto3 || null, foto4 || null,
       nameUnterschrift || null, kuerzel || null, userId || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/rindfleisch-etiketten/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM rindfleisch_etiketten WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
