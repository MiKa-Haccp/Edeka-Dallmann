import { Router, Request, Response, NextFunction } from "express";
import { db, pool } from "@workspace/db";
import {
  managementTasksTable,
  managementTaskCommentsTable,
  applicantsTable,
  applicantCommentsTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { upload, attachFileAsBase64 } from "./uploadMiddleware";

const router = Router();
const MANAGEMENT_ROLES = ["SUPERADMIN", "ADMIN"];

async function requireManagementRole(req: Request, res: Response, next: NextFunction) {
  const adminEmail = (req.headers["x-admin-email"] as string | undefined)?.toLowerCase();
  if (!adminEmail) {
    res.status(401).json({ error: "Nicht authentifiziert." });
    return;
  }
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    if (users.length === 0) {
      res.status(403).json({ error: "Zugriff verweigert." });
      return;
    }
    const user = users[0];
    // SUPERADMIN/ADMIN haben immer Zugriff
    if (MANAGEMENT_ROLES.includes(user.role)) {
      next();
      return;
    }
    // Andere Rollen: prüfen ob management.hub Permission vergeben wurde
    const permRow = await pool.query(
      `SELECT permissions FROM role_permission_defaults WHERE role = $1 AND tenant_id = 1 LIMIT 1`,
      [user.role]
    );
    if (
      permRow.rows.length > 0 &&
      Array.isArray(permRow.rows[0].permissions) &&
      permRow.rows[0].permissions.includes("management.hub")
    ) {
      next();
      return;
    }
    res.status(403).json({ error: "Zugriff verweigert. Keine Berechtigung für den Management Hub." });
  } catch {
    res.status(503).json({ error: "DB error" });
  }
}

// Alle /management/* Routen benötigen SUPERADMIN oder ADMIN
router.use("/management", requireManagementRole);

// ─── MANAGEMENT TASKS ─────────────────────────────────────

