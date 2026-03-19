import { Router } from "express";
import { db } from "@workspace/db";
import { kontrollberichteTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/kontrollberichte", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const kategorie = req.query.kategorie as string | undefined;

  const rows = await db
    .select()
    .from(kontrollberichteTable)
    .where(
      kategorie
        ? and(eq(kontrollberichteTable.tenantId, tenantId), eq(kontrollberichteTable.kategorie, kategorie))
        : eq(kontrollberichteTable.tenantId, tenantId)
    )
    .orderBy(kontrollberichteTable.kontrollDatum);

  res.json(rows);
});

router.post("/kontrollberichte", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(kontrollberichteTable)
    .values({ tenantId, ...fields })
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
