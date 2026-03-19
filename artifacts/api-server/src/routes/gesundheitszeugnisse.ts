import { Router } from "express";
import { db } from "@workspace/db";
import { gesundheitszeugnisseTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/gesundheitszeugnisse", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const rows = await db
    .select()
    .from(gesundheitszeugnisseTable)
    .where(eq(gesundheitszeugnisseTable.tenantId, tenantId))
    .orderBy(gesundheitszeugnisseTable.mitarbeiterName);
  res.json(rows);
});

router.post("/gesundheitszeugnisse", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(gesundheitszeugnisseTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/gesundheitszeugnisse/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(gesundheitszeugnisseTable)
    .set(req.body)
    .where(eq(gesundheitszeugnisseTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/gesundheitszeugnisse/:id", async (req, res) => {
  await db
    .delete(gesundheitszeugnisseTable)
    .where(eq(gesundheitszeugnisseTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
