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

export default router;
