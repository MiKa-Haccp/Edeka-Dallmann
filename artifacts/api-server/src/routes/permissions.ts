import { Router, type IRouter } from "express";
import { db, usersTable, userPermissionsTable, userMarketAssignmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const VALID_ROLES = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"] as const;

export const PERMISSION_AREAS = [
  // HACCP Einträge
  { key: "entries.create",          label: "HACCP-Einträge erstellen",                   group: "HACCP Einträge" },
  { key: "entries.view_all",        label: "Alle Einträge einsehen",                     group: "HACCP Einträge" },
  { key: "entries.edit",            label: "Einträge bearbeiten",                        group: "HACCP Einträge" },
  { key: "entries.delete",          label: "Einträge löschen",                           group: "HACCP Einträge" },
  { key: "responsibilities.edit",   label: "Verantwortlichkeiten (1.1) bearbeiten",      group: "HACCP Einträge" },
  // Berichte & Dokumente
  { key: "reports.view",            label: "Berichte einsehen",                          group: "Berichte & Dokumente" },
  { key: "reports.export",          label: "Berichte exportieren",                       group: "Berichte & Dokumente" },
  { key: "reports.monatsbericht",   label: "Monatsbericht einsehen",                     group: "Berichte & Dokumente" },
  { key: "reports.tuev",            label: "TÜV-Jahresbericht bearbeiten",               group: "Berichte & Dokumente" },
  // Schulungen
  { key: "schulungen.manage",       label: "Schulungsanforderungen verwalten",           group: "Schulungen" },
  // Todo & Aufgaben
  { key: "todo.access",             label: "Todo-Listen aufrufen",                       group: "Todo & Aufgaben" },
  { key: "todo.manage",             label: "Todo-Verwaltung aufrufen (Vorlagen/Runden)", group: "Todo & Aufgaben" },
  { key: "todo.kassen",             label: "Kassenkontrolle aufrufen",                   group: "Todo & Aufgaben" },
  // Warenwirtschaft
  { key: "ware.access",             label: "Waren-Bereich aufrufen",                     group: "Warenwirtschaft" },
  { key: "ware.bestellungen",       label: "Bestellungen verwalten",                     group: "Warenwirtschaft" },
  { key: "ware.mhd",                label: "MHD-Kontrolle durchführen",                  group: "Warenwirtschaft" },
  // Metzgerei
  { key: "metzgerei.access",        label: "Metzgerei-Bereiche aufrufen",                group: "Metzgerei" },
  { key: "metzgerei.gq_begehung",   label: "GQ-Begehung durchführen",                   group: "Metzgerei" },
  // Verwaltung
  { key: "verwaltung.access",       label: "Verwaltungsbereich aufrufen",                group: "Verwaltung" },
  { key: "users.view",              label: "Mitarbeiterliste einsehen",                  group: "Verwaltung" },
  { key: "users.manage",            label: "Mitarbeiter verwalten (Kürzel/PIN)",         group: "Verwaltung" },
  { key: "users.invite_admin",      label: "Admins einladen",                            group: "Verwaltung" },
  { key: "notifications.manage",    label: "Benachrichtigungsregeln verwalten",          group: "Verwaltung" },
  // Management & Projekt
  { key: "management.hub",          label: "Management Hub aufrufen",                    group: "Management & Projekt" },
  { key: "projekt.access",          label: "Projekt-Hub aufrufen",                       group: "Management & Projekt" },
  // System
  { key: "devices.manage",          label: "Geräteverwaltung aufrufen",                  group: "System" },
  { key: "settings.manage",         label: "Systemeinstellungen verwalten",              group: "System" },
  { key: "visibility.manage",       label: "Modul- & Bereichs-Sichtbarkeit",             group: "System" },
  { key: "feedback.manage",         label: "Feedback & Bereinigung verwalten",           group: "System" },
] as const;

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SUPERADMIN: PERMISSION_AREAS.map(p => p.key),
  ADMIN: [
    "entries.create","entries.view_all","entries.edit","entries.delete","responsibilities.edit",
    "reports.view","reports.export","reports.monatsbericht","reports.tuev",
    "schulungen.manage","notifications.manage",
    "todo.access","todo.manage","todo.kassen",
    "ware.access","ware.bestellungen","ware.mhd",
    "metzgerei.access","metzgerei.gq_begehung",
    "verwaltung.access","users.view","users.manage","users.invite_admin",
    "management.hub","projekt.access",
    "devices.manage","settings.manage","visibility.manage","feedback.manage",
  ],
  BEREICHSLEITUNG: [
    "entries.create","entries.view_all","entries.edit","responsibilities.edit",
    "reports.view","reports.export","reports.monatsbericht","reports.tuev",
    "schulungen.manage","notifications.manage",
    "todo.access","todo.manage",
    "ware.access","ware.bestellungen","ware.mhd",
    "metzgerei.access","metzgerei.gq_begehung",
    "verwaltung.access","users.view","users.manage",
    "management.hub","projekt.access",
  ],
  MARKTLEITER: [
    "entries.create","entries.view_all","entries.edit",
    "reports.view","reports.monatsbericht","reports.tuev",
    "todo.access","todo.manage","todo.kassen",
    "ware.access","ware.bestellungen","ware.mhd",
    "metzgerei.access","metzgerei.gq_begehung",
    "verwaltung.access","users.view",
    "management.hub","projekt.access",
  ],
  USER: [
    "entries.create",
    "todo.access",
    "ware.access",
    "metzgerei.access",
  ],
};

