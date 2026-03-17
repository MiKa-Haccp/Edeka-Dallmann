import { Router, type IRouter } from "express";
import { db, tenantsTable } from "@workspace/db";
import { ListTenantsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants", async (_req, res) => {
  const tenants = await db.select().from(tenantsTable);
  const data = ListTenantsResponse.parse(tenants);
  res.json(data);
});

export default router;
