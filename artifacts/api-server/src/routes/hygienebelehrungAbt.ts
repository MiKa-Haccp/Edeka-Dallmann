import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/hygienebelehrung-abt", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;
  const year  = req.query.year  ? Number(req.query.year)  : null;
  const month = req.query.month ? Number(req.query.month) : null;

  let sql = "SELECT * FROM hygienebelehrung_abt WHERE tenant_id=$1";
  const params: unknown[] = [tenantId];
  let idx = 2;

  if (marketId) { sql += ` AND market_id=$${idx++}`; params.push(marketId); }
  if (year)     { sql += ` AND EXTRACT(YEAR  FROM datum::date)=$${idx++}`; params.push(year); }
  if (month)    { sql += ` AND EXTRACT(MONTH FROM datum::date)=$${idx++}`; params.push(month); }

  sql += " ORDER BY datum DESC, created_at DESC";

  const result = await pool.query(sql, params);
  res.json(result.rows);
});

router.post("/hygienebelehrung-abt", async (req, res) => {
  const { tenantId = 1, marketId, name, firmaAbteilung, datum, unterschrift, eingetragenVon, kuerzel } = req.body;
  const r = await pool.query(
    `INSERT INTO hygienebelehrung_abt (tenant_id, market_id, name, firma_abteilung, datum, unterschrift, eingetragen_von, kuerzel)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenantId, marketId, name, firmaAbteilung, datum, unterschrift, eingetragenVon, kuerzel]
  );
  res.json(r.rows[0]);
});

router.delete("/hygienebelehrung-abt/:id", async (req, res) => {
  await pool.query("DELETE FROM hygienebelehrung_abt WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
