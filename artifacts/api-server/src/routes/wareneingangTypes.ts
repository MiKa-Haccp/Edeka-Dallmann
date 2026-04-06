import { Router, type IRouter } from "express";
import { db, wareneingangTypesTable, wareneingangEntriesTable } from "@workspace/db";
import { eq, and, asc, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// ── TYPES ──────────────────────────────────────────────────
router.get("/wareneingang-types", async (req, res) => {
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const section = req.query.section as string | undefined;
  const conditions: any[] = [
    eq(wareneingangTypesTable.aktiv, true),
    marketId
      ? eq(wareneingangTypesTable.marketId, marketId)
      : isNull(wareneingangTypesTable.marketId),
  ];
  if (section) conditions.push(eq(wareneingangTypesTable.section, section));
  const rows = await db
    .select()
    .from(wareneingangTypesTable)
    .where(and(...conditions))
    .orderBy(asc(wareneingangTypesTable.sortOrder));
  res.json(rows);
});

router.post("/wareneingang-types", async (req, res) => {
  const { name, beschreibung, wareArt = "ungekuehlt", criteriaConfig = {}, sortOrder = 99, marketId, liefertage = [], liefertageAusnahmen = {}, section = "wareneingaenge" } = req.body;
  if (!name) { res.status(400).json({ error: "Name erforderlich" }); return; }
  const [row] = await db
    .insert(wareneingangTypesTable)
    .values({ name, beschreibung, wareArt, criteriaConfig, sortOrder, marketId: marketId || null, liefertage, liefertageAusnahmen, section })
    .returning();
  res.json(row);
});

router.put("/wareneingang-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, beschreibung, wareArt, criteriaConfig, sortOrder, aktiv, liefertage, liefertageAusnahmen, section } = req.body;
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (beschreibung !== undefined) patch.beschreibung = beschreibung;
  if (wareArt !== undefined) patch.wareArt = wareArt;
  if (criteriaConfig !== undefined) patch.criteriaConfig = criteriaConfig;
  if (sortOrder !== undefined) patch.sortOrder = sortOrder;
  if (aktiv !== undefined) patch.aktiv = aktiv;
  if (liefertage !== undefined) patch.liefertage = liefertage;
  if (liefertageAusnahmen !== undefined) patch.liefertageAusnahmen = liefertageAusnahmen;
  if (section !== undefined) patch.section = section;
  const [row] = await db
    .update(wareneingangTypesTable)
    .set(patch as any)
    .where(eq(wareneingangTypesTable.id, id))
    .returning();
  res.json(row);
});

router.delete("/wareneingang-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(wareneingangTypesTable).set({ aktiv: false }).where(eq(wareneingangTypesTable.id, id));
  res.json({ ok: true });
});

// ── ENTRIES ────────────────────────────────────────────────
router.get("/wareneingang-entries", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const typeId = Number(req.query.typeId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !typeId || !year || !month) {
    res.status(400).json({ error: "marketId, typeId, year, month required" }); return;
  }
  const rows = await db
    .select()
    .from(wareneingangEntriesTable)
    .where(and(
      eq(wareneingangEntriesTable.marketId, marketId),
      eq(wareneingangEntriesTable.typeId, typeId),
      eq(wareneingangEntriesTable.year, year),
      eq(wareneingangEntriesTable.month, month)
    ));
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
    .where(and(
      eq(wareneingangEntriesTable.marketId, marketId),
      eq(wareneingangEntriesTable.typeId, typeId),
      eq(wareneingangEntriesTable.year, year),
      eq(wareneingangEntriesTable.month, month),
      eq(wareneingangEntriesTable.day, day)
    ));
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
  const existing = await db.select().from(wareneingangEntriesTable).where(and(
    eq(wareneingangEntriesTable.marketId, marketId),
    eq(wareneingangEntriesTable.typeId, typeId),
    eq(wareneingangEntriesTable.year, year),
    eq(wareneingangEntriesTable.month, month),
    eq(wareneingangEntriesTable.day, day)
  ));
  if (existing.length > 0) {
    const [updated] = await db.update(wareneingangEntriesTable)
      .set({ criteriaValues, kuerzel, userId, notizen })
      .where(eq(wareneingangEntriesTable.id, existing[0].id))
      .returning();
    res.json(updated); return;
  }
  const [row] = await db.insert(wareneingangEntriesTable)
    .values({ tenantId, marketId, typeId, year, month, day, criteriaValues, kuerzel, userId, notizen })
    .returning();
  res.json(row);
});

router.delete("/wareneingang-entries/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(wareneingangEntriesTable).where(eq(wareneingangEntriesTable.id, id));
  res.json({ ok: true });
});

// ── TODAY SUMMARY ─────────────────────────────────────────
router.get("/wareneingang-today-summary", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const section = (req.query.section as string) || "wareneingaenge";
  if (!marketId) { res.status(400).json({ error: "marketId required" }); return; }
  const dateParam = req.query.date as string | undefined;
  const refDate = dateParam ? new Date(dateParam) : new Date();
  const year = refDate.getFullYear(), month = refDate.getMonth() + 1, day = refDate.getDate();
  const rows = await db.execute(sql`
    SELECT t.id as type_id, t.liefertage, t.liefertage_ausnahmen,
           e.criteria_values, e.kuerzel
    FROM wareneingang_types t
    LEFT JOIN wareneingang_entries e ON (
      e.market_id = ${marketId} AND e.type_id = t.id AND
      e.year = ${year} AND e.month = ${month} AND e.day = ${day}
    )
    WHERE t.market_id = ${marketId} AND t.aktiv = true AND t.section = ${section}
    ORDER BY t.sort_order
  `);
  res.json(rows.rows);
});

// ── JAHRESARCHIV ───────────────────────────────────────────
router.get("/wareneingang-archiv", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  if (!marketId || !year) { res.status(400).json({ error: "marketId und year erforderlich" }); return; }
  const rows = await db.execute(
    sql`SELECT * FROM wareneingang_jahresarchiv WHERE market_id = ${marketId} AND year = ${year} ORDER BY type_id`
  );
  res.json(rows.rows);
});

router.post("/wareneingang-archiv", async (req, res) => {
  const { marketId, typeId, year } = req.body;
  if (!marketId || !typeId || !year) { res.status(400).json({ error: "marketId, typeId, year erforderlich" }); return; }
  const entries = await db.execute(
    sql`SELECT * FROM wareneingang_entries WHERE market_id = ${marketId} AND type_id = ${typeId} AND year = ${year} ORDER BY month, day`
  );
  const typeRows = await db.execute(sql`SELECT * FROM wareneingang_types WHERE id = ${typeId}`);
  const archivJson = { type: typeRows.rows[0], entries: entries.rows, archivedAt: new Date().toISOString() };
  await db.execute(sql`
    INSERT INTO wareneingang_jahresarchiv (market_id, type_id, year, archiv_json)
    VALUES (${marketId}, ${typeId}, ${year}, ${JSON.stringify(archivJson)}::jsonb)
    ON CONFLICT (market_id, type_id, year) DO UPDATE SET archiv_json = EXCLUDED.archiv_json, erstellt_am = NOW()
  `);
  res.json({ ok: true, entries: entries.rows.length });
});

export default router;
