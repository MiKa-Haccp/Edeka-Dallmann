import { Router } from "express";
import { db } from "@workspace/db";
import { arzneimittelSachkundeTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { upload, attachFileAsBase64 } from "./uploadMiddleware";

const router = Router();

router.get("/arzneimittel-sachkunde", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const where = marketId
    ? and(eq(arzneimittelSachkundeTable.tenantId, tenantId), eq(arzneimittelSachkundeTable.marketId, marketId))
    : eq(arzneimittelSachkundeTable.tenantId, tenantId);
  const rows = await db
    .select()
    .from(arzneimittelSachkundeTable)
    .where(where)
    .orderBy(arzneimittelSachkundeTable.mitarbeiterName);
  res.json(rows);
});

router.post("/arzneimittel-sachkunde", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const { tenantId, marketId, ...fields } = req.body as Record<string, string>;
  const row = await db
    .insert(arzneimittelSachkundeTable)
    .values({ tenantId: Number(tenantId) || 1, marketId: Number(marketId) || 1, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/arzneimittel-sachkunde/:id", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId: _t, marketId: _m, ...fields } = req.body as Record<string, string>;
  const row = await db
    .update(arzneimittelSachkundeTable)
    .set(fields)
    .where(eq(arzneimittelSachkundeTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/arzneimittel-sachkunde/:id", async (req, res) => {
  await db
    .delete(arzneimittelSachkundeTable)
    .where(eq(arzneimittelSachkundeTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
