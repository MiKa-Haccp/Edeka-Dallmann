import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

async function ensureLogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_reset_logs (
      id SERIAL PRIMARY KEY,
      admin_pin TEXT NOT NULL,
      admin_name TEXT,
      market_id INTEGER NOT NULL,
      market_name TEXT,
      cutoff_date DATE NOT NULL,
      categories TEXT[] NOT NULL,
      deleted_counts JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

ensureLogTable().catch(console.error);

router.post("/system-reset", async (req, res) => {
  const { adminPin, adminName, marketId, marketName, cutoffDate, categories } = req.body;

  if (!marketId || !cutoffDate || !categories || categories.length === 0) {
    return res.status(400).json({
      error: "marketId, cutoffDate und mindestens eine Kategorie sind erforderlich.",
    });
  }

  const deletedCounts: Record<string, number> = {};

  try {
    for (const category of categories as string[]) {
      switch (category) {
        case "hygiene": {
          const fe = await pool.query(
            `DELETE FROM form_entries WHERE instance_id IN (
               SELECT id FROM form_instances WHERE market_id=$1 AND created_at < $2
             )`,
            [marketId, cutoffDate]
          );
          const fi = await pool.query(
            `DELETE FROM form_instances WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const bb = await pool.query(
            `DELETE FROM betriebsbegehung WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const rt = await pool.query(
            `DELETE FROM reinigung_taeglich WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const kk = await pool.query(
            `DELETE FROM kaesetheke_kontrolle WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const os = await pool.query(
            `DELETE FROM oeffnung_salate WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const gq = await pool.query(
            `DELETE FROM gq_begehung WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const pe = await pool.query(
            `DELETE FROM probeentnahme WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const mr = await pool.query(
            `DELETE FROM metz_reinigung WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const kb = await pool.query(
            `DELETE FROM kontrollberichte WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const ef = await pool.query(
            `DELETE FROM eingefrorenes_fleisch WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          deletedCounts.hygiene =
            (fe.rowCount || 0) +
            (fi.rowCount || 0) +
            (bb.rowCount || 0) +
            (rt.rowCount || 0) +
            (kk.rowCount || 0) +
            (os.rowCount || 0) +
            (gq.rowCount || 0) +
            (pe.rowCount || 0) +
            (mr.rowCount || 0) +
            (kb.rowCount || 0) +
            (ef.rowCount || 0);
          break;
        }

        case "mhd": {
          const wm = await pool.query(
            `DELETE FROM ware_mhd_kontrollen WHERE market_id=$1 AND datum < $2`,
            [marketId, cutoffDate]
          );
          const wc = await pool.query(
            `DELETE FROM warencheck_og WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const wo = await pool.query(
            `DELETE FROM wareneingang_og WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const we = await pool.query(
            `DELETE FROM wareneingang_entries WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          deletedCounts.mhd =
            (wm.rowCount || 0) + (wc.rowCount || 0) + (wo.rowCount || 0) + (we.rowCount || 0);
          break;
        }

        case "todo": {
          const dc = await pool.query(
            `DELETE FROM todo_daily_completions WHERE market_id=$1 AND completed_date < $2`,
            [marketId, cutoffDate]
          );
          const at2 = await pool.query(
            `DELETE FROM todo_adhoc_tasks WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          deletedCounts.todo = (dc.rowCount || 0) + (at2.rowCount || 0);
          break;
        }

        case "kassen": {
          const ta = await pool.query(
            `DELETE FROM till_assignments WHERE market_id=$1 AND assignment_date < $2`,
            [marketId, cutoffDate]
          );
          deletedCounts.kassen = ta.rowCount || 0;
          break;
        }

        case "mitarbeiter": {
          const uma = await pool.query(
            `DELETE FROM user_market_assignments WHERE market_id=$1`,
            [marketId]
          );
          deletedCounts.mitarbeiter = uma.rowCount || 0;
          break;
        }

        case "zeugnisse": {
          const gz = await pool.query(
            `DELETE FROM gesundheitszeugnisse WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const ha = await pool.query(
            `DELETE FROM hygienebelehrung_abt WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const bz = await pool.query(
            `DELETE FROM bescheinigungen WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const av = await pool.query(
            `DELETE FROM anti_vektor_zertifikate WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          const as2 = await pool.query(
            `DELETE FROM arzneimittel_sachkunde WHERE market_id=$1 AND created_at < $2`,
            [marketId, cutoffDate]
          );
          deletedCounts.zeugnisse =
            (gz.rowCount || 0) +
            (ha.rowCount || 0) +
            (bz.rowCount || 0) +
            (av.rowCount || 0) +
            (as2.rowCount || 0);
          break;
        }

        default:
          break;
      }
    }

    await pool.query(
      `INSERT INTO system_reset_logs
         (admin_pin, admin_name, market_id, market_name, cutoff_date, categories, deleted_counts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        adminPin || "?",
        adminName || "Unbekannt",
        marketId,
        marketName || "?",
        cutoffDate,
        categories,
        JSON.stringify(deletedCounts),
      ]
    );

    res.json({ success: true, deletedCounts });
  } catch (err: any) {
    console.error("[system-reset]", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/system-reset/logs", async (req, res) => {
  const { marketId } = req.query;
  const params: any[] = [];
  let q = `SELECT * FROM system_reset_logs`;
  if (marketId) {
    q += ` WHERE market_id=$1`;
    params.push(marketId);
  }
  q += ` ORDER BY created_at DESC LIMIT 100`;
  try {
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
