import { Router } from "express";
import { db } from "@workspace/db";
import { tuevJahresberichtTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/tuev-jahresbericht", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  const rows = await db
    .select()
    .from(tuevJahresberichtTable)
    .where(
      and(
        eq(tuevJahresberichtTable.tenantId, tenantId),
        eq(tuevJahresberichtTable.year, year)
      )
    );

  res.json(rows[0] || null);
});

router.put("/tuev-jahresbericht", async (req, res) => {
  const { tenantId = 1, year, ...fields } = req.body;

  const existing = await db
    .select()
    .from(tuevJahresberichtTable)
    .where(
      and(
        eq(tuevJahresberichtTable.tenantId, tenantId),
        eq(tuevJahresberichtTable.year, year)
      )
    );

  if (existing.length > 0) {
    const row = await db
      .update(tuevJahresberichtTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(
        and(
          eq(tuevJahresberichtTable.tenantId, tenantId),
          eq(tuevJahresberichtTable.year, year)
        )
      )
      .returning();
    res.json(row[0]);
  } else {
    const row = await db
      .insert(tuevJahresberichtTable)
      .values({ tenantId, year, ...fields })
      .returning();
    res.json(row[0]);
  }
});

export default router;