router.get("/management/tasks", async (req, res) => {
  try {
    const tenantId = Number(req.query.tenantId) || 1;
    const rows = await db
      .select()
      .from(managementTasksTable)
      .where(
        and(
          eq(managementTasksTable.tenantId, tenantId),
          eq(managementTasksTable.isArchived, false)
        )
      )
      .orderBy(asc(managementTasksTable.sortOrder), asc(managementTasksTable.createdAt));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.post("/management/tasks", async (req, res) => {
  try {
    const tenantId = Number(req.body.tenantId) || 1;
    const { title, description, column, priority, dueDate, createdBy, assignee } = req.body;
    const maxOrder = await db
      .select()
      .from(managementTasksTable)
      .where(and(eq(managementTasksTable.tenantId, tenantId), eq(managementTasksTable.column, column || "todo_kai")));
    const sortOrder = maxOrder.length;
    const row = await db
      .insert(managementTasksTable)
      .values({ tenantId, title, description, column: column || "todo_kai", priority: priority || "normal", dueDate, createdBy, assignee, sortOrder })
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.put("/management/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, column, priority, dueDate, assignee, sortOrder, isArchived } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (column !== undefined) updates.column = column;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (assignee !== undefined) updates.assignee = assignee;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    const row = await db
      .update(managementTasksTable)
      .set(updates)
      .where(eq(managementTasksTable.id, id))
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.delete("/management/tasks/:id", async (req, res) => {
  try {
    await db.delete(managementTasksTable).where(eq(managementTasksTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

// ─── TASK COMMENTS ────────────────────────────────────────

router.get("/management/tasks/:taskId/comments", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(managementTaskCommentsTable)
      .where(eq(managementTaskCommentsTable.taskId, Number(req.params.taskId)))
      .orderBy(asc(managementTaskCommentsTable.createdAt));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.post("/management/tasks/:taskId/comments", async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { author, content } = req.body;
    const row = await db
      .insert(managementTaskCommentsTable)
      .values({ taskId, author, content })
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.delete("/management/tasks/comments/:id", async (req, res) => {
  try {
    await db.delete(managementTaskCommentsTable).where(eq(managementTaskCommentsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

// ─── APPLICANTS ───────────────────────────────────────────

router.get("/management/applicants", async (req, res) => {
  try {
    const tenantId = Number(req.query.tenantId) || 1;
    const rows = await db
      .select()
      .from(applicantsTable)
      .where(eq(applicantsTable.tenantId, tenantId))
      .orderBy(asc(applicantsTable.sortOrder), asc(applicantsTable.createdAt));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.post("/management/applicants", upload.single("photo"), attachFileAsBase64("photoBase64"), async (req, res) => {
  try {
    const tenantId = Number(req.body.tenantId) || 1;
    const {
      name, email, phone, source,
      experienceKasse, experienceLaden, experienceObst, experienceMopro, experienceMetzgerei,
      flexibility, hoursWish, entryDate, salaryWish, notes, photoBase64,
    } = req.body;
    const row = await db
      .insert(applicantsTable)
      .values({
        tenantId, name, email, phone, source,
        experienceKasse: experienceKasse === "true" || experienceKasse === true,
        experienceLaden: experienceLaden === "true" || experienceLaden === true,
        experienceObst: experienceObst === "true" || experienceObst === true,
        experienceMopro: experienceMopro === "true" || experienceMopro === true,
        experienceMetzgerei: experienceMetzgerei === "true" || experienceMetzgerei === true,
        flexibility, hoursWish, entryDate, salaryWish, notes, photoBase64,
        status: "eingang",
        sortOrder: 0,
      })
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.put("/management/applicants/:id", upload.single("photo"), attachFileAsBase64("photoBase64"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name, email, phone, source,
      experienceKasse, experienceLaden, experienceObst, experienceMopro, experienceMetzgerei,
      flexibility, hoursWish, entryDate, salaryWish, notes, status, sortOrder, photoBase64,
    } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (source !== undefined) updates.source = source;
    if (experienceKasse !== undefined) updates.experienceKasse = experienceKasse === "true" || experienceKasse === true;
    if (experienceLaden !== undefined) updates.experienceLaden = experienceLaden === "true" || experienceLaden === true;
    if (experienceObst !== undefined) updates.experienceObst = experienceObst === "true" || experienceObst === true;
    if (experienceMopro !== undefined) updates.experienceMopro = experienceMopro === "true" || experienceMopro === true;
    if (experienceMetzgerei !== undefined) updates.experienceMetzgerei = experienceMetzgerei === "true" || experienceMetzgerei === true;
    if (flexibility !== undefined) updates.flexibility = flexibility;
    if (hoursWish !== undefined) updates.hoursWish = hoursWish;
    if (entryDate !== undefined) updates.entryDate = entryDate;
    if (salaryWish !== undefined) updates.salaryWish = salaryWish;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (photoBase64 !== undefined) updates.photoBase64 = photoBase64;
    const row = await db
      .update(applicantsTable)
      .set(updates)
      .where(eq(applicantsTable.id, id))
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.delete("/management/applicants/:id", async (req, res) => {
  try {
    await db.delete(applicantCommentsTable).where(eq(applicantCommentsTable.applicantId, Number(req.params.id)));
    await db.delete(applicantsTable).where(eq(applicantsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

// ─── APPLICANT COMMENTS ───────────────────────────────────

router.get("/management/applicants/:applicantId/comments", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(applicantCommentsTable)
      .where(eq(applicantCommentsTable.applicantId, Number(req.params.applicantId)))
      .orderBy(asc(applicantCommentsTable.createdAt));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.post("/management/applicants/:applicantId/comments", async (req, res) => {
  try {
    const applicantId = Number(req.params.applicantId);
    const { author, content } = req.body;
    const row = await db
      .insert(applicantCommentsTable)
      .values({ applicantId, author, content })
      .returning();
    res.json(row[0]);
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

router.delete("/management/applicants/comments/:id", async (req, res) => {
  try {
    await db.delete(applicantCommentsTable).where(eq(applicantCommentsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: "DB error" });
  }
});

export default router;
