import { Router, type IRouter } from "express";
import { db, warenzustandOGTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/warencheck-og", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(warenzustandOGTable)
    .where(
      and(
        eq(warenzustandOGTable.marketId, marketId),
        eq(warenzustandOGTable.year, year),
        eq(warenzustandOGTable.month, month)
      )
    );
  res.json(rows);
});

router.post("/warencheck-og", async (req, res) => {
  const { tenantId = 1, marketId, year, month, day, slot, kuerzel, userId } = req.body;
  if (!marketId || !year || !month || !day || !slot || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }
  const existing = await db
    .select()
    .from(warenzustandOGTable)
    .where(
      and(
        eq(warenzustandOGTable.marketId, marketId),
        eq(warenzustandOGTable.year, year),
        eq(warenzustandOGTable.month, month),
        eq(warenzustandOGTable.day, day),
        eq(warenzustandOGTable.slot, slot)
      )
    );
  if (existing.length > 0) {
    res.status(409).json({ error: "Dieser Zeitslot wurde bereits abgezeichnet" });
    return;
  }
  const [row] = await db
    .insert(warenzustandOGTable)
    .values({ tenantId, marketId, year, month, day, slot, kuerzel, userId })
    .returning();
  res.json(row);
});

router.delete("/warencheck-og/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(warenzustandOGTable).where(eq(warenzustandOGTable.id, id));
  res.json({ ok: true });
});

export default router;
