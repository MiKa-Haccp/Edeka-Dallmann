import { Router } from "express";
import { db } from "@workspace/db";
import { betriebsbegehungTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/betriebsbegehung", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const results = await db
    .select()
    .from(betriebsbegehungTable)
    .where(eq(betriebsbegehungTable.tenantId, tenantId));
  res.json(results);
});

router.get("/betriebsbegehung/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await db
    .select()
    .from(betriebsbegehungTable)
    .where(eq(betriebsbegehungTable.id, id));
  if (!result.length) return res.status(404).json({ error: "Nicht gefunden" });
  res.json(result[0]);
});

router.post("/betriebsbegehung", async (req, res) => {
  const { tenantId = 1, quartal, year, durchgefuehrtAm, durchgefuehrtVon, sectionData, aktionsplan } = req.body;
  const result = await db
    .insert(betriebsbegehungTable)
    .values({ tenantId, quartal, year, durchgefuehrtAm, durchgefuehrtVon, sectionData, aktionsplan })
    .returning();
  res.json(result[0]);
});

router.put("/betriebsbegehung/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { quartal, year, durchgefuehrtAm, durchgefuehrtVon, sectionData, aktionsplan } = req.body;
  const result = await db
    .update(betriebsbegehungTable)
    .set({ quartal, year, durchgefuehrtAm, durchgefuehrtVon, sectionData, aktionsplan })
    .where(eq(betriebsbegehungTable.id, id))
    .returning();
  res.json(result[0]);
});

router.delete("/betriebsbegehung/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(betriebsbegehungTable).where(eq(betriebsbegehungTable.id, id));
  res.json({ success: true });
});

export default router;
