import { Router, type IRouter } from "express";
import { db, mhdKontrolleTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /mhd-kontrolle?marketId=&datum=YYYY-MM-DD
router.get("/mhd-kontrolle", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const datum = req.query.datum as string | undefined;
  if (!marketId) {
    res.status(400).json({ error: "marketId required" });
    return;
  }
  const conditions = [eq(mhdKontrolleTable.marketId, marketId)];
  if (datum) conditions.push(eq(mhdKontrolleTable.datum, datum));
  const rows = await db
    .select()
    .from(mhdKontrolleTable)
    .where(and(...conditions))
    .orderBy(desc(mhdKontrolleTable.createdAt));
  res.json(rows);
});

// POST /mhd-kontrolle
router.post("/mhd-kontrolle", async (req, res) => {
  const { marketId, datum, bereich, artikel, mhdDatum, menge = 1, aktion = "geprueft", bemerkung, kuerzel } = req.body;
  if (!marketId || !datum || !artikel || !mhdDatum || !aktion) {
    res.status(400).json({ error: "Pflichtfelder: marketId, datum, artikel, mhdDatum, aktion" });
    return;
  }
  const [row] = await db
    .insert(mhdKontrolleTable)
    .values({ marketId, datum, bereich: bereich || null, artikel, mhdDatum, menge: Number(menge), aktion, bemerkung: bemerkung || null, kuerzel: kuerzel || null })
    .returning();
  res.status(201).json(row);
});

// DELETE /mhd-kontrolle/:id
router.delete("/mhd-kontrolle/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(mhdKontrolleTable).where(eq(mhdKontrolleTable.id, id));
  res.json({ ok: true });
});

export default router;
