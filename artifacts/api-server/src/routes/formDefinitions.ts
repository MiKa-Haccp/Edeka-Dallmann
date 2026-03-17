import { Router, type IRouter } from "express";
import { db, formDefinitionsTable } from "@workspace/db";
import { ListFormDefinitionsResponse, ListFormDefinitionsParams } from "@workspace/api-zod";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sections/:sectionId/form-definitions", async (req, res) => {
  const params = ListFormDefinitionsParams.parse(req.params);
  const definitions = await db
    .select()
    .from(formDefinitionsTable)
    .where(eq(formDefinitionsTable.sectionId, params.sectionId))
    .orderBy(asc(formDefinitionsTable.sortOrder));
  const data = ListFormDefinitionsResponse.parse(definitions);
  res.json(data);
});

export default router;
