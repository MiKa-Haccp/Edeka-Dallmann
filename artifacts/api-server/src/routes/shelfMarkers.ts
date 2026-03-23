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
  const { marketId, label, x, y, size, rotated, sortiment, reduzierungsRegel, aktionsHinweis, kontrollIntervall, naechsteKontrolle } = req.body;
  if (!marketId || !label || x == null || y == null) {
    res.status(400).json({ error: "marketId, label, x, y erforderlich" }); return;
  }
  const [row] = await db.insert(shelfMarkersTable).values({
    marketId, label, x: String(x), y: String(y),
    size: size || "md",
    rotated: rotated ?? false,
    sortiment: sortiment || null,
    reduzierungsRegel: reduzierungsRegel || null,
    aktionsHinweis: aktionsHinweis || null,
    kontrollIntervall: kontrollIntervall ?? 7,
    naechsteKontrolle: naechsteKontrolle || null,
  }).returning();
  res.status(201).json(row);
});

router.patch("/shelf-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Ungueltige ID" }); return; }
  const allowed = ["label","x","y","size","rotated","sortiment","reduzierungsRegel","aktionsHinweis","kontrollIntervall","naechsteKontrolle"];
  const dbMap: Record<string,string> = { reduzierungsRegel:"reduzierungs_regel", aktionsHinweis:"aktions_hinweis", kontrollIntervall:"kontroll_intervall", naechsteKontrolle:"naechste_kontrolle" };
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const dbKey = dbMap[key] ?? key;
      updates[dbKey] = req.body[key] === "" ? null : req.body[key];
      if (key === "x" || key === "y") updates[dbKey] = String(req.body[key]);
    }
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