router.get("/permissions/areas", (_req, res) => {
  res.json({
    areas: PERMISSION_AREAS,
    roles: VALID_ROLES,
    roleDefaults: ROLE_DEFAULT_PERMISSIONS,
  });
});

router.get("/permissions/user/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  const permissions = await db
    .select()
    .from(userPermissionsTable)
    .where(eq(userPermissionsTable.userId, userId));

  const marketAssignments = await db
    .select()
    .from(userMarketAssignmentsTable)
    .where(eq(userMarketAssignmentsTable.userId, userId));

  res.json({
    permissions,
    marketAssignments: marketAssignments.map(a => a.marketId),
  });
});

router.put("/permissions/user/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const { permissions, marketIds } = req.body as {
    permissions: string[];
    marketIds: number[];
  };

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) {
    res.status(404).json({ error: "Benutzer nicht gefunden." });
    return;
  }

  await db.delete(userPermissionsTable).where(eq(userPermissionsTable.userId, userId));

  if (permissions && permissions.length > 0) {
    await db.insert(userPermissionsTable).values(
      permissions.map(perm => ({
        userId,
        permissionType: perm,
        resourceType: "global",
        granted: true,
      }))
    );
  }

  await db.delete(userMarketAssignmentsTable).where(eq(userMarketAssignmentsTable.userId, userId));

  if (marketIds && marketIds.length > 0) {
    await db.insert(userMarketAssignmentsTable).values(
      marketIds.map(marketId => ({ userId, marketId }))
    );
  }

  res.json({ success: true });
});

router.put("/permissions/user/:userId/role", async (req, res) => {
  const userId = Number(req.params.userId);
  const { role } = req.body as { role: string };

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) {
    res.status(404).json({ error: "Benutzer nicht gefunden." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, userId))
    .returning();

  await db.delete(userPermissionsTable).where(eq(userPermissionsTable.userId, userId));

  const roleDefaults = await pool.query(
    `SELECT permissions FROM role_permission_defaults WHERE tenant_id = $1 AND role = $2`,
    [1, role]
  );
  const defaults: string[] = roleDefaults.rows[0]?.permissions || ROLE_DEFAULT_PERMISSIONS[role] || [];

  if (defaults.length > 0) {
    await db.insert(userPermissionsTable).values(
      defaults.map(perm => ({
        userId,
        permissionType: perm,
        resourceType: "global",
        granted: true,
      }))
    );
  }

  const { pin, password, ...safe } = updated;
  res.json(safe);
});

