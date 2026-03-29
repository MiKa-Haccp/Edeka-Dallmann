import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/strecken-lieferanten", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  const { rows } = await pool.query(
    `SELECT id, market_id, tenant_id, name, ansprechpartner, telefon, info, kuerzel, sort_order, created_at, updated_at
     FROM strecken_lieferanten WHERE market_id=$1 AND tenant_id=$2 ORDER BY sort_order, name`,
    [marketId, tenantId]
  );
  res.json(rows);
});

router.post("/strecken-lieferanten", async (req, res) => {
  const { marketId, tenantId = 1, name, ansprechpartner, telefon, info, kuerzel, sortOrder = 99 } = req.body;
  if (!marketId || !name) return res.status(400).json({ error: "marketId and name required" });
  const { rows } = await pool.query(
    `INSERT INTO strecken_lieferanten (market_id, tenant_id, name, ansprechpartner, telefon, info, kuerzel, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [marketId, tenantId, name, ansprechpartner || null, telefon || null, info || null, kuerzel || null, sortOrder]
  );
  res.json(rows[0]);
});

router.put("/strecken-lieferanten/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ansprechpartner, telefon, info, kuerzel, sortOrder } = req.body;
  const { rows } = await pool.query(
    `UPDATE strecken_lieferanten SET name=$1, ansprechpartner=$2, telefon=$3, info=$4, kuerzel=$5, sort_order=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, ansprechpartner || null, telefon || null, info || null, kuerzel || null, sortOrder ?? 99, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/strecken-lieferanten/:id", async (req, res) => {
  await pool.query("DELETE FROM strecken_lieferanten WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
