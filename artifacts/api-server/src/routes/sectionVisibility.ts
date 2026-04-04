import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/section-visibility", async (req, res) => {
  try {
    const tenantId = parseInt(String(req.query.tenantId || "1"), 10);
    const r = await pool.query(
      `SELECT section_id, enabled FROM section_visibility WHERE tenant_id=$1`,
      [tenantId]
    );
    const settings: Record<number, boolean> = {};
    for (const row of r.rows) settings[row.section_id] = row.enabled;
    res.json({ settings });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.put("/section-visibility", async (req, res) => {
  try {
    const { tenantId = 1, sectionId, enabled } = req.body;
    await pool.query(
      `INSERT INTO section_visibility (tenant_id, section_id, enabled, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (tenant_id, section_id)
       DO UPDATE SET enabled=$3, updated_at=NOW()`,
      [tenantId, sectionId, enabled]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
