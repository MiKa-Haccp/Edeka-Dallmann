import { Router, type IRouter } from "express";
import { db, shelfMarkersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET – alle Marker eines Markts
router.get("/shelf-markers", async (req, res) => {
  const marketId = Number(req.query.marketId);
  if (!marketId) { res.status(400).json({ error: "marketId erforderlich" }); return; }
  const rows = await db.select().from(shelfMarkersTable)
    .where(eq(shelfMarkersTable.marketId, marketId))
    .orderBy(shelfMarkersTable.id);
  res.json(rows);
});

// POST – neuen Marker anlegen (Admin)
router.post("/shelf-markers", async (req, res) => {
  const { marketId, label, x, y, sortiment, reduzierungsRegel, aktionsHinweis, kontrollIntervall, naechsteKontrolle } = req.body;
  if (!marketId || !label || x == null || y == null) {
    res.status(400).json({ error: "marketId, label, x, y erforderlich" }); return;
  }
  const [row] = await db.insert(shelfMarkersTable).values({
    marketId, label, x: String(x), y: String(y),
    sortiment: sortiment || null,
    reduzierungsRegel: reduzierungsRegel || null,
    aktionsHinweis: aktionsHinweis || null,
    kontrollIntervall: kontrollIntervall ?? 7,
    naechsteKontrolle: naechsteKontrolle || null,
  }).returning();
  res.status(201).json(row);
});

// PATCH – Marker aktualisieren (Admin)
router.patch("/shelf-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { label, x, y, sortiment, reduzierungsRegel, aktionsHinweis, kontrollIntervall, naechsteKontrolle } = req.body;
  if (!id) { res.status(400).json({ error: "Ungültige ID" }); return; }
  const updates: Record<string, unknown> = {};
  if (label != null)             updates.label             = label;
  if (x != null)                 updates.x                 = String(x);
  if (y != null)                 updates.y                 = String(y);
  if (sortiment != null)         updates.sortiment         = sortiment || null;
  if (reduzierungsRegel != null) updates.reduzierungsRegel = reduzierungsRegel || null;
  if (aktionsHinweis != null)    updates.aktionsHinweis    = aktionsHinweis || null;
  if (kontrollIntervall != null) updates.kontrollIntervall = kontrollIntervall;
  if (naechsteKontrolle != null) updates.naechsteKontrolle = naechsteKontrolle || null;
  const [row] = await db.update(shelfMarkersTable).set(updates)
    .where(eq(shelfMarkersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  res.json(row);
});

// DELETE – Marker löschen (Admin)
router.delete("/shelf-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(shelfMarkersTable).where(eq(shelfMarkersTable.id, id));
  res.json({ ok: true });
});

export default router;
