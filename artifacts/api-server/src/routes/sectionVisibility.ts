import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/section-visibility", async (req, res) => {
  try {
    const marketId = parseInt(String(req.query.marketId || "0"), 10);
    if (!marketId) return res.status(400).json({ error: "marketId required" });
    const r = await pool.query(
      `SELECT section_id, enabled FROM section_visibility WHERE market_id=$1`,
      [marketId]
    );
    const settings: Record<number, boolean> = {};
    for (const row of r.rows) settings[row.section_id] = row.enabled;
    res.json({ settings });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.put("/section-visibility", async (req, res) => {
  try {
    const { marketId, sectionId, enabled } = req.body;
    if (!marketId) return res.status(400).json({ error: "marketId required" });
    await pool.query(
      `INSERT INTO section_visibility (market_id, section_id, enabled, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (market_id, section_id)
       DO UPDATE SET enabled=$3, updated_at=NOW()`,
      [marketId, sectionId, enabled]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
