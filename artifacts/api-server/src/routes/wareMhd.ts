import { Router, type IRouter } from "express";
import { db, wareMhdBereicheTable, wareMhdKontrollenTable } from "@workspace/db";
import { eq, and, asc, desc, or, isNull } from "drizzle-orm";

const router: IRouter = Router();

// ── MHD Bereiche (Konfiguration) ────────────────────────────────────────────

router.get("/ware-mhd-bereiche", async (req, res) => {
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const whereClause = marketId
    ? and(eq(wareMhdBereicheTable.aktiv, true), or(isNull(wareMhdBereicheTable.marketId), eq(wareMhdBereicheTable.marketId, marketId)))
    : eq(wareMhdBereicheTable.aktiv, true);
  const rows = await db.select().from(wareMhdBereicheTable)
    .where(whereClause)
    .orderBy(asc(wareMhdBereicheTable.sortOrder), asc(wareMhdBereicheTable.id));
  res.json(rows);
});

router.post("/ware-mhd-bereiche", async (req, res) => {
  const { marketId, name, beschreibung, intervallTage, reduzierungTage, entnahmeTage, sortOrder } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Name erforderlich" }); return; }
  const [row] = await db.insert(wareMhdBereicheTable)
    .values({
      marketId: marketId || null, name: name.trim(),
      beschreibung: beschreibung || null,
      intervallTage: intervallTage ?? 1,
      reduzierungTage: reduzierungTage ?? 3,
      entnahmeTage: entnahmeTage ?? 1,
      sortOrder: sortOrder ?? 99,
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/ware-mhd-bereiche/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, beschreibung, intervallTage, reduzierungTage, entnahmeTage, sortOrder, aktiv } = req.body;
  const patch: Record<string, unknown> = {};
  if (name !== undefined)            patch.name = name.trim();
  if (beschreibung !== undefined)     patch.beschreibung = beschreibung || null;
  if (intervallTage !== undefined)    patch.intervallTage = intervallTage;
  if (reduzierungTage !== undefined)  patch.reduzierungTage = reduzierungTage;
  if (entnahmeTage !== undefined)     patch.entnahmeTage = entnahmeTage;
  if (sortOrder !== undefined)        patch.sortOrder = sortOrder;
  if (aktiv !== undefined)            patch.aktiv = aktiv;
  const [row] = await db.update(wareMhdBereicheTable).set(patch).where(eq(wareMhdBereicheTable.id, id)).returning();
  res.json(row);
});

router.delete("/ware-mhd-bereiche/:id", async (req, res) => {
  await db.update(wareMhdBereicheTable).set({ aktiv: false }).where(eq(wareMhdBereicheTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ── MHD Kontrollen ──────────────────────────────────────────────────────────

router.get("/ware-mhd-kontrollen", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const datum = req.query.datum as string | undefined;
  if (!marketId) { res.status(400).json({ error: "marketId erforderlich" }); return; }
  const conditions = [eq(wareMhdKontrollenTable.marketId, marketId)];
  if (datum) conditions.push(eq(wareMhdKontrollenTable.datum, datum));
  const rows = await db.select().from(wareMhdKontrollenTable)
    .where(and(...conditions))
    .orderBy(desc(wareMhdKontrollenTable.createdAt));
  res.json(rows);
});

router.post("/ware-mhd-kontrollen", async (req, res) => {
  const { marketId, bereichId, datum, kuerzel, bemerkung } = req.body;
  if (!marketId || !bereichId || !datum) { res.status(400).json({ error: "marketId, bereichId, datum erforderlich" }); return; }
  try {
    const [row] = await db.insert(wareMhdKontrollenTable)
      .values({ marketId, bereichId, datum, kuerzel: kuerzel || null, bemerkung: bemerkung || null })
      .onConflictDoNothing()
      .returning();
    res.status(201).json(row || { alreadyExists: true });
  } catch {
    res.status(409).json({ error: "Bereits kontrolliert" });
  }
});

router.delete("/ware-mhd-kontrollen", async (req, res) => {
  const { marketId, bereichId, datum } = req.body;
  await db.delete(wareMhdKontrollenTable)
    .where(and(eq(wareMhdKontrollenTable.marketId, Number(marketId)), eq(wareMhdKontrollenTable.bereichId, Number(bereichId)), eq(wareMhdKontrollenTable.datum, datum)));
  res.json({ ok: true });
});

export default router;
