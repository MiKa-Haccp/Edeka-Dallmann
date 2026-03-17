import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { ListUsersResponse, ListUsersQueryParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (req, res) => {
  const query = ListUsersQueryParams.parse(req.query);
  let result;
  if (query.tenantId) {
    result = await db.select().from(usersTable).where(eq(usersTable.tenantId, query.tenantId));
  } else {
    result = await db.select().from(usersTable);
  }
  const data = ListUsersResponse.parse(result);
  res.json(data);
});

export default router;
