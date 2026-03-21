import { Router, type IRouter } from "express";
import { db, wareRayonsTable, wareBestellungenTable } from "@workspace/db";
import { eq, and, asc, or, isNull } from "drizzle-orm";

const router: IRouter = Router();

// ── Rayons (Konfiguration) ──────────────────────────────────────────────────

router.get("/ware-rayons", async (req, res) => {
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const whereClause = marketId
    ? and(eq(wareRayonsTable.aktiv, true), or(isNull(wareRayonsTable.marketId), eq(wareRayonsTable.marketId, marketId)))
    : eq(wareRayonsTable.aktiv, true);
  const rows = await db.select().from(wareRayonsTable)
    .where(whereClause)
    .orderBy(asc(wareRayonsTable.sortOrder), asc(wareRayonsTable.id));
  res.json(rows);
});

router.post("/ware-rayons", async (req, res) => {
  const { marketId, name, beschreibung, farbe, sortOrder } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Name erforderlich" }); return; }
  const [row] = await db.insert(wareRayonsTable)
    .values({ marketId: marketId || null, name: name.trim(), beschreibung: beschreibung || null, farbe: farbe || "#1a3a6b", sortOrder: sortOrder ?? 99 })
    .returning();
  res.status(201).json(row);
});

router.patch("/ware-rayons/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, beschreibung, farbe, sortOrder, aktiv } = req.body;
  const patch: Record<string, unknown> = {};
  if (name !== undefined)        patch.name = name.trim();
  if (beschreibung !== undefined) patch.beschreibung = beschreibung || null;
  if (farbe !== undefined)        patch.farbe = farbe;
  if (sortOrder !== undefined)    patch.sortOrder = sortOrder;
  if (aktiv !== undefined)        patch.aktiv = aktiv;
  const [row] = await db.update(wareRayonsTable).set(patch).where(eq(wareRayonsTable.id, id)).returning();
  res.json(row);
});

router.delete("/ware-rayons/:id", async (req, res) => {
  await db.delete(wareRayonsTable).where(eq(wareRayonsTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ── Bestellungen (Tagesstatus) ──────────────────────────────────────────────

router.get("/ware-bestellungen", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const datum = req.query.datum as string;
  if (!marketId || !datum) { res.status(400).json({ error: "marketId und datum erforderlich" }); return; }
  const rows = await db.select().from(wareBestellungenTable)
    .where(and(eq(wareBestellungenTable.marketId, marketId), eq(wareBestellungenTable.datum, datum)));
  res.json(rows);
});

router.post("/ware-bestellungen", async (req, res) => {
  const { marketId, rayonId, datum, kuerzel, anmerkung } = req.body;
  if (!marketId || !rayonId || !datum) { res.status(400).json({ error: "marketId, rayonId, datum erforderlich" }); return; }
  try {
    const [row] = await db.insert(wareBestellungenTable)
      .values({ marketId, rayonId, datum, kuerzel: kuerzel || null, anmerkung: anmerkung || null })
      .onConflictDoNothing()
      .returning();
    res.status(201).json(row || { alreadyExists: true });
  } catch {
    res.status(409).json({ error: "Bereits markiert" });
  }
});

router.delete("/ware-bestellungen/:id", async (req, res) => {
  await db.delete(wareBestellungenTable).where(eq(wareBestellungenTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

// Delete by market+rayon+datum (unmark)
router.delete("/ware-bestellungen", async (req, res) => {
  const { marketId, rayonId, datum } = req.body;
  await db.delete(wareBestellungenTable)
    .where(and(eq(wareBestellungenTable.marketId, Number(marketId)), eq(wareBestellungenTable.rayonId, Number(rayonId)), eq(wareBestellungenTable.datum, datum)));
  res.json({ ok: true });
});

export default router;
