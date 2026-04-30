import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

async function validatePin(pin: string, tenantId: string = "1") {
  const { rows } = await pool.query(
    `SELECT id, name, first_name, last_name, initials FROM users
     WHERE pin=$1 AND tenant_id=$2 AND status='aktiv'`,
    [pin, tenantId]
  );
  if (!rows.length) return null;
  const u = rows[0];
  const name = u.name || `${u.first_name} ${u.last_name}`.trim();
  return { id: u.id, name, initials: u.initials };
}

// ── Standardaufgaben ────────────────────────────────────────────────────────

router.get("/todo/standard-tasks", async (req, res) => {
  const { marketId, tenantId = "1", weekday } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  let q = `SELECT * FROM todo_standard_tasks WHERE market_id=$1 AND tenant_id=$2`;
  const params: unknown[] = [marketId, tenantId];
  if (weekday) {
    // weekday=0 means "täglich" (every day) — always include those alongside the requested weekday
    q += ` AND (weekday=$3 OR weekday=0) AND is_active=true`;
    params.push(weekday);
  }
  q += ` ORDER BY CASE category WHEN 'tagesaufgaben' THEN 1 WHEN 'wochenaufgaben' THEN 2 WHEN 'aufgaben' THEN 3 WHEN 'bestellungen' THEN 4 WHEN 'lieferungen' THEN 5 ELSE 6 END, CASE priority WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END, title`;
  const { rows } = await pool.query(q, params);
  res.json(rows);
});

