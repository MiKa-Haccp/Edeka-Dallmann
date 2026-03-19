import { Router } from "express";
import { db } from "@workspace/db";
import { schulungsnachweiseTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/schulungsnachweise", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const kategorie = req.query.kategorie as string | undefined;

  const query = db
    .select()
    .from(schulungsnachweiseTable)
    .where(
      kategorie
        ? and(eq(schulungsnachweiseTable.tenantId, tenantId), eq(schulungsnachweiseTable.kategorie, kategorie))
        : eq(schulungsnachweiseTable.tenantId, tenantId)
    )
    .orderBy(schulungsnachweiseTable.mitarbeiterName);

  res.json(await query);
});

router.post("/schulungsnachweise", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(schulungsnachweiseTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/schulungsnachweise/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(schulungsnachweiseTable)
    .set(req.body)
    .where(eq(schulungsnachweiseTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/schulungsnachweise/:id", async (req, res) => {
  await db
    .delete(schulungsnachweiseTable)
    .where(eq(schulungsnachweiseTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
