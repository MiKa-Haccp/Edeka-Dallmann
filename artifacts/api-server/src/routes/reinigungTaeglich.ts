import { Router, type IRouter } from "express";
import { db, reinigungTaeglichTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reinigung-taeglich", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year     = Number(req.query.year);
  const month    = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(reinigungTaeglichTable)
    .where(
      and(
        eq(reinigungTaeglichTable.marketId, marketId),
        eq(reinigungTaeglichTable.year, year),
        eq(reinigungTaeglichTable.month, month)
      )
    );
  res.json(rows);
});

router.post("/reinigung-taeglich", async (req, res) => {
  const { tenantId = 1, marketId, year, month, day, area, kuerzel, userId } = req.body;
  if (!marketId || !year || !month || !day || !area || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }

  const now     = new Date();
  const entryDate = new Date(year, month - 1, day);
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (entryDate > today) {
    res.status(400).json({ error: "Eintragungen fuer zukuenftige Tage sind nicht erlaubt" });
    return;
  }

  const existing = await db
    .select()
    .from(reinigungTaeglichTable)
    .where(
      and(
        eq(reinigungTaeglichTable.marketId, marketId),
        eq(reinigungTaeglichTable.year, year),
        eq(reinigungTaeglichTable.month, month),
        eq(reinigungTaeglichTable.day, day),
        eq(reinigungTaeglichTable.area, area)
      )
    );
  if (existing.length > 0) {
    res.status(409).json({ error: "Dieser Bereich wurde heute bereits abgezeichnet" });
    return;
  }

  const [row] = await db
    .insert(reinigungTaeglichTable)
    .values({ tenantId, marketId, year, month, day, area, kuerzel, userId })
    .returning();
  res.json(row);
});

router.delete("/reinigung-taeglich/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(reinigungTaeglichTable).where(eq(reinigungTaeglichTable.id, id));
  res.json({ ok: true });
});

export default router;
