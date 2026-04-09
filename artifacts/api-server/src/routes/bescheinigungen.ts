import { Router } from "express";
import { db } from "@workspace/db";
import { bescheinigungenTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { upload, attachFileAsBase64 } from "./uploadMiddleware";

const router = Router();

router.get("/bescheinigungen", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const kategorie = req.query.kategorie as string | undefined;

  const conditions = [eq(bescheinigungenTable.tenantId, tenantId)];
  if (marketId) conditions.push(eq(bescheinigungenTable.marketId, marketId));
  if (kategorie) conditions.push(eq(bescheinigungenTable.kategorie, kategorie));

  const query = db
    .select()
    .from(bescheinigungenTable)
    .where(and(...conditions))
    .orderBy(bescheinigungenTable.mitarbeiterName);

  res.json(await query);
});

router.post("/bescheinigungen", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const { tenantId, marketId, ...fields } = req.body as Record<string, string>;
  const row = await db
    .insert(bescheinigungenTable)
    .values({ tenantId: Number(tenantId) || 1, marketId: marketId ? Number(marketId) : null, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/bescheinigungen/:id", upload.single("dokument"), attachFileAsBase64("dokumentBase64"), async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId: _t, marketId: _m, ...fields } = req.body as Record<string, string>;
  const row = await db
    .update(bescheinigungenTable)
    .set(fields)
    .where(eq(bescheinigungenTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/bescheinigungen/:id", async (req, res) => {
  await db
    .delete(bescheinigungenTable)
    .where(eq(bescheinigungenTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
