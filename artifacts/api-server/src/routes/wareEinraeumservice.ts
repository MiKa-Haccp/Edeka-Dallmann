import { Router, type IRouter } from "express";
import { db, wareEinraeumserviceTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/ware-einraeumservice", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const datum = req.query.datum as string | undefined;
  if (!marketId) { res.status(400).json({ error: "marketId erforderlich" }); return; }
  const conditions = [eq(wareEinraeumserviceTable.marketId, marketId)];
  if (datum) conditions.push(eq(wareEinraeumserviceTable.datum, datum));
  const rows = await db.select().from(wareEinraeumserviceTable)
    .where(and(...conditions))
    .orderBy(desc(wareEinraeumserviceTable.createdAt));
  res.json(rows);
});

router.post("/ware-einraeumservice", async (req, res) => {
  const { marketId, datum, dienstleister, paletten, personal, beginn, ende, anmerkungen, kuerzel } = req.body;
  if (!marketId || !datum) { res.status(400).json({ error: "marketId und datum erforderlich" }); return; }
  const [row] = await db.insert(wareEinraeumserviceTable)
    .values({
      marketId, datum,
      dienstleister: dienstleister || null,
      paletten: paletten != null ? Number(paletten) : null,
      personal: personal != null ? Number(personal) : null,
      beginn: beginn || null,
      ende: ende || null,
      anmerkungen: anmerkungen || null,
      kuerzel: kuerzel || null,
    })
    .returning();
  res.status(201).json(row);
});

router.delete("/ware-einraeumservice/:id", async (req, res) => {
  await db.delete(wareEinraeumserviceTable).where(eq(wareEinraeumserviceTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
