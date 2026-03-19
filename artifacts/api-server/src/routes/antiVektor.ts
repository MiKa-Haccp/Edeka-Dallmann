import { Router } from "express";
import { db } from "@workspace/db";
import { antiVektorZugangsdatenTable, antiVektorZertifikateTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// --- Zugangsdaten (1 Datensatz pro Tenant) ---

router.get("/anti-vektor/zugangsdaten", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const rows = await db
    .select()
    .from(antiVektorZugangsdatenTable)
    .where(eq(antiVektorZugangsdatenTable.tenantId, tenantId));

  if (rows.length === 0) {
    // Default-Datensatz zurückgeben falls noch nicht angelegt
    return res.json({
      id: null,
      tenantId,
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
  const { tenantId = 1, ...fields } = req.body;

  const existing = await db
    .select()
    .from(antiVektorZugangsdatenTable)
    .where(eq(antiVektorZugangsdatenTable.tenantId, tenantId));

  let row;
  if (existing.length === 0) {
    const inserted = await db
      .insert(antiVektorZugangsdatenTable)
      .values({ tenantId, ...fields, updatedAt: new Date() })
      .returning();
    row = inserted[0];
  } else {
    const updated = await db
      .update(antiVektorZugangsdatenTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(antiVektorZugangsdatenTable.tenantId, tenantId))
      .returning();
    row = updated[0];
  }
  res.json(row);
});

// --- Zertifikate ---

router.get("/anti-vektor/zertifikate", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const rows = await db
    .select()
    .from(antiVektorZertifikateTable)
    .where(eq(antiVektorZertifikateTable.tenantId, tenantId))
    .orderBy(antiVektorZertifikateTable.createdAt);
  res.json(rows);
});

router.post("/anti-vektor/zertifikate", async (req, res) => {
  const { tenantId = 1, ...fields } = req.body;
  const row = await db
    .insert(antiVektorZertifikateTable)
    .values({ tenantId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/anti-vektor/zertifikate/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .update(antiVektorZertifikateTable)
    .set(req.body)
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
