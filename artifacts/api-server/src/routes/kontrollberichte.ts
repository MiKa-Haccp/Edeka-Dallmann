import { Router } from "express";
import { db } from "@workspace/db";
import { kontrollberichteTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { upload, attachFileAsBase64 } from "./uploadMiddleware";

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

router.post("/kontrollberichte", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const { tenantId, marketId, ...fields } = req.body as Record<string, string>;
  const row = await db
    .insert(kontrollberichteTable)
    .values({ tenantId: Number(tenantId) || 1, marketId: marketId ? Number(marketId) : null, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/kontrollberichte/:id", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId: _t, marketId: _m, ...fields } = req.body as Record<string, string>;
  const row = await db
    .update(kontrollberichteTable)
    .set(fields)
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
