import { Router } from "express";
import { db } from "@workspace/db";
import { arzneimittelSachkundeTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/arzneimittel-sachkunde", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const rows = await db
    .select()
    .from(arzneimittelSachkundeTable)
    .where(eq(arzneimittelSachkundeTable.tenantId, tenantId))
    .orderBy(arzneimittelSachkundeTable.mitarbeiterName);
  res.json(rows);
});

router.post("/arzneimittel-sachkunde", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(arzneimittelSachkundeTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/arzneimittel-sachkunde/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(arzneimittelSachkundeTable)
    .set(req.body)
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
