import { Router, type IRouter } from "express";
import { db, wareneingangOGTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/wareneingang-og", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(wareneingangOGTable)
    .where(
      and(
        eq(wareneingangOGTable.marketId, marketId),
        eq(wareneingangOGTable.year, year),
        eq(wareneingangOGTable.month, month)
      )
    );
  res.json(rows);
});

router.post("/wareneingang-og", async (req, res) => {
  const {
    tenantId = 1, marketId, year, month, day,
    hygiene, etikettierung, qualitaet, mhd, kistenetikett,
    qsBiosiegel, qsBy, qsQs, tempCelsius, kuerzel, userId, notizen,
  } = req.body;

  if (!marketId || !year || !month || !day || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }

  const now = new Date();
  const entryDate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (entryDate > today) {
    res.status(400).json({ error: "Eintragungen fuer zukuenftige Tage sind nicht erlaubt" });
    return;
  }

  const existing = await db
    .select()
    .from(wareneingangOGTable)
    .where(
      and(
        eq(wareneingangOGTable.marketId, marketId),
        eq(wareneingangOGTable.year, year),
        eq(wareneingangOGTable.month, month),
        eq(wareneingangOGTable.day, day)
      )
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(wareneingangOGTable)
      .set({ hygiene, etikettierung, qualitaet, mhd, kistenetikett, qsBiosiegel, qsBy, qsQs, tempCelsius, kuerzel, userId, notizen })
      .where(eq(wareneingangOGTable.id, existing[0].id))
      .returning();
    res.json(updated);
    return;
  }

  const [row] = await db
    .insert(wareneingangOGTable)
    .values({ tenantId, marketId, year, month, day, hygiene, etikettierung, qualitaet, mhd, kistenetikett, qsBiosiegel, qsBy, qsQs, tempCelsius, kuerzel, userId, notizen })
    .returning();
  res.json(row);
});

router.delete("/wareneingang-og/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(wareneingangOGTable).where(eq(wareneingangOGTable.id, id));
  res.json({ ok: true });
});

export default router;
