import { Router } from "express";
import { db } from "@workspace/db";
import { produktfehlermeldungTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/produktfehlermeldung", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const conditions = [eq(produktfehlermeldungTable.tenantId, tenantId)];
  if (marketId) conditions.push(eq(produktfehlermeldungTable.marketId, marketId));
  const results = await db
    .select()
    .from(produktfehlermeldungTable)
    .where(and(...conditions))
    .orderBy(produktfehlermeldungTable.createdAt);
  res.json(results);
});

router.get("/produktfehlermeldung/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await db
    .select()
    .from(produktfehlermeldungTable)
    .where(eq(produktfehlermeldungTable.id, id));
  if (!result.length) return res.status(404).json({ error: "Nicht gefunden" });
  res.json(result[0]);
});

router.post("/produktfehlermeldung", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const result = await db
    .insert(produktfehlermeldungTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(result[0]);
});

router.put("/produktfehlermeldung/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId, ...fields } = req.body;
  const result = await db
    .update(produktfehlermeldungTable)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(produktfehlermeldungTable.id, id))
    .returning();
  res.json(result[0]);
});

router.delete("/produktfehlermeldung/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(produktfehlermeldungTable).where(eq(produktfehlermeldungTable.id, id));
  res.json({ success: true });
});

export default router;
