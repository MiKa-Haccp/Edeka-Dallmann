import { Router } from "express";
import { db } from "@workspace/db";
import { bescheinigungenTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

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

router.post("/bescheinigungen", async (req, res) => {
  const { tenantId = 1, marketId, ...fields } = req.body;
  const row = await db
    .insert(bescheinigungenTable)
    .values({ tenantId, marketId: marketId || null, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/bescheinigungen/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(bescheinigungenTable)
    .set(req.body)
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
