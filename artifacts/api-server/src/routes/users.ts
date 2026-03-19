import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import {
  ResetUserCredentialsParams,
  ResetUserCredentialsBody,
} from "@workspace/api-zod";
import { eq, and, ilike } from "drizzle-orm";

const router: IRouter = Router();

function stripSensitive(user: any) {
  const { pin, password, ...safe } = user;
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

  const existingPin = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, body.tenantId),
        eq(usersTable.pin, body.pin)
      )
    );

  if (existingPin.length > 0) {
    res.status(409).json({ error: "Diese PIN ist bereits vergeben. Bitte wählen Sie eine andere 4-stellige PIN." });
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
  const body = req.body as { initials?: string; pin: string; tenantId: number };

  let users;
  if (body.initials) {
    users = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.tenantId, body.tenantId),
          ilike(usersTable.initials, body.initials)
        )
      );
    if (users.length === 0 || users[0].pin !== body.pin) {
      res.json({ valid: false, userId: null, userName: null, initials: null });
      return;
    }
  } else {
    users = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.tenantId, body.tenantId),
          eq(usersTable.pin, body.pin)
        )
      );
    if (users.length === 0) {
      res.json({ valid: false, userId: null, userName: null, initials: null });
      return;
    }
    if (users.length > 1) {
      res.status(409).json({ error: "PIN ist mehrfach vergeben. Bitte Admin kontaktieren." });
      return;
    }
  }

  const user = users[0];
  if (user.status === "inaktiv") {
    res.json({ valid: false, userId: null, userName: null, initials: null, reason: "inaktiv" });
    return;
  }

  res.json({ valid: true, userId: user.id, userName: user.name, initials: user.initials, status: user.status });
});

router.put("/users/:userId/status", async (req, res) => {
  const userId = Number(req.params.userId);
  const { status } = req.body as { status: string };
  const allowed = ["onboarding", "aktiv", "inaktiv"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "Ungültiger Status." });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ status })
    .where(eq(usersTable.id, userId))
    .returning();
  res.json(stripSensitive(updated));
});

router.put("/users/:userId/role", async (req, res) => {
  const userId = Number(req.params.userId);
  const { role } = req.body as { role: string };
  const allowed = ["SUPERADMIN", "ADMIN", "BEREICHSLEITUNG", "MARKTLEITER", "USER"];
  if (!allowed.includes(role)) {
    res.status(400).json({ error: "Ungültige Rolle." });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, userId))
    .returning();
  res.json(stripSensitive(updated));
});

// Returns {userId: boolean} map indicating which users have a PIN set
router.get("/users/pin-status", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const users = await db
    .select({ id: usersTable.id, pin: usersTable.pin })
    .from(usersTable)
    .where(eq(usersTable.tenantId, tenantId));
  const result: Record<number, boolean> = {};
  for (const u of users) result[u.id] = !!u.pin;
  res.json(result);
});