router.get("/permissions/roles", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const result = await pool.query(
    `SELECT * FROM role_permission_defaults WHERE tenant_id = $1 ORDER BY sort_order ASC, id ASC`,
    [tenantId]
  );
  res.json(result.rows);
});

router.put("/permissions/roles/:role", async (req, res) => {
  const { role } = req.params;
  const { tenantId = 1, permissions, label, color } = req.body as {
    tenantId?: number;
    permissions: string[];
    label?: string;
    color?: string;
  };

  const existing = await pool.query(
    `SELECT id FROM role_permission_defaults WHERE tenant_id = $1 AND role = $2`,
    [tenantId, role]
  );

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "Rolle nicht gefunden." });
    return;
  }

  const setClause: string[] = [`permissions = $1`];
  const values: any[] = [permissions];
  let idx = 2;

  if (label !== undefined) { setClause.push(`label = $${idx++}`); values.push(label); }
  if (color !== undefined) { setClause.push(`color = $${idx++}`); values.push(color); }

  values.push(tenantId, role);
  await pool.query(
    `UPDATE role_permission_defaults SET ${setClause.join(", ")} WHERE tenant_id = $${idx++} AND role = $${idx++}`,
    values
  );

  res.json({ success: true });
});

router.post("/permissions/roles", async (req, res) => {
  const { tenantId = 1, role, label, color = "teal", permissions = [], sortOrder = 99 } = req.body as {
    tenantId?: number;
    role: string;
    label: string;
    color?: string;
    permissions?: string[];
    sortOrder?: number;
  };

  if (!role || !label) {
    res.status(400).json({ error: "role und label sind Pflichtfelder." });
    return;
  }

  const roleKey = role.toUpperCase().replace(/\s+/g, "_");

  try {
    await pool.query(
      `INSERT INTO role_permission_defaults (tenant_id, role, label, color, is_custom, permissions, sort_order)
       VALUES ($1, $2, $3, $4, TRUE, $5, $6)`,
      [tenantId, roleKey, label, color, permissions, sortOrder]
    );
    res.json({ success: true, role: roleKey });
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "Diese Rolle existiert bereits." });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

router.delete("/permissions/roles/:role", async (req, res) => {
  const { role } = req.params;
  const tenantId = Number(req.query.tenantId) || 1;

  const existing = await pool.query(
    `SELECT is_custom FROM role_permission_defaults WHERE tenant_id = $1 AND role = $2`,
    [tenantId, role]
  );

  if (existing.rows.length === 0) {
    res.status(404).json({ error: "Rolle nicht gefunden." });
    return;
  }

  if (!existing.rows[0].is_custom) {
    res.status(403).json({ error: "Standard-Rollen können nicht gelöscht werden." });
    return;
  }

  await pool.query(
    `DELETE FROM role_permission_defaults WHERE tenant_id = $1 AND role = $2`,
    [tenantId, role]
  );
  res.json({ success: true });
});

router.post("/permissions/roles/:role/apply-to-users", async (req, res) => {
  const { role } = req.params;
  const { tenantId = 1 } = req.body as { tenantId?: number };

  const roleConfig = await pool.query(
    `SELECT permissions FROM role_permission_defaults WHERE tenant_id = $1 AND role = $2`,
    [tenantId, role]
  );

  if (roleConfig.rows.length === 0) {
    res.status(404).json({ error: "Rolle nicht gefunden." });
    return;
  }

  const permissions: string[] = roleConfig.rows[0].permissions || [];

  const usersWithRole = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, role));

  for (const u of usersWithRole) {
    await db.delete(userPermissionsTable).where(eq(userPermissionsTable.userId, u.id));
    if (permissions.length > 0) {
      await db.insert(userPermissionsTable).values(
        permissions.map(perm => ({
          userId: u.id,
          permissionType: perm,
          resourceType: "global",
          granted: true,
        }))
      );
    }
  }

  res.json({ success: true, usersUpdated: usersWithRole.length });
});

export default router;
