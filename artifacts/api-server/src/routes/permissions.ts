import { Router, type IRouter } from "express";
import { db, usersTable, userPermissionsTable, userMarketAssignmentsTable, marketsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router: IRouter = Router();

const VALID_ROLES = ["SUPERADMIN", "ADMIN", "MARKTLEITER", "USER"] as const;

const PERMISSION_AREAS = [
  { key: "users.view", label: "Mitarbeiterliste einsehen", group: "Benutzerverwaltung" },
  { key: "users.manage", label: "Mitarbeiter verwalten (Kürzel/PIN)", group: "Benutzerverwaltung" },
  { key: "users.invite_admin", label: "Admins einladen", group: "Benutzerverwaltung" },
  { key: "entries.create", label: "HACCP-Einträge erstellen", group: "HACCP Einträge" },
  { key: "entries.view_all", label: "Alle Einträge einsehen", group: "HACCP Einträge" },
  { key: "entries.edit", label: "Einträge bearbeiten", group: "HACCP Einträge" },
  { key: "entries.delete", label: "Einträge löschen", group: "HACCP Einträge" },
  { key: "reports.view", label: "Berichte einsehen", group: "Berichte" },
  { key: "reports.export", label: "Berichte exportieren", group: "Berichte" },
  { key: "settings.manage", label: "Systemeinstellungen verwalten", group: "System" },
] as const;

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SUPERADMIN: PERMISSION_AREAS.map(p => p.key),
  ADMIN: [
    "users.view", "users.manage", "users.invite_admin",
    "entries.create", "entries.view_all", "entries.edit", "entries.delete",
    "reports.view", "reports.export",
  ],
  MARKTLEITER: [
    "users.view",
    "entries.create", "entries.view_all", "entries.edit",
    "reports.view",
  ],
  USER: [
    "entries.create",
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
      marketIds.map(marketId => ({
        userId,
        marketId,
      }))
    );
  }

  res.json({ success: true });
});

router.put("/permissions/user/:userId/role", async (req, res) => {
  const userId = Number(req.params.userId);
  const { role } = req.body as { role: string };

  if (!VALID_ROLES.includes(role as any)) {
    res.status(400).json({ error: `Ungültige Rolle. Erlaubt: ${VALID_ROLES.join(", ")}` });
    return;
  }

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

  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
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

export default router;
