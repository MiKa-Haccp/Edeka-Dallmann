import { Router, type IRouter } from "express";
import { db, cleaningPlanConfirmationsTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/cleaning-plan", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  const confirmations = await db
    .select()
    .from(cleaningPlanConfirmationsTable)
    .where(
      and(
        eq(cleaningPlanConfirmationsTable.tenantId, tenantId),
        eq(cleaningPlanConfirmationsTable.year, year)
      )
    );

  res.json(confirmations);
});

router.post("/cleaning-plan/confirm", async (req, res) => {
  const { tenantId, itemKey, year, month, pin } = req.body as {
    tenantId: number;
    itemKey: string;
    year: number;
    month: number;
    pin: string;
  };

  if (!itemKey || !year || !month || !pin) {
    res.status(400).json({ error: "Fehlende Pflichtfelder." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.tenantId, tenantId),
        eq(usersTable.pin, pin)
      )
    );

  if (!user) {
    res.status(401).json({ error: "Ungültige PIN. Kein Mitarbeiter gefunden." });
    return;
  }

  const existing = await db
    .select()
    .from(cleaningPlanConfirmationsTable)
    .where(
      and(
        eq(cleaningPlanConfirmationsTable.tenantId, tenantId),
        eq(cleaningPlanConfirmationsTable.itemKey, itemKey),
        eq(cleaningPlanConfirmationsTable.year, year),
        eq(cleaningPlanConfirmationsTable.month, month)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Dieser Monat wurde bereits bestätigt." });
    return;
  }

  const [confirmation] = await db
    .insert(cleaningPlanConfirmationsTable)
    .values({
      tenantId,
      itemKey,
      year,
      month,
      initials: user.initials?.toUpperCase() || "",
      userId: user.id,
    })
    .returning();

  res.status(201).json({ ...confirmation, userName: user.name });
});

router.delete("/cleaning-plan/confirm/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db
    .delete(cleaningPlanConfirmationsTable)
    .where(eq(cleaningPlanConfirmationsTable.id, id));
  res.status(204).send();
});

export default router;