// Admin creates employee directly (PIN optional, initials auto-suggested if not provided)
router.post("/users/admin-create", async (req, res) => {
  const body = req.body as {
    tenantId: number;
    firstName: string;
    lastName: string;
    birthDate?: string;
    initials?: string;
    pin?: string;
    status?: string;
  };

  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    res.status(400).json({ error: "Vor- und Nachname sind erforderlich." });
    return;
  }

  // Auto-generate initials if not provided
  let initials = (body.initials || "").toUpperCase().trim();
  if (!initials) {
    const suggestions = generateInitialsSuggestions(body.firstName, body.lastName);
    const existing = await db.select({ initials: usersTable.initials }).from(usersTable).where(eq(usersTable.tenantId, body.tenantId));
    const taken = new Set(existing.map((u) => u.initials?.toUpperCase()).filter(Boolean));
    initials = suggestions.find((s) => !taken.has(s.toUpperCase())) || suggestions[0] + Math.floor(Math.random() * 10);
  } else {
    if (initials.length < 2 || initials.length > 3) {
      res.status(400).json({ error: "Kürzel muss 2-3 Buchstaben lang sein." });
      return;
    }
    const conflict = await db.select().from(usersTable).where(and(eq(usersTable.tenantId, body.tenantId), ilike(usersTable.initials, initials)));
    if (conflict.length > 0) {
      res.status(409).json({ error: `Kürzel "${initials}" ist bereits vergeben.` });
      return;
    }
  }

  if (body.pin) {
    if (!/^\d{4}$/.test(body.pin)) {
      res.status(400).json({ error: "PIN muss genau 4 Ziffern enthalten." });
      return;
    }
    const pinConflict = await db.select().from(usersTable).where(and(eq(usersTable.tenantId, body.tenantId), eq(usersTable.pin, body.pin)));
    if (pinConflict.length > 0) {
      res.status(409).json({ error: "Diese PIN ist bereits vergeben." });
      return;
    }
  }

  const [user] = await db.insert(usersTable).values({
    tenantId: body.tenantId,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    name: `${body.firstName.trim()} ${body.lastName.trim()}`,
    birthDate: body.birthDate || null,
    initials,
    pin: body.pin || null,
    role: "USER",
    status: body.status || "aktiv",
    isRegistered: true,
  }).returning();

  res.status(201).json(stripSensitive(user));
});

// Admin updates basic employee info
router.put("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const body = req.body as { firstName?: string; lastName?: string; birthDate?: string; status?: string; initials?: string };

  const updates: Record<string, any> = {};
  if (body.firstName) { updates.firstName = body.firstName.trim(); updates.name = `${body.firstName.trim()} ${body.lastName || ""}`; }
  if (body.lastName) { updates.lastName = body.lastName.trim(); }
  if (body.firstName && body.lastName) { updates.name = `${body.firstName.trim()} ${body.lastName.trim()}`; }
  if (body.birthDate !== undefined) updates.birthDate = body.birthDate || null;
  if (body.status) updates.status = body.status;

  if (body.initials) {
    const init = body.initials.toUpperCase().trim();
    if (init.length < 2 || init.length > 3) {
      res.status(400).json({ error: "Kürzel muss 2-3 Buchstaben lang sein." });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (existing.length === 0) { res.status(404).json({ error: "Benutzer nicht gefunden." }); return; }
    const conflict = await db.select().from(usersTable).where(and(eq(usersTable.tenantId, existing[0].tenantId), ilike(usersTable.initials, init)));
    if (conflict.length > 0 && conflict[0].id !== userId) {
      res.status(409).json({ error: `Kürzel "${init}" ist bereits vergeben.` });
      return;
    }
    updates.initials = init;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "Benutzer nicht gefunden." }); return; }
  res.json(stripSensitive(updated));
});

// Admin sets/changes PIN
router.put("/users/:userId/pin", async (req, res) => {
  const userId = Number(req.params.userId);
  const { pin } = req.body as { pin: string };

  if (!pin || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: "PIN muss genau 4 Ziffern enthalten." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (existing.length === 0) { res.status(404).json({ error: "Benutzer nicht gefunden." }); return; }

  const conflict = await db.select().from(usersTable).where(and(eq(usersTable.tenantId, existing[0].tenantId), eq(usersTable.pin, pin)));
  if (conflict.length > 0 && conflict[0].id !== userId) {
    res.status(409).json({ error: "Diese PIN ist bereits vergeben." });
    return;
  }

  const [updated] = await db.update(usersTable).set({ pin }).where(eq(usersTable.id, userId)).returning();
  res.json(stripSensitive(updated));
});

// Admin deletes employee (hard delete - use only for test data; for real employees use status=inaktiv)
router.delete("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
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

  const conflictingPin = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, existingUser[0].tenantId),
        eq(usersTable.pin, body.pin)
      )
    );

  if (conflictingPin.length > 0 && conflictingPin[0].id !== params.userId) {
    res.status(409).json({ error: "Diese PIN ist bereits vergeben. Bitte wählen Sie eine andere 4-stellige PIN." });
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
