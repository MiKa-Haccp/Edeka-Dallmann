import { Router, type IRouter } from "express";
import { db, sectionsTable } from "@workspace/db";
import { ListSectionsResponse, ListSectionsParams } from "@workspace/api-zod";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories/:categoryId/sections", async (req, res) => {
  const params = ListSectionsParams.parse(req.params);
  const sections = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.categoryId, params.categoryId))
    .orderBy(asc(sectionsTable.sortOrder));
  const data = ListSectionsResponse.parse(sections);
  res.json(data);
});

export default router;
