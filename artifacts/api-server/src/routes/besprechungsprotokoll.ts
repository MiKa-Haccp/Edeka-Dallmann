import { Router } from "express";
import { db } from "@workspace/db";
import {
  besprechungsprotokollTable,
  besprechungTeilnehmerTable,
} from "@workspace/db/schema";
import { usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// --- Protokolle ---

router.get("/besprechungsprotokoll", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const where = marketId
    ? and(eq(besprechungsprotokollTable.tenantId, tenantId), eq(besprechungsprotokollTable.marketId, marketId))
    : eq(besprechungsprotokollTable.tenantId, tenantId);
  const rows = await db
    .select()
    .from(besprechungsprotokollTable)
    .where(where)
    .orderBy(besprechungsprotokollTable.createdAt);
  res.json(rows);
});

router.get("/besprechungsprotokoll/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .select()
    .from(besprechungsprotokollTable)
    .where(eq(besprechungsprotokollTable.id, id));
  if (!row.length) return res.status(404).json({ error: "Nicht gefunden" });
  res.json(row[0]);
});

router.post("/besprechungsprotokoll", async (req, res) => {
  const { tenantId = 1, marketId = 1, ...fields } = req.body;
  const row = await db
    .insert(besprechungsprotokollTable)
    .values({ tenantId, marketId, ...fields })
    .returning();
  res.json(row[0]);
});

router.put("/besprechungsprotokoll/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { tenantId, marketId, ...fields } = req.body;
  const row = await db
    .update(besprechungsprotokollTable)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(besprechungsprotokollTable.id, id))
    .returning();
  res.json(row[0]);
});

router.delete("/besprechungsprotokoll/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(besprechungTeilnehmerTable).where(eq(besprechungTeilnehmerTable.protokollId, id));
  await db.delete(besprechungsprotokollTable).where(eq(besprechungsprotokollTable.id, id));
  res.json({ success: true });
});

// --- Teilnehmer ---

router.get("/besprechungsprotokoll/:protokollId/teilnehmer", async (req, res) => {
  const protokollId = Number(req.params.protokollId);
  const rows = await db
    .select()
    .from(besprechungTeilnehmerTable)
    .where(eq(besprechungTeilnehmerTable.protokollId, protokollId))
    .orderBy(besprechungTeilnehmerTable.reihenfolge);
  res.json(rows);
});

router.post("/besprechungsprotokoll/:protokollId/teilnehmer", async (req, res) => {
  const protokollId = Number(req.params.protokollId);
  const { nameManuel, reihenfolge = 0 } = req.body;
  const row = await db
    .insert(besprechungTeilnehmerTable)
    .values({ protokollId, nameManuel, reihenfolge })
    .returning();
  res.json(row[0]);
});

router.delete("/besprechungsprotokoll/:protokollId/teilnehmer/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(besprechungTeilnehmerTable).where(eq(besprechungTeilnehmerTable.id, id));
  res.json({ success: true });
});

// PIN-Bestätigung
router.post("/besprechungsprotokoll/:protokollId/teilnehmer/:id/pin-verify", async (req, res) => {
  const protokollId = Number(req.params.protokollId);
  const teilnehmerId = Number(req.params.id);
  const { pin, tenantId = 1 } = req.body;

  if (!pin) return res.status(400).json({ error: "PIN fehlt" });

  const users = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.tenantId, tenantId), eq(usersTable.pin, String(pin))));

  if (!users.length) {
    return res.status(401).json({ error: "Ungültiger PIN" });
  }

  const user = users[0];

  const updated = await db
    .update(besprechungTeilnehmerTable)
    .set({
      bestaetigt: true,
      bestaetigtAm: new Date(),
      bestaetigterName: user.name,
      userId: user.id,
    })
    .where(eq(besprechungTeilnehmerTable.id, teilnehmerId))
    .returning();

  res.json({ success: true, teilnehmer: updated[0], userName: user.name });
});

export default router;
