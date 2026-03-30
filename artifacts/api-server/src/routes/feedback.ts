import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.post("/feedback", async (req, res) => {
  try {
    const { text, pagePath, marketId } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Text erforderlich" });
    const { rows } = await pool.query(
      `INSERT INTO feedback (text, page_path, market_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [text.trim(), pagePath || null, marketId || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("feedback POST error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.get("/feedback", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, m.name AS market_name
       FROM feedback f
       LEFT JOIN markets m ON m.id = f.market_id
       ORDER BY f.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("feedback GET error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.get("/feedback/unread-count", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS count FROM feedback WHERE is_read = FALSE`
    );
    res.json({ count: Number(rows[0].count) });
  } catch (err) {
    console.error("feedback unread-count error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.patch("/feedback/mark-all-read", async (_req, res) => {
  try {
    await pool.query(`UPDATE feedback SET is_read = TRUE WHERE is_read = FALSE`);
    res.json({ ok: true });
  } catch (err) {
    console.error("feedback mark-all-read error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

router.delete("/feedback/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM feedback WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("feedback DELETE error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

export default router;
