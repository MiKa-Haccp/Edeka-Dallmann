import { Router } from "express";
import { db } from "@workspace/db";
import { besprechungsdokumenteTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/besprechungsdokumente", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const kategorie = req.query.kategorie as string | undefined;

  const query = db
    .select()
    .from(besprechungsdokumenteTable)
    .where(
      kategorie
        ? and(eq(besprechungsdokumenteTable.tenantId, tenantId), eq(besprechungsdokumenteTable.kategorie, kategorie))
        : eq(besprechungsdokumenteTable.tenantId, tenantId)
    )
    .orderBy(besprechungsdokumenteTable.datum);

  res.json(await query);
});

router.post("/besprechungsdokumente", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(besprechungsdokumenteTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/besprechungsdokumente/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(besprechungsdokumenteTable)
    .set(req.body)
    .where(eq(besprechungsdokumenteTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/besprechungsdokumente/:id", async (req, res) => {
  await db
    .delete(besprechungsdokumenteTable)
    .where(eq(besprechungsdokumenteTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
