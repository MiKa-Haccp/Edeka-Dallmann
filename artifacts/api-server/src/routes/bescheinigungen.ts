import { Router } from "express";
import { db } from "@workspace/db";
import { bescheinigungenTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/bescheinigungen", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const kategorie = req.query.kategorie as string | undefined;

  let query = db
    .select()
    .from(bescheinigungenTable)
    .where(
      kategorie
        ? and(eq(bescheinigungenTable.tenantId, tenantId), eq(bescheinigungenTable.kategorie, kategorie))
        : eq(bescheinigungenTable.tenantId, tenantId)
    )
    .orderBy(bescheinigungenTable.mitarbeiterName);

  res.json(await query);
});

router.post("/bescheinigungen", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(bescheinigungenTable)
    .values({ tenantId, ...fields })
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