router.post("/todo/standard-tasks", async (req, res) => {
  const { marketId, tenantId = 1, title, description, weekday, priority = "mittel", photoData, category = "aufgaben" } = req.body;
  if (!marketId || !title || weekday === undefined || weekday === null) return res.status(400).json({ error: "marketId, title, weekday required" });
  const { rows } = await pool.query(
    `INSERT INTO todo_standard_tasks (market_id, tenant_id, title, description, weekday, priority, photo_data, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [marketId, tenantId, title, description || null, weekday, priority, photoData || null, category]
  );
  res.json(rows[0]);
});

router.put("/todo/standard-tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, weekday, priority, is_active, photoData, category = "aufgaben" } = req.body;
  const { rows } = await pool.query(
    `UPDATE todo_standard_tasks SET title=$1, description=$2, weekday=$3, priority=$4, is_active=$5, photo_data=$6, category=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [title, description || null, weekday, priority, is_active ?? true, photoData ?? null, category, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/todo/standard-tasks/:id", async (req, res) => {
  await pool.query("DELETE FROM todo_standard_tasks WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Tageserledigungen ────────────────────────────────────────────────────────

router.get("/todo/daily-completions", async (req, res) => {
  const { marketId, date } = req.query as Record<string, string>;
  if (!marketId || !date) return res.status(400).json({ error: "marketId and date required" });
  const { rows } = await pool.query(
    `SELECT * FROM todo_daily_completions WHERE market_id=$1 AND completed_date=$2`,
    [marketId, date]
  );
  res.json(rows);
});

router.post("/todo/daily-completions", async (req, res) => {
  const { taskId, marketId, date, pin, tenantId = "1", photoData } = req.body;
  if (!taskId || !marketId || !date || !pin) return res.status(400).json({ error: "taskId, marketId, date, pin required" });
  const user = await validatePin(pin, tenantId);
  if (!user) return res.status(401).json({ error: "Ungültige PIN" });
  const { rows } = await pool.query(
    `INSERT INTO todo_daily_completions (task_id, market_id, completed_date, completed_by_pin, completed_by_name, photo_data)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (task_id, completed_date) DO UPDATE SET completed_by_pin=$4, completed_by_name=$5, completed_at=NOW(), photo_data=COALESCE($6, todo_daily_completions.photo_data)
     RETURNING *`,
    [taskId, marketId, date, pin, user.name, photoData || null]
  );
  res.json(rows[0]);
});

router.patch("/todo/daily-completions/:taskId/:date/photo", async (req, res) => {
  const { taskId, date } = req.params;
  const { photoData } = req.body;
  const { rows } = await pool.query(
    `UPDATE todo_daily_completions SET photo_data=$1 WHERE task_id=$2 AND completed_date=$3 RETURNING *`,
    [photoData || null, taskId, date]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/todo/daily-completions/:taskId/:date", async (req, res) => {
  const { taskId, date } = req.params;
  await pool.query("DELETE FROM todo_daily_completions WHERE task_id=$1 AND completed_date=$2", [taskId, date]);
  res.json({ ok: true });
});

// ── Ad-hoc Aufgaben ──────────────────────────────────────────────────────────

router.get("/todo/adhoc-tasks", async (req, res) => {
  const { marketId, tenantId = "1", includeCompleted = "false" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  let q = `SELECT * FROM todo_adhoc_tasks WHERE market_id=$1 AND tenant_id=$2`;
  if (includeCompleted !== "true") q += ` AND is_completed=false`;
  q += ` ORDER BY CASE priority WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END, deadline NULLS LAST, created_at DESC`;
  const { rows } = await pool.query(q, [marketId, tenantId]);
  res.json(rows);
});

router.post("/todo/adhoc-tasks", async (req, res) => {
  const { marketId, tenantId = "1", title, description, priority = "mittel", deadline, photoData, pin } = req.body;
  if (!marketId || !title || !pin) return res.status(400).json({ error: "marketId, title, pin required" });
  const user = await validatePin(pin, tenantId);
  if (!user) return res.status(401).json({ error: "Ungültige PIN" });
  const notifyAt = deadline ? new Date(deadline) : null;
  const { rows } = await pool.query(
    `INSERT INTO todo_adhoc_tasks (market_id, tenant_id, title, description, priority, deadline, photo_data, created_by_pin, created_by_name, notify_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [marketId, tenantId, title, description || null, priority, deadline || null, photoData || null, pin, user.name, notifyAt]
  );
  res.json(rows[0]);
});

router.patch("/todo/adhoc-tasks/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { pin, tenantId = "1" } = req.body;
  if (!pin) return res.status(400).json({ error: "pin required" });
  const user = await validatePin(pin, tenantId);
  if (!user) return res.status(401).json({ error: "Ungültige PIN" });
  const { rows } = await pool.query(
    `UPDATE todo_adhoc_tasks SET is_completed=true, completed_by_pin=$1, completed_by_name=$2, completed_at=NOW(), updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [pin, user.name, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.patch("/todo/adhoc-tasks/:id/reopen", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `UPDATE todo_adhoc_tasks SET is_completed=false, completed_by_pin=NULL, completed_by_name=NULL, completed_at=NULL, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/todo/adhoc-tasks/:id", async (req, res) => {
  await pool.query("DELETE FROM todo_adhoc_tasks WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Kasseneinteilung ─────────────────────────────────────────────────────────

router.get("/todo/till-assignments", async (req, res) => {
  const { marketId, date } = req.query as Record<string, string>;
  if (!marketId || !date) return res.status(400).json({ error: "marketId and date required" });
  const { rows } = await pool.query(
    `SELECT * FROM till_assignments WHERE market_id=$1 AND assignment_date=$2 ORDER BY shift, till_number`,
    [marketId, date]
  );
  res.json(rows);
});

router.put("/todo/till-assignments", async (req, res) => {
  const { marketId, date, shift, tillNumber, userId, userName, notes, uhrzeit } = req.body;
  if (!marketId || !date || !shift || !tillNumber) return res.status(400).json({ error: "marketId, date, shift, tillNumber required" });
  const { rows } = await pool.query(
    `INSERT INTO till_assignments (market_id, assignment_date, shift, till_number, user_id, user_name, notes, uhrzeit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (market_id, assignment_date, shift, till_number)
     DO UPDATE SET user_id=$5, user_name=$6, notes=$7, uhrzeit=$8, updated_at=NOW()
     RETURNING *`,
    [marketId, date, shift, tillNumber, userId || null, userName || null, notes || null, uhrzeit || null]
  );
  res.json(rows[0]);
});

router.get("/todo/market-users", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  // Determine how many employees are explicitly assigned to this market.
  // Fallback: if fewer than 3 are assigned (initial setup not done yet),
  // show ALL active employees so the schedule is never empty.
  const countRes = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM user_market_assignments uma
     JOIN users u ON u.id = uma.user_id
     WHERE uma.market_id = $1 AND u.tenant_id = $2
       AND u.status = 'aktiv' AND u.role IN ('USER','MARKTLEITER')`,
    [marketId, tenantId]
  );
  const assignedCount = parseInt(countRes.rows[0].cnt, 10);

  let rows: any[];
  if (assignedCount >= 3) {
    // Proper assignments exist — show only assigned employees
    const r = await pool.query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.initials, u.role
       FROM users u
       JOIN user_market_assignments uma ON uma.user_id = u.id AND uma.market_id = $1
       WHERE u.tenant_id = $2 AND u.status = 'aktiv' AND u.role IN ('USER','MARKTLEITER')
       ORDER BY COALESCE(NULLIF(trim(u.name),''), trim(u.first_name||' '||u.last_name))`,
      [marketId, tenantId]
    );
    rows = r.rows;
  } else {
    // No/few assignments yet — show all active employees as fallback
    const r = await pool.query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.initials, u.role
       FROM users u
       WHERE u.tenant_id = $1 AND u.status = 'aktiv' AND u.role IN ('USER','MARKTLEITER')
       ORDER BY COALESCE(NULLIF(trim(u.name),''), trim(u.first_name||' '||u.last_name))`,
      [tenantId]
    );
    rows = r.rows;
  }
  res.json(rows);
});

router.post("/todo/validate-pin", async (req, res) => {
  const { pin, tenantId = "1" } = req.body;
  if (!pin) return res.status(400).json({ error: "pin required" });
  const user = await validatePin(pin, tenantId);
  if (!user) return res.status(401).json({ error: "Ungültige PIN" });
  res.json(user);
});

export default router;
