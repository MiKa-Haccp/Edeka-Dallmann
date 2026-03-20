import { Router, type IRouter } from "express";
import { db, wareneingangTypesTable, wareneingangEntriesTable } from "@workspace/db";
import { eq, and, asc, or, isNull } from "drizzle-orm";

const router: IRouter = Router();

// --- TYPES ---
router.get("/wareneingang-types", async (req, res) => {
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const rows = await db
    .select()
    .from(wareneingangTypesTable)
    .where(
      and(
        eq(wareneingangTypesTable.aktiv, true),
        marketId
          ? eq(wareneingangTypesTable.marketId, marketId)
          : isNull(wareneingangTypesTable.marketId)
      )
    )
    .orderBy(asc(wareneingangTypesTable.sortOrder));
  res.json(rows);
});

router.post("/wareneingang-types", async (req, res) => {
  const { name, beschreibung, wareArt = "ungekuehlt", criteriaConfig = {}, sortOrder = 99, marketId } = req.body;
  if (!name) { res.status(400).json({ error: "Name erforderlich" }); return; }
  const [row] = await db
    .insert(wareneingangTypesTable)
    .values({ name, beschreibung, wareArt, criteriaConfig, sortOrder, marketId: marketId || null })
    .returning();
  res.json(row);
});

router.put("/wareneingang-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, beschreibung, wareArt, criteriaConfig, sortOrder, aktiv } = req.body;
  const [row] = await db
    .update(wareneingangTypesTable)
    .set({ name, beschreibung, wareArt, criteriaConfig, sortOrder, aktiv })
    .where(eq(wareneingangTypesTable.id, id))
    .returning();
  res.json(row);
});

router.delete("/wareneingang-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db
    .update(wareneingangTypesTable)
    .set({ aktiv: false })
    .where(eq(wareneingangTypesTable.id, id));
  res.json({ ok: true });
});

// --- ENTRIES ---
router.get("/wareneingang-entries", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const typeId = Number(req.query.typeId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !typeId || !year || !month) {
    res.status(400).json({ error: "marketId, typeId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(wareneingangEntriesTable)
    .where(
      and(
        eq(wareneingangEntriesTable.marketId, marketId),
        eq(wareneingangEntriesTable.typeId, typeId),
        eq(wareneingangEntriesTable.year, year),
        eq(wareneingangEntriesTable.month, month)
      )
    );
  res.json(rows);
});

router.get("/wareneingang-entries/day", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const typeId = Number(req.query.typeId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const day = Number(req.query.day);
  if (!marketId || !typeId || !year || !month || !day) {
    res.status(400).json({ error: "Params required" }); return;
  }
  const rows = await db
    .select()
    .from(wareneingangEntriesTable)
    .where(
      and(
        eq(wareneingangEntriesTable.marketId, marketId),
        eq(wareneingangEntriesTable.typeId, typeId),
        eq(wareneingangEntriesTable.year, year),
        eq(wareneingangEntriesTable.month, month),
        eq(wareneingangEntriesTable.day, day)
      )
    );
  res.json(rows[0] ?? null);
});

router.post("/wareneingang-entries", async (req, res) => {
  const { tenantId = 1, marketId, typeId, year, month, day, criteriaValues = {}, kuerzel, userId, notizen } = req.body;
  if (!marketId || !typeId || !year || !month || !day || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" }); return;
  }
  const now = new Date();
  const entryDate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (entryDate > today) {
    res.status(400).json({ error: "Zukuenftige Tage sind nicht erlaubt" }); return;
  }
  const existing = await db
    .select()
    .from(wareneingangEntriesTable)
    .where(
      and(
        eq(wareneingangEntriesTable.marketId, marketId),
        eq(wareneingangEntriesTable.typeId, typeId),
        eq(wareneingangEntriesTable.year, year),
        eq(wareneingangEntriesTable.month, month),
        eq(wareneingangEntriesTable.day, day)
      )
    );
  if (existing.length > 0) {
    const [updated] = await db
      .update(wareneingangEntriesTable)
      .set({ criteriaValues, kuerzel, userId, notizen })
      .where(eq(wareneingangEntriesTable.id, existing[0].id))
      .returning();
    res.json(updated);
    return;
  }
  const [row] = await db
    .insert(wareneingangEntriesTable)
    .values({ tenantId, marketId, typeId, year, month, day, criteriaValues, kuerzel, userId, notizen })
    .returning();
  res.json(row);
});

router.delete("/wareneingang-entries/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(wareneingangEntriesTable).where(eq(wareneingangEntriesTable.id, id));
  res.json({ ok: true });
});

export default router;
