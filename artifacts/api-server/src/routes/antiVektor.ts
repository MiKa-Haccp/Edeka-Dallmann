import { Router } from "express";
import { db } from "@workspace/db";
import { antiVektorZugangsdatenTable, antiVektorZertifikateTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { upload, attachFileAsBase64 } from "./uploadMiddleware";

const router = Router();

// --- Zugangsdaten (1 Datensatz pro Tenant+Market) ---

router.get("/anti-vektor/zugangsdaten", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const where = marketId
    ? and(eq(antiVektorZugangsdatenTable.tenantId, tenantId), eq(antiVektorZugangsdatenTable.marketId, marketId))
    : eq(antiVektorZugangsdatenTable.tenantId, tenantId);
  const rows = await db.select().from(antiVektorZugangsdatenTable).where(where);

  if (rows.length === 0) {
    return res.json({
      id: null,
      tenantId,
      marketId: marketId ?? 1,
      websiteUrl: "https://www.av-ods.de",
      benutzername: "",
      passwort: "",
      rufnummer: "",
      notizen: "",
    });
  }
  res.json(rows[0]);
});

router.put("/anti-vektor/zugangsdaten", async (req, res) => {
  const { tenantId = 1, marketId = 1, ...fields } = req.body;

  const existing = await db
    .select()
    .from(antiVektorZugangsdatenTable)
    .where(and(eq(antiVektorZugangsdatenTable.tenantId, tenantId), eq(antiVektorZugangsdatenTable.marketId, marketId)));

  let row;
  if (existing.length === 0) {
    const inserted = await db
      .insert(antiVektorZugangsdatenTable)
      .values({ tenantId, marketId, ...fields, updatedAt: new Date() })
      .returning();
    row = inserted[0];
  } else {
    const updated = await db
      .update(antiVektorZugangsdatenTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(antiVektorZugangsdatenTable.tenantId, tenantId), eq(antiVektorZugangsdatenTable.marketId, marketId)))
      .returning();
    row = updated[0];
  }
  res.json(row);
});

// --- Zertifikate ---

router.get("/anti-vektor/zertifikate", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const where = marketId
    ? and(eq(antiVektorZertifikateTable.tenantId, tenantId), eq(antiVektorZertifikateTable.marketId, marketId))
    : eq(antiVektorZertifikateTable.tenantId, tenantId);
  const rows = await db
    .select()
    .from(antiVektorZertifikateTable)
    .where(where)
    .orderBy(antiVektorZertifikateTable.createdAt);
  res.json(rows);
});

router.post("/anti-vektor/zertifikate", upload.single("dokument"), attachFileAsBase64("fotoBase64"), async (req, res) => {
  const { tenantId, marketId, ...fields } = req.body as Record<string, string>;
  const row = await db
    .insert(antiVektorZertifikateTable)
    .values({ tenantId: Number(tenantId) || 1, marketId: Number(marketId) || 1, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/anti-vektor/zertifikate/:id", upload.single("dokument"), attachFileAsBase64("fotoBase64"), async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId: _t, marketId: _m, ...fields } = req.body as Record<string, string>;
  const row = await db
    .update(antiVektorZertifikateTable)
    .set(fields)
    .where(eq(antiVektorZertifikateTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/anti-vektor/zertifikate/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(antiVektorZertifikateTable)
    .where(eq(antiVektorZertifikateTable.id, id));
  res.json({ success: true });
});

export default router;
