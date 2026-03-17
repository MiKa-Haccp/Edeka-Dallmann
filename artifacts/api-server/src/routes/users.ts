import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import {
  ResetUserCredentialsParams,
  ResetUserCredentialsBody,
} from "@workspace/api-zod";
import { eq, and, ilike } from "drizzle-orm";

const router: IRouter = Router();

function stripSensitive(user: any) {
  const { pin, ...safe } = user;
  return safe;
}

router.get("/users", async (req, res) => {
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : undefined;
  let result;
  if (tenantId && !isNaN(tenantId)) {
    result = await db.select().from(usersTable).where(eq(usersTable.tenantId, tenantId));
  } else {
    result = await db.select().from(usersTable);
  }
  res.json(result.map(stripSensitive));
});

function generateInitialsSuggestions(firstName: string, lastName: string): string[] {
  const f = firstName.trim().toUpperCase();
  const l = lastName.trim().toUpperCase();
  const suggestions: string[] = [];

  if (f.length >= 1 && l.length >= 1) {
    suggestions.push(f[0] + l[0]);
    if (l.length >= 2) suggestions.push(f[0] + l.substring(0, 2));
    if (f.length >= 2) suggestions.push(f.substring(0, 2) + l[0]);
    if (f.length >= 1 && l.length >= 2) suggestions.push(f[0] + l[l.length - 1] + l[0]);
    if (f.length >= 2 && l.length >= 1) suggestions.push(f[0] + f[1] + l[0]);
    if (l.length >= 3) suggestions.push(l.substring(0, 3));
    if (f.length >= 3) suggestions.push(f.substring(0, 3));
    if (f.length >= 1 && l.length >= 1) suggestions.push(f[0] + l[0] + "1");
    if (f.length >= 1 && l.length >= 1) suggestions.push(f[0] + l[0] + "2");
  }

  const unique: string[] = [];
  for (const s of suggestions) {
    const trimmed = s.substring(0, 3);
    if (!unique.includes(trimmed)) unique.push(trimmed);
  }
  return unique;
}

router.post("/users/suggest-initials", async (req, res) => {
  const body = req.body as { firstName: string; lastName: string; tenantId: number };

  const existingUsers = await db
    .select({ initials: usersTable.initials })
    .from(usersTable)
    .where(eq(usersTable.tenantId, body.tenantId));

  const takenInitials = new Set(
    existingUsers.map((u) => u.initials?.toUpperCase()).filter(Boolean)
  );

  const candidates = generateInitialsSuggestions(body.firstName, body.lastName);
  const available = candidates.filter((c) => !takenInitials.has(c.toUpperCase()));

  const suggestion = available.length > 0 ? available[0] : candidates[0] + Math.floor(Math.random() * 10);
  const alternatives = available.slice(1, 4);

  res.json({ suggestion, alternatives });
});

router.post("/users/register", async (req, res) => {
  const body = req.body as { tenantId: number; firstName: string; lastName: string; birthDate: string; initials: string; pin: string };

  if (!body.initials || body.initials.length < 2 || body.initials.length > 3) {
    res.status(400).json({ error: "Kürzel muss 2-3 Buchstaben lang sein." });
    return;
  }

  if (!body.pin || body.pin.length !== 4 || !/^\d{4}$/.test(body.pin)) {
    res.status(400).json({ error: "PIN muss genau 4 Ziffern enthalten." });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, body.tenantId),
        ilike(usersTable.initials, body.initials)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: `Kürzel "${body.initials.toUpperCase()}" ist bereits vergeben.` });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      tenantId: body.tenantId,
      firstName: body.firstName,
      lastName: body.lastName,
      name: `${body.firstName} ${body.lastName}`,
      birthDate: body.birthDate,
      initials: body.initials.toUpperCase(),
      pin: body.pin,
      role: "USER",
      isRegistered: true,
    })
    .returning();

  res.status(201).json(stripSensitive(user));
});

router.post("/users/verify-pin", async (req, res) => {
  const body = req.body as { initials: string; pin: string; tenantId: number };

  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, body.tenantId),
        ilike(usersTable.initials, body.initials)
      )
    );

  if (users.length === 0 || users[0].pin !== body.pin) {
    res.json({ valid: false, userId: null, userName: null });
    return;
  }

  res.json({ valid: true, userId: users[0].id, userName: users[0].name });
});

router.put("/users/:userId/reset", async (req, res) => {
  const params = ResetUserCredentialsParams.parse(req.params);
  const body = ResetUserCredentialsBody.parse(req.body);

  if (!body.initials || body.initials.length < 2 || body.initials.length > 3) {
    res.status(400).json({ error: "Kürzel muss 2-3 Buchstaben lang sein." });
    return;
  }

  if (!body.pin || body.pin.length !== 4 || !/^\d{4}$/.test(body.pin)) {
    res.status(400).json({ error: "PIN muss genau 4 Ziffern enthalten." });
    return;
  }

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.userId));

  if (existingUser.length === 0) {
    res.status(404).json({ error: "Benutzer nicht gefunden." });
    return;
  }

  const conflicting = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, existingUser[0].tenantId),
        ilike(usersTable.initials, body.initials)
      )
    );

  if (conflicting.length > 0 && conflicting[0].id !== params.userId) {
    res.status(409).json({ error: `Kürzel "${body.initials.toUpperCase()}" ist bereits vergeben.` });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      initials: body.initials.toUpperCase(),
      pin: body.pin,
    })
    .where(eq(usersTable.id, params.userId))
    .returning();

  res.json(stripSensitive(updated));
});

export default router;
