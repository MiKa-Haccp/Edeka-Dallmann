import { Router } from "express";
import { db } from "@workspace/db";
import { probeentnahmeTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/probeentnahme", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const where = marketId
    ? and(eq(probeentnahmeTable.tenantId, tenantId), eq(probeentnahmeTable.marketId, marketId))
    : eq(probeentnahmeTable.tenantId, tenantId);
  const results = await db
    .select()
    .from(probeentnahmeTable)
    .where(where)
    .orderBy(probeentnahmeTable.createdAt);
  res.json(results);
});

router.get("/probeentnahme/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await db.select().from(probeentnahmeTable).where(eq(probeentnahmeTable.id, id));
  if (!result.length) return res.status(404).json({ error: "Nicht gefunden" });
  res.json(result[0]);
});

router.post("/probeentnahme", async (req, res) => {
  const { tenantId = 1, marketId = 1, ...fields } = req.body;
  const result = await db.insert(probeentnahmeTable).values({ tenantId, marketId, ...fields }).returning();
  res.json(result[0]);
});

router.put("/probeentnahme/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId, marketId, ...fields } = req.body;
  const result = await db
    .update(probeentnahmeTable)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(probeentnahmeTable.id, id))
    .returning();
  res.json(result[0]);
});

router.delete("/probeentnahme/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(probeentnahmeTable).where(eq(probeentnahmeTable.id, id));
  res.json({ success: true });
});

export default router;
