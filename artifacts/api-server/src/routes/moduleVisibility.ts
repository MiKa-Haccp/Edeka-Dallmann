import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

pool.query(`
  CREATE TABLE IF NOT EXISTS module_visibility (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    module_id VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, module_id)
  )
`).catch(console.error);

const MANAGED_MODULES = ["haccp", "ware", "todo", "verwaltung"];

router.get("/module-visibility", async (req, res) => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : 1;
  const result = await pool.query(
    `SELECT module_id, enabled FROM module_visibility WHERE tenant_id = $1`,
    [tenantId]
  );
  const settings: Record<string, boolean> = {};
  MANAGED_MODULES.forEach(m => { settings[m] = true; });
  result.rows.forEach((r: any) => { settings[r.module_id] = r.enabled; });
  res.json({ settings });
});

router.put("/module-visibility", async (req, res) => {
  const { tenantId = 1, moduleId, enabled } = req.body as {
    tenantId?: number;
    moduleId: string;
    enabled: boolean;
  };
  if (!moduleId) {
    res.status(400).json({ error: "moduleId ist erforderlich." });
    return;
  }
  await pool.query(
    `INSERT INTO module_visibility (tenant_id, module_id, enabled, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (tenant_id, module_id)
     DO UPDATE SET enabled = $3, updated_at = NOW()`,
    [tenantId, moduleId, enabled]
  );
  res.json({ success: true });
});

export default router;
