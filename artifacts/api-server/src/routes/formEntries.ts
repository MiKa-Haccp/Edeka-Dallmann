import { Router, type IRouter } from "express";
import { db, formEntriesTable } from "@workspace/db";
import { ListFormEntriesResponse, ListFormEntriesParams, CreateFormEntryParams, CreateFormEntryBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/form-instances/:instanceId/entries", async (req, res) => {
  const params = ListFormEntriesParams.parse(req.params);
  const entries = await db
    .select()
    .from(formEntriesTable)
    .where(eq(formEntriesTable.formInstanceId, params.instanceId));
  const data = ListFormEntriesResponse.parse(entries);
  res.json(data);
});

router.post("/form-instances/:instanceId/entries", async (req, res) => {
  const params = CreateFormEntryParams.parse(req.params);
  const body = CreateFormEntryBody.parse(req.body);
  const [entry] = await db.insert(formEntriesTable).values({
    formInstanceId: params.instanceId,
    formDefinitionId: body.formDefinitionId,
    value: body.value,
    signature: body.signature,
    pin: body.pin,
    photoUrl: body.photoUrl,
    entryDate: body.entryDate,
  }).returning();
  res.status(201).json(entry);
});

export default router;
