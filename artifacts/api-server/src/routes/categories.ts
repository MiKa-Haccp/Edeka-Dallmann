import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { ListCategoriesResponse } from "@workspace/api-zod";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
  const data = ListCategoriesResponse.parse(categories);
  res.json(data);
});

export default router;
