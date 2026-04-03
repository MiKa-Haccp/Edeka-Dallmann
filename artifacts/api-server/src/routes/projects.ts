import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

async function sendProjectTelegram(message: string) {
  try {
    const settingsRes = await pool.query(`SELECT telegram_bot_token FROM email_settings LIMIT 1`);
    const token = process.env.TELEGRAM_BOT_TOKEN || settingsRes.rows[0]?.telegram_bot_token;
    if (!token) return;

    const usersRes = await pool.query(
      `SELECT nc.telegram_chat_id FROM notification_channels nc
       JOIN admin_users au ON nc.user_id = au.id
       WHERE nc.channel_type = 'telegram' AND nc.telegram_chat_id IS NOT NULL
       AND au.role IN ('SUPERADMIN','ADMIN','BEREICHSLEITUNG')`
    );
    for (const row of usersRes.rows) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: row.telegram_chat_id, text: message, parse_mode: "HTML" }),
      }).catch(() => {});
    }
  } catch {}
}

router.get("/projects", async (req, res) => {
  try {
    const { tenantId, marketId } = req.query;
    const tid = parseInt(String(tenantId || "1"), 10);
    let query = `SELECT p.*, m.name AS market_name FROM projects p LEFT JOIN markets m ON p.market_id = m.id WHERE p.tenant_id = $1`;
    const params: any[] = [tid];
    if (marketId) {
      query += ` AND (p.market_id = $2 OR p.market_id IS NULL)`;
      params.push(parseInt(String(marketId), 10));
    }
    query += ` ORDER BY p.updated_at DESC`;
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, m.name AS market_name FROM projects p LEFT JOIN markets m ON p.market_id = m.id WHERE p.id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/projects", async (req, res) => {
  try {
    const { tenantId = 1, marketId, name, description, status = "geplant", color = "blue", createdByName } = req.body;
    const r = await pool.query(
      `INSERT INTO projects (tenant_id, market_id, name, description, status, color, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tenantId, marketId || null, name, description || null, status, color, createdByName || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const { name, description, status, color, marketId } = req.body;
    const prev = await pool.query(`SELECT status, name FROM projects WHERE id = $1`, [req.params.id]);
    const prevStatus = prev.rows[0]?.status;
    const projName = prev.rows[0]?.name;

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (name !== undefined) { sets.push(`name=$${idx++}`); vals.push(name); }
    if (description !== undefined) { sets.push(`description=$${idx++}`); vals.push(description); }
    if (status !== undefined) { sets.push(`status=$${idx++}`); vals.push(status); }
    if (color !== undefined) { sets.push(`color=$${idx++}`); vals.push(color); }
    if (marketId !== undefined) { sets.push(`market_id=$${idx++}`); vals.push(marketId || null); }
    sets.push(`updated_at=NOW()`);
    vals.push(req.params.id);

    const r = await pool.query(
      `UPDATE projects SET ${sets.join(",")} WHERE id=$${idx} RETURNING *`,
      vals
    );

    if (status && status !== prevStatus) {
      const STATUS_LABELS: Record<string, string> = {
        geplant: "Geplant", in_arbeit: "In Arbeit",
        freigabe_erforderlich: "Freigabe erforderlich", abgeschlossen: "Abgeschlossen",
      };
      await sendProjectTelegram(
        `📋 <b>Projekt-Hub</b>\nProjekt <b>${projName}</b> hat neuen Status:\n➡️ ${STATUS_LABELS[status] || status}`
      );
    }

    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM projects WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/projects/:id/log", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM project_log_entries WHERE project_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/projects/:id/log", async (req, res) => {
  try {
    const { entryType = "note", content, beteiligtPartei, createdByName } = req.body;
    const r = await pool.query(
      `INSERT INTO project_log_entries (project_id, entry_type, content, beteiligte_partei, created_by_name)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, entryType, content, beteiligtPartei || null, createdByName || null]
    );
    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/projects/:id/log/:logId", async (req, res) => {
  try {
    await pool.query(`DELETE FROM project_log_entries WHERE id=$1 AND project_id=$2`, [req.params.logId, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/projects/:id/tasks", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM project_tasks WHERE project_id=$1 ORDER BY order_index ASC, id ASC`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/projects/:id/tasks", async (req, res) => {
  try {
    const { title, description, dependsOnTaskId, orderIndex = 0, requiresApproval = false, approvalNote, assignedTo } = req.body;
    const r = await pool.query(
      `INSERT INTO project_tasks (project_id, title, description, status, depends_on_task_id, order_index, requires_approval, approval_note, assigned_to)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, title, description || null, dependsOnTaskId || null, orderIndex, requiresApproval, approvalNote || null, assignedTo || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.put("/projects/:id/tasks/:taskId", async (req, res) => {
  try {
    const { status, completedByName, title, description, assignedTo, requiresApproval, approvalNote } = req.body;
    const projRes = await pool.query(`SELECT name FROM projects WHERE id=$1`, [req.params.id]);
    const projName = projRes.rows[0]?.name;

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (title !== undefined) { sets.push(`title=$${idx++}`); vals.push(title); }
    if (description !== undefined) { sets.push(`description=$${idx++}`); vals.push(description); }
    if (assignedTo !== undefined) { sets.push(`assigned_to=$${idx++}`); vals.push(assignedTo || null); }
    if (requiresApproval !== undefined) { sets.push(`requires_approval=$${idx++}`); vals.push(requiresApproval); }
    if (approvalNote !== undefined) { sets.push(`approval_note=$${idx++}`); vals.push(approvalNote || null); }

    if (status !== undefined) {
      sets.push(`status=$${idx++}`); vals.push(status);
      if (status === "done") {
        sets.push(`completed_at=NOW()`);
        sets.push(`completed_by_name=$${idx++}`); vals.push(completedByName || null);
      } else {
        sets.push(`completed_at=NULL`);
        sets.push(`completed_by_name=NULL`);
      }
    }

    vals.push(req.params.taskId, req.params.id);
    const r = await pool.query(
      `UPDATE project_tasks SET ${sets.join(",")} WHERE id=$${idx} AND project_id=$${idx + 1} RETURNING *`,
      vals
    );

    const task = r.rows[0];
    if (task && status === "done" && task.requires_approval) {
      await sendProjectTelegram(
        `✅ <b>Projekt-Hub – Freigabe erforderlich</b>\nProjekt: <b>${projName}</b>\nAufgabe <b>"${task.title}"</b> erledigt – Ihre Freigabe wird benötigt!\n${task.approval_note ? `📝 ${task.approval_note}` : ""}`
      );
    }

    if (task && status === "done") {
      const nextRes = await pool.query(
        `SELECT * FROM project_tasks WHERE project_id=$1 AND depends_on_task_id=$2 AND status='pending'`,
        [req.params.id, task.id]
      );
      for (const next of nextRes.rows) {
        await pool.query(`UPDATE project_tasks SET status='active' WHERE id=$1`, [next.id]);
      }
    }

    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json(task);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/projects/:id/tasks/:taskId", async (req, res) => {
  try {
    await pool.query(`DELETE FROM project_tasks WHERE id=$1 AND project_id=$2`, [req.params.taskId, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
