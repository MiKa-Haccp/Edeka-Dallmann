import { Router, type IRouter } from "express";
import { db, usersTable, adminInvitationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes, scryptSync } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const test = scryptSync(password, salt, 64).toString("hex");
  return hash === test;
}

function stripSensitive(user: any) {
  const { pin, password, ...safe } = user;
  return safe;
}

router.post("/admin/invite", async (req, res) => {
  const { email, tenantId, adminEmail } = req.body as {
    email: string;
    tenantId: number;
    adminEmail: string;
  };

  if (!email || !tenantId) {
    res.status(400).json({ error: "E-Mail und Tenant sind erforderlich." });
    return;
  }

  if (!adminEmail) {
    res.status(401).json({ error: "Admin-Authentifizierung erforderlich." });
    return;
  }

  const requestingAdmin = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.email, adminEmail.toLowerCase()),
        eq(usersTable.tenantId, tenantId)
      )
    );

  const admin = requestingAdmin.find(
    (a) => a.role === "ADMIN" || a.role === "SUPERADMIN"
  );

  if (!admin) {
    res.status(403).json({ error: "Nur Administratoren können Einladungen erstellen." });
    return;
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(adminInvitationsTable).values({
    tenantId,
    email,
    token,
    expiresAt,
  });

  res.json({
    success: true,
    token,
    inviteUrl: `/admin/register?token=${token}`,
    message: `Einladung für ${email} erstellt. Der Link ist 7 Tage gültig.`,
  });
});

router.get("/admin/invite/:token", async (req, res) => {
  const { token } = req.params;

  const invites = await db
    .select()
    .from(adminInvitationsTable)
    .where(eq(adminInvitationsTable.token, token));

  if (invites.length === 0) {
    res.status(404).json({ error: "Einladung nicht gefunden." });
    return;
  }

  const invite = invites[0];

  if (invite.used) {
    res.status(400).json({ error: "Diese Einladung wurde bereits verwendet." });
    return;
  }

  if (new Date() > invite.expiresAt) {
    res.status(400).json({ error: "Diese Einladung ist abgelaufen." });
    return;
  }

  res.json({ valid: true, email: invite.email, tenantId: invite.tenantId });
});

router.post("/admin/register", async (req, res) => {
  const { token, firstName, lastName, email, password } = req.body as {
    token: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };

  if (!token || !firstName || !lastName || !email || !password) {
    res.status(400).json({ error: "Alle Felder sind erforderlich." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen lang sein." });
    return;
  }

  const invites = await db
    .select()
    .from(adminInvitationsTable)
    .where(eq(adminInvitationsTable.token, token));

  if (invites.length === 0) {
    res.status(404).json({ error: "Einladung nicht gefunden." });
    return;
  }

  const invite = invites[0];

  if (invite.used) {
    res.status(400).json({ error: "Diese Einladung wurde bereits verwendet." });
    return;
  }

  if (new Date() > invite.expiresAt) {
    res.status(400).json({ error: "Diese Einladung ist abgelaufen." });
    return;
  }

  if (email.toLowerCase() !== invite.email.toLowerCase()) {
    res.status(400).json({ error: "E-Mail stimmt nicht mit der Einladung überein." });
    return;
  }

  const existingByEmail = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (existingByEmail.length > 0) {
    res.status(409).json({ error: "Ein Benutzer mit dieser E-Mail existiert bereits." });
    return;
  }

  const hashedPassword = hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      tenantId: invite.tenantId,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "ADMIN",
      isRegistered: true,
    })
    .returning();

  await db
    .update(adminInvitationsTable)
    .set({ used: true })
    .where(eq(adminInvitationsTable.id, invite.id));

  res.status(201).json(stripSensitive(user));
});

router.post("/admin/login", async (req, res) => {
  const { email, password, tenantId } = req.body as {
    email: string;
    password: string;
    tenantId: number;
  };

  if (!email || !password) {
    res.status(400).json({ error: "E-Mail und Passwort sind erforderlich." });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  const user = users.find(
    (u) =>
      (u.role === "ADMIN" || u.role === "SUPERADMIN") &&
      u.password &&
      verifyPassword(password, u.password)
  );

  if (!user) {
    res.status(401).json({ error: "Ungültige E-Mail oder Passwort." });
    return;
  }

  res.json({
    success: true,
    user: stripSensitive(user),
  });
});

router.get("/admin/list-invitations", async (req, res) => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : undefined;
  if (!tenantId) {
    res.status(400).json({ error: "tenantId ist erforderlich." });
    return;
  }
  const invites = await db
    .select()
    .from(adminInvitationsTable)
    .where(eq(adminInvitationsTable.tenantId, tenantId));
  res.json(invites);
});

export default router;
