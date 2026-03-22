import { Router, type IRouter } from "express";
import { db, metzReinigungTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

// GET – alle Einträge für eine Woche (datum von/bis)
router.get("/metz-reinigung", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const von      = req.query.von as string;
  const bis      = req.query.bis as string;
  if (!marketId || !von || !bis) {
    res.status(400).json({ error: "marketId, von, bis erforderlich" }); return;
  }
  const rows = await db.select().from(metzReinigungTable)
    .where(and(
      eq(metzReinigungTable.marketId, marketId),
      gte(metzReinigungTable.datum, von),
      lte(metzReinigungTable.datum, bis),
    ));
  res.json(rows);
});

// POST – Eintrag anlegen
router.post("/metz-reinigung", async (req, res) => {
  const { marketId, itemKey, datum, kuerzel, userId } = req.body;
  if (!marketId || !itemKey || !datum || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" }); return;
  }
  const today = new Date().toISOString().split("T")[0];
  if (datum > today) {
    res.status(400).json({ error: "Zukuenftige Eintraege nicht erlaubt" }); return;
  }
  const existing = await db.select().from(metzReinigungTable)
    .where(and(
      eq(metzReinigungTable.marketId, marketId),
      eq(metzReinigungTable.itemKey, itemKey),
      eq(metzReinigungTable.datum, datum),
    ));
  if (existing.length > 0) {
    res.status(409).json({ error: "Bereits abgezeichnet" }); return;
  }
  const [row] = await db.insert(metzReinigungTable)
    .values({ marketId, itemKey, datum, kuerzel, userId: userId || null })
    .returning();
  res.status(201).json(row);
});

// DELETE – Eintrag entfernen (Admin)
router.delete("/metz-reinigung/:id", async (req, res) => {
  await db.delete(metzReinigungTable).where(eq(metzReinigungTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
