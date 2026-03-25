import { Router } from "express";
import { db } from "@workspace/db";
import { gqBegehungTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/gq-begehung", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const year = req.query.year ? Number(req.query.year) : null;
  const quartal = req.query.quartal ? Number(req.query.quartal) : null;

  let query = db.select().from(gqBegehungTable).$dynamic();

  const conditions = [eq(gqBegehungTable.tenantId, tenantId)];
  if (marketId) conditions.push(eq(gqBegehungTable.marketId, marketId));
  if (year) conditions.push(eq(gqBegehungTable.year, year));
  if (quartal) conditions.push(eq(gqBegehungTable.quartal, quartal));

  const results = await db.select().from(gqBegehungTable).where(and(...conditions));
  res.json(results);
});

router.post("/gq-begehung", async (req, res) => {
  const { tenantId = 1, marketId, quartal, year, durchgefuehrtAm, durchgefuehrtVon, kuerzel, checkData } = req.body;
  const result = await db
    .insert(gqBegehungTable)
    .values({ tenantId, marketId, quartal, year, durchgefuehrtAm, durchgefuehrtVon, kuerzel, checkData })
    .returning();
  res.json(result[0]);
});

router.put("/gq-begehung/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { durchgefuehrtAm, durchgefuehrtVon, kuerzel, checkData } = req.body;
  const result = await db
    .update(gqBegehungTable)
    .set({ durchgefuehrtAm, durchgefuehrtVon, kuerzel, checkData })
    .where(eq(gqBegehungTable.id, id))
    .returning();
  res.json(result[0]);
});

router.delete("/gq-begehung/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(gqBegehungTable).where(eq(gqBegehungTable.id, id));
  res.json({ success: true });
});

export default router;
