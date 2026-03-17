import { Router, type IRouter } from "express";
import { db, formInstancesTable } from "@workspace/db";
import { ListFormInstancesResponse, ListFormInstancesQueryParams, CreateFormInstanceBody } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/form-instances", async (req, res) => {
  const query = ListFormInstancesQueryParams.parse(req.query);
  const conditions = [eq(formInstancesTable.marketId, query.marketId)];
  if (query.sectionId) conditions.push(eq(formInstancesTable.sectionId, query.sectionId));
  if (query.year) conditions.push(eq(formInstancesTable.year, query.year));
  if (query.month) conditions.push(eq(formInstancesTable.month, query.month));

  const instances = await db
    .select()
    .from(formInstancesTable)
    .where(and(...conditions));
  const data = ListFormInstancesResponse.parse(instances);
  res.json(data);
});

router.post("/form-instances", async (req, res) => {
  const body = CreateFormInstanceBody.parse(req.body);
  const [instance] = await db.insert(formInstancesTable).values({
    marketId: body.marketId,
    sectionId: body.sectionId,
    year: body.year,
    month: body.month,
  }).returning();
  res.status(201).json(instance);
});

export default router;
