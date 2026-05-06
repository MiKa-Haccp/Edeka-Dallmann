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

pool.query(`
  CREATE TABLE IF NOT EXISTS role_module_visibility (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    role TEXT NOT NULL,
    module_id VARCHAR(50) NOT NULL,
    visible BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(tenant_id, role, module_id)
  )
`).catch(console.error);

const MANAGED_MODULES = ["haccp", "ware", "todo", "verwaltung", "projekt"];

const CONFIGURABLE_ROLES = ["USER", "MARKTLEITER", "BEREICHSLEITUNG", "ADMIN"];

const DEFAULT_ROLE_VISIBILITY: Record<string, Record<string, boolean>> = {
  SUPERADMIN:      { haccp: true, ware: true, todo: true, verwaltung: true, projekt: true },
  ADMIN:           { haccp: true, ware: true, todo: true, verwaltung: true, projekt: true },
  BEREICHSLEITUNG: { haccp: true, ware: true, todo: true, verwaltung: true, projekt: true },
  MARKTLEITER:     { haccp: true, ware: true, todo: true, verwaltung: true, projekt: true },
  USER:            { haccp: true, ware: true, todo: true, verwaltung: false, projekt: false },
};

router.get("/module-visibility/matrix", async (req, res) => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : 1;

  const result = await pool.query(
    `SELECT role, module_id, visible FROM role_module_visibility WHERE tenant_id = $1`,
    [tenantId]
  );

  const matrix: Record<string, Record<string, boolean>> = {};
  CONFIGURABLE_ROLES.forEach(role => {
    const defaults = DEFAULT_ROLE_VISIBILITY[role] || {};
    matrix[role] = {};
    MANAGED_MODULES.forEach(m => {
      matrix[role][m] = defaults[m] !== undefined ? defaults[m] : true;
    });
  });

  result.rows.forEach((r: any) => {
    if (matrix[r.role]) {
      matrix[r.role][r.module_id] = r.visible;
    }
  });

  res.json({ matrix, modules: MANAGED_MODULES, roles: CONFIGURABLE_ROLES });
});

router.get("/module-visibility", async (req, res) => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : 1;
  const role = req.query.role as string | undefined;

  if (role) {
    const defaults = DEFAULT_ROLE_VISIBILITY[role] || {};
    const settings: Record<string, boolean> = {};
    MANAGED_MODULES.forEach(m => {
      settings[m] = defaults[m] !== undefined ? defaults[m] : true;
    });

    if (role !== "SUPERADMIN") {
      const result = await pool.query(
        `SELECT module_id, visible FROM role_module_visibility WHERE tenant_id = $1 AND role = $2`,
        [tenantId, role]
      );
      result.rows.forEach((r: any) => { settings[r.module_id] = r.visible; });
    }

    res.json({ settings, role });
  } else {
    const result = await pool.query(
      `SELECT module_id, enabled FROM module_visibility WHERE tenant_id = $1`,
      [tenantId]
    );
    const settings: Record<string, boolean> = {};
    MANAGED_MODULES.forEach(m => { settings[m] = true; });
    result.rows.forEach((r: any) => { settings[r.module_id] = r.enabled; });
    res.json({ settings });
  }
});

router.put("/module-visibility", async (req, res) => {
  const { tenantId = 1, moduleId, enabled, role, visible } = req.body as {
    tenantId?: number;
    moduleId: string;
    enabled?: boolean;
    visible?: boolean;
    role?: string;
  };

  if (!moduleId) {
    res.status(400).json({ error: "moduleId ist erforderlich." });
    return;
  }

  if (role) {
    const visibleValue = visible !== undefined ? visible : enabled !== undefined ? enabled : true;
    await pool.query(
      `INSERT INTO role_module_visibility (tenant_id, role, module_id, visible)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, role, module_id)
       DO UPDATE SET visible = $4`,
      [tenantId, role, moduleId, visibleValue]
    );
  } else {
    const enabledValue = enabled !== undefined ? enabled : true;
    await pool.query(
      `INSERT INTO module_visibility (tenant_id, module_id, enabled, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (tenant_id, module_id)
       DO UPDATE SET enabled = $3, updated_at = NOW()`,
      [tenantId, moduleId, enabledValue]
    );
  }

  res.json({ success: true });
});

export default router;
