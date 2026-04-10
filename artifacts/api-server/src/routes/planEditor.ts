import { Router, type IRouter } from "express";
import { db, planEditorStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/plan-editor/:key", async (req, res) => {
  const { key } = req.params;
  const [row] = await db.select().from(planEditorStateTable)
    .where(eq(planEditorStateTable.planKey, key));
  if (!row) {
    res.json({ planKey: key, rects: [], nextId: 1 });
    return;
  }
  res.json({ planKey: row.planKey, rects: row.rects, nextId: row.nextId, updatedAt: row.updatedAt });
});

router.put("/plan-editor/:key", async (req, res) => {
  const { key } = req.params;
  const { rects, nextId } = req.body;
  if (!Array.isArray(rects) || nextId == null) {
    res.status(400).json({ error: "rects (Array) und nextId erforderlich" });
    return;
  }
  const existing = await db.select({ id: planEditorStateTable.id })
    .from(planEditorStateTable)
    .where(eq(planEditorStateTable.planKey, key));

  if (existing.length > 0) {
    const [row] = await db.update(planEditorStateTable)
      .set({ rects, nextId: Number(nextId), updatedAt: new Date() })
      .where(eq(planEditorStateTable.planKey, key))
      .returning();
    res.json({ planKey: row.planKey, rects: row.rects, nextId: row.nextId });
  } else {
    const [row] = await db.insert(planEditorStateTable)
      .values({ planKey: key, rects, nextId: Number(nextId) })
      .returning();
    res.json({ planKey: row.planKey, rects: row.rects, nextId: row.nextId });
  }
});

export default router;
