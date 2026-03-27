import { Router } from "express";
import { db } from "@workspace/db";
import { kontrollberichteTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/kontrollberichte", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const kategorie = req.query.kategorie as string | undefined;

  const conditions = [eq(kontrollberichteTable.tenantId, tenantId)];
  if (marketId) conditions.push(eq(kontrollberichteTable.marketId, marketId));
  if (kategorie) conditions.push(eq(kontrollberichteTable.kategorie, kategorie));

  const rows = await db
    .select()
    .from(kontrollberichteTable)
    .where(and(...conditions))
    .orderBy(kontrollberichteTable.kontrollDatum);

  res.json(rows);
});

router.post("/kontrollberichte", async (req, res) => {
  const { tenantId = 1, marketId, ...fields } = req.body;
  const row = await db
    .insert(kontrollberichteTable)
    .values({ tenantId, marketId: marketId || null, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/kontrollberichte/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(kontrollberichteTable)
    .set(req.body)
    .where(eq(kontrollberichteTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/kontrollberichte/:id", async (req, res) => {
  await db
    .delete(kontrollberichteTable)
    .where(eq(kontrollberichteTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
