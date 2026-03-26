import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { MONITORABLE_SECTIONS, TRIGGER_TYPES, runNotificationCheck } from "../services/notificationEngine";

const router: IRouter = Router();

router.get("/notifications/meta", (_req, res) => {
  res.json({ sections: MONITORABLE_SECTIONS, triggerTypes: TRIGGER_TYPES });
});

router.get("/notifications/rules", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const r = await pool.query(
    `SELECT * FROM notification_rules WHERE tenant_id = $1 ORDER BY id ASC`,
    [tenantId]
  );
  res.json(r.rows);
});

router.post("/notifications/rules", async (req, res) => {
  const { tenantId = 1, sectionKey, triggerType, triggerValue, notifyUserIds = [] } = req.body;
  if (!sectionKey || !triggerType) {
    res.status(400).json({ error: "sectionKey und triggerType sind Pflichtfelder." });
    return;
  }
  const r = await pool.query(
    `INSERT INTO notification_rules (tenant_id, section_key, trigger_type, trigger_value, notify_user_ids)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, sectionKey, triggerType, triggerValue, notifyUserIds]
  );
  res.json(r.rows[0]);
});

router.put("/notifications/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { sectionKey, triggerType, triggerValue, notifyUserIds, isActive } = req.body;
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (sectionKey    !== undefined) { sets.push(`section_key = $${idx++}`);      vals.push(sectionKey); }
  if (triggerType   !== undefined) { sets.push(`trigger_type = $${idx++}`);     vals.push(triggerType); }
  if (triggerValue  !== undefined) { sets.push(`trigger_value = $${idx++}`);    vals.push(triggerValue); }
  if (notifyUserIds !== undefined) { sets.push(`notify_user_ids = $${idx++}`);  vals.push(notifyUserIds); }
  if (isActive      !== undefined) { sets.push(`is_active = $${idx++}`);        vals.push(isActive); }
  if (sets.length === 0) { res.status(400).json({ error: "Keine Felder zum Aktualisieren." }); return; }
  vals.push(id);
  const r = await pool.query(`UPDATE notification_rules SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
  res.json(r.rows[0]);
});

router.delete("/notifications/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(`DELETE FROM notification_rules WHERE id = $1`, [id]);
  res.json({ success: true });
});

router.get("/notifications/channels", async (req, res) => {
  const r = await pool.query(
    `SELECT u.id, u.name, u.email, u.role,
            nc.channel_type, nc.telegram_chat_id, nc.email_override
     FROM users u
     LEFT JOIN notification_channels nc ON nc.user_id = u.id
     WHERE u.is_registered = TRUE
     ORDER BY u.name ASC`
  );
  res.json(r.rows);
});

router.put("/notifications/channels/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const { channelType, telegramChatId, emailOverride } = req.body;
  await pool.query(
    `INSERT INTO notification_channels (user_id, channel_type, telegram_chat_id, email_override)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       channel_type = EXCLUDED.channel_type,
       telegram_chat_id = EXCLUDED.telegram_chat_id,
       email_override = EXCLUDED.email_override`,
    [userId, channelType || "off", telegramChatId || null, emailOverride || null]
  );
  res.json({ success: true });
});

router.get("/notifications/log", async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const r = await pool.query(
    `SELECT nl.*, u.name as user_name, nr.section_key, nr.trigger_type
     FROM notification_log nl
     LEFT JOIN users u ON u.id = nl.user_id
     LEFT JOIN notification_rules nr ON nr.id = nl.rule_id
     ORDER BY nl.sent_at DESC LIMIT $1`,
    [limit]
  );
  res.json(r.rows);
});

router.post("/notifications/check-now", async (_req, res) => {
  try {
    const result = await runNotificationCheck();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
