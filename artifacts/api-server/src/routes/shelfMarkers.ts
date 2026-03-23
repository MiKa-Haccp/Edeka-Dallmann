import { Router, type IRouter } from "express";
import { db, shelfMarkersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/shelf-markers", async (req, res) => {
  const marketId = Number(req.query.marketId);
  if (!marketId) { res.status(400).json({ error: "marketId erforderlich" }); return; }
  const rows = await db.select().from(shelfMarkersTable)
    .where(eq(shelfMarkersTable.marketId, marketId))
    .orderBy(shelfMarkersTable.id);
  res.json(rows);
});

router.post("/shelf-markers", async (req, res) => {
  const {
    marketId, label, x, y, size, rotated, sortiment,
    reduzierungsRegel, reduzierungsDatum,
    aktionsHinweis, knickDatum,
    kontrollIntervall, naechsteKontrolle,
  } = req.body;
  if (!marketId || !label || x == null || y == null) {
    res.status(400).json({ error: "marketId, label, x, y erforderlich" }); return;
  }
  const [row] = await db.insert(shelfMarkersTable).values({
    marketId,
    label,
    x: String(x),
    y: String(y),
    size: size || "md",
    rotated: rotated ?? false,
    sortiment:          sortiment          || null,
    reduzierungsRegel:  reduzierungsRegel  || null,
    reduzierungsDatum:  reduzierungsDatum  || null,
    aktionsHinweis:     aktionsHinweis     || null,
    knickDatum:         knickDatum         || null,
    kontrollIntervall:  kontrollIntervall  ?? 7,
    kontrollRhythmus:   req.body.kontrollRhythmus || null,
    naechsteKontrolle:  naechsteKontrolle  || null,
  }).returning();
  res.status(201).json(row);
});

router.patch("/shelf-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Ungueltige ID" }); return; }

  const b = req.body;
  const updates: Partial<typeof shelfMarkersTable.$inferInsert> = {};

  if (b.label              !== undefined) updates.label             = b.label             || null;
  if (b.x                  !== undefined) updates.x                 = String(b.x);
  if (b.y                  !== undefined) updates.y                 = String(b.y);
  if (b.size               !== undefined) updates.size              = b.size              || null;
  if (b.rotated            !== undefined) updates.rotated           = b.rotated;
  if (b.sortiment          !== undefined) updates.sortiment         = b.sortiment         || null;
  if (b.reduzierungsRegel  !== undefined) updates.reduzierungsRegel = b.reduzierungsRegel || null;
  if (b.reduzierungsDatum  !== undefined) updates.reduzierungsDatum = b.reduzierungsDatum || null;
  if (b.aktionsHinweis     !== undefined) updates.aktionsHinweis    = b.aktionsHinweis    || null;
  if (b.knickDatum         !== undefined) updates.knickDatum        = b.knickDatum        || null;
  if (b.kontrollIntervall  !== undefined) updates.kontrollIntervall = b.kontrollIntervall;
  if (b.kontrollRhythmus   !== undefined) updates.kontrollRhythmus  = b.kontrollRhythmus  || null;
  if (b.naechsteKontrolle  !== undefined) updates.naechsteKontrolle = b.naechsteKontrolle || null;
  if (b.letzteKontrolleAt  !== undefined) updates.letzteKontrolleAt = b.letzteKontrolleAt ? new Date(b.letzteKontrolleAt) : null;
  if (b.letzteKontrolleVon !== undefined) updates.letzteKontrolleVon = b.letzteKontrolleVon || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Keine Felder zum Aktualisieren" }); return;
  }

  const [row] = await db.update(shelfMarkersTable).set(updates)
    .where(eq(shelfMarkersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  res.json(row);
});

router.delete("/shelf-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(shelfMarkersTable).where(eq(shelfMarkersTable.id, id));
  res.json({ ok: true });
});

export default router;
