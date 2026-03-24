import { Router, type IRouter } from "express";
import { db, marketsTable } from "@workspace/db";
import { ListMarketsResponse, ListMarketsQueryParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/markets", async (req, res) => {
  const query = ListMarketsQueryParams.parse(req.query);
  let result;
  if (query.tenantId) {
    result = await db.select().from(marketsTable).where(eq(marketsTable.tenantId, query.tenantId));
  } else {
    result = await db.select().from(marketsTable);
  }
  const data = ListMarketsResponse.parse(result);
  res.json(data);
});

router.patch("/markets/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Ungueltige ID" }); return; }
  const b = req.body as Record<string, unknown>;
  const updates: Partial<typeof marketsTable.$inferInsert> = {};
  if (typeof b.planRotiert === "boolean") updates.planRotiert = b.planRotiert;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Keine Felder" }); return; }
  const [row] = await db.update(marketsTable).set(updates).where(eq(marketsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  res.json(row);
});

export default router;
