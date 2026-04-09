import { Router } from "express";
import { pool } from "@workspace/db";
import nodemailer from "nodemailer";

const router = Router();

// ── Spalten ergänzen (einmalig beim Start, idempotent) ──────────────────────
pool.query(`
  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR DEFAULT 'pending';
  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS dispatch_to VARCHAR;
  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS dispatched_by_name VARCHAR;
`).catch(console.error);

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

async function sendProjectTelegram(message: string) {
  try {
    const settingsRes = await pool.query(`SELECT telegram_bot_token FROM email_settings LIMIT 1`);
    const token = process.env.TELEGRAM_BOT_TOKEN || settingsRes.rows[0]?.telegram_bot_token;
    if (!token) return;

    const usersRes = await pool.query(
      `SELECT nc.telegram_chat_id FROM notification_channels nc
       JOIN users au ON nc.user_id = au.id
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

async function sendDispatchEmail(dispatchTo: string, taskTitle: string, projectName: string, approvalNote: string | null, dispatchedByName: string | null) {
  try {
    const settingsRes = await pool.query(`SELECT smtp_user, smtp_pass, smtp_host, smtp_port, default_recipient FROM email_settings LIMIT 1`);
    const s = settingsRes.rows[0];
    if (!s?.smtp_user || !s?.smtp_pass) return;

    // Empfänger per Name oder Rolle ermitteln
    let recipientRes;
    if (dispatchTo === "sonja") {
      recipientRes = await pool.query(`SELECT email, name FROM users WHERE LOWER(name) LIKE '%sonja%' AND email IS NOT NULL LIMIT 1`);
    } else {
      recipientRes = await pool.query(`SELECT email, name FROM users WHERE role = 'MARKTLEITER' AND email IS NOT NULL ORDER BY id LIMIT 1`);
    }

    const recipientEmail = recipientRes.rows[0]?.email || s.default_recipient;
    if (!recipientEmail) return;

    const recipientLabel = dispatchTo === "sonja" ? "Sonja (Sekretariat)" : "Kai (Marktleiter)";
    const transport = nodemailer.createTransport({
      host: s.smtp_host || "smtp.ionos.de",
      port: Number(s.smtp_port) || 587,
      secure: false,
      auth: { user: s.smtp_user, pass: s.smtp_pass },
    });

    await transport.sendMail({
      from: s.smtp_user,
      to: recipientEmail,
      subject: `MiKa – Freigabe erforderlich: ${taskTitle}`,
      html: `
        <h2 style="color:#1a3a6b">MiKa – Freigabe erforderlich</h2>
        <table style="font-family:sans-serif;font-size:14px">
          <tr><td style="padding:4px 12px 4px 0;color:#666">Projekt:</td><td><strong>${projectName}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Aufgabe:</td><td><strong>${taskTitle}</strong></td></tr>
          ${approvalNote ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Hinweis:</td><td>${approvalNote}</td></tr>` : ""}
          <tr><td style="padding:4px 12px 4px 0;color:#666">Weitergeleitet von:</td><td>${dispatchedByName || "Unbekannt"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Empfänger:</td><td>${recipientLabel}</td></tr>
        </table>
        <p style="margin-top:16px;color:#888;font-size:12px">Diese Nachricht wurde automatisch von MiKa (HACCP-Management) gesendet.</p>
      `,
    });
  } catch (err) {
    console.error("[ProjectHub] E-Mail-Versand fehlgeschlagen:", err);
  }
}

// ── Routen ───────────────────────────────────────────────────────────────────

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

// ── Michis Posteingang ───────────────────────────────────────────────────────
router.get("/projects/inbox", async (req, res) => {
  try {
    const tid = parseInt(String(req.query.tenantId || "1"), 10);
    const r = await pool.query(`
      SELECT pt.*, p.name AS project_name, p.color AS project_color, m.name AS market_name
      FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      LEFT JOIN markets m ON p.market_id = m.id
      WHERE p.tenant_id = $1
        AND pt.requires_approval = true
        AND pt.dispatch_status = 'pending'
      ORDER BY pt.id DESC
    `, [tid]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/projects/inbox/count", async (req, res) => {
  try {
    const tid = parseInt(String(req.query.tenantId || "1"), 10);
    const r = await pool.query(`
      SELECT COUNT(*) AS count
      FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE p.tenant_id = $1 AND pt.requires_approval = true AND pt.dispatch_status = 'pending'
    `, [tid]);
    res.json({ count: Number(r.rows[0].count) });
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
      `INSERT INTO project_tasks (project_id, title, description, status, depends_on_task_id, order_index, requires_approval, approval_note, assigned_to, dispatch_status)
       VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,'pending') RETURNING *`,
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

// ── Freigabe-Versand ─────────────────────────────────────────────────────────
router.post("/projects/:id/tasks/:taskId/dispatch", async (req, res) => {
  try {
    const { dispatchTo, dispatchedByName } = req.body;
    if (!["sonja", "kai"].includes(dispatchTo)) {
      return res.status(400).json({ error: "Ungültiger Empfänger (sonja oder kai)" });
    }

    const r = await pool.query(`
      UPDATE project_tasks
      SET dispatch_status = 'sent', dispatch_to = $1, dispatched_at = NOW(), dispatched_by_name = $2
      WHERE id = $3 AND project_id = $4
      RETURNING *
    `, [dispatchTo, dispatchedByName || null, req.params.taskId, req.params.id]);

    const task = r.rows[0];
    if (!task) return res.status(404).json({ error: "Aufgabe nicht gefunden" });

    const projRes = await pool.query(`SELECT name FROM projects WHERE id=$1`, [req.params.id]);
    const projName = projRes.rows[0]?.name || "Unbekanntes Projekt";
    const recipientLabel = dispatchTo === "sonja" ? "Sonja (Sekretariat)" : "Kai (Marktleiter)";

    await sendProjectTelegram(
      `📬 <b>Projekt-Hub – Freigabe weitergeleitet</b>\n` +
      `Projekt: <b>${projName}</b>\n` +
      `Aufgabe: <b>${task.title}</b>\n` +
      `Empfänger: ➡️ ${recipientLabel}\n` +
      `Von: ${dispatchedByName || "Unbekannt"}\n` +
      (task.approval_note ? `📝 ${task.approval_note}` : "")
    );

    await sendDispatchEmail(dispatchTo, task.title, projName, task.approval_note, dispatchedByName);

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
