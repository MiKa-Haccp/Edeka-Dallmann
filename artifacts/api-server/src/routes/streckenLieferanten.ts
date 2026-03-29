import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/strecken-lieferanten", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  const { rows } = await pool.query(
    `SELECT id, market_id, tenant_id, name, ansprechpartner, telefon, info, kuerzel, wird_bestellt, aussendienst_bestellt, mindestbestellwert, sort_order, created_at, updated_at
     FROM strecken_lieferanten WHERE market_id=$1 AND tenant_id=$2 ORDER BY sort_order, name`,
    [marketId, tenantId]
  );
  res.json(rows);
});

router.post("/strecken-lieferanten", async (req, res) => {
  const { marketId, tenantId = 1, name, ansprechpartner, telefon, info, kuerzel, mindestbestellwert, sortOrder = 99 } = req.body;
  if (!marketId || !name) return res.status(400).json({ error: "marketId and name required" });
  const { rows } = await pool.query(
    `INSERT INTO strecken_lieferanten (market_id, tenant_id, name, ansprechpartner, telefon, info, kuerzel, mindestbestellwert, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [marketId, tenantId, name, ansprechpartner || null, telefon || null, info || null, kuerzel || null, mindestbestellwert ?? null, sortOrder]
  );
  res.json(rows[0]);
});

router.put("/strecken-lieferanten/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ansprechpartner, telefon, info, kuerzel, mindestbestellwert, sortOrder } = req.body;
  const { rows } = await pool.query(
    `UPDATE strecken_lieferanten SET name=$1, ansprechpartner=$2, telefon=$3, info=$4, kuerzel=$5, mindestbestellwert=$6, sort_order=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [name, ansprechpartner || null, telefon || null, info || null, kuerzel || null, mindestbestellwert ?? null, sortOrder ?? 99, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.patch("/strecken-lieferanten/:id/bestellt", async (req, res) => {
  const { id } = req.params;
  const { wirdBestellt } = req.body;
  const { rows } = await pool.query(
    `UPDATE strecken_lieferanten SET wird_bestellt=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [!!wirdBestellt, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.patch("/strecken-lieferanten/:id/aussendienst", async (req, res) => {
  const { id } = req.params;
  const { aussendienstBestellt } = req.body;
  const { rows } = await pool.query(
    `UPDATE strecken_lieferanten SET aussendienst_bestellt=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [!!aussendienstBestellt, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/strecken-lieferanten/:id", async (req, res) => {
  await pool.query("DELETE FROM strecken_lieferanten WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Bestellungen ───────────────────────────────────────────────────────────

router.get("/strecken-bestellungen", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  const { rows } = await pool.query(
    `SELECT b.id, b.lieferant_id, b.bestellt_am, b.mitarbeiter_kuerzel, b.notiz
     FROM strecken_bestellungen b
     WHERE b.market_id=$1 AND b.tenant_id=$2
     ORDER BY b.bestellt_am DESC
     LIMIT 200`,
    [marketId, tenantId]
  );
  res.json(rows);
});

router.post("/strecken-bestellungen", async (req, res) => {
  const { marketId, tenantId = 1, lieferantId, mitarbeiterKuerzel, notiz } = req.body;
  if (!marketId || !lieferantId || !mitarbeiterKuerzel) {
    return res.status(400).json({ error: "marketId, lieferantId and mitarbeiterKuerzel required" });
  }
  const { rows } = await pool.query(
    `INSERT INTO strecken_bestellungen (market_id, tenant_id, lieferant_id, mitarbeiter_kuerzel, notiz)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [marketId, tenantId, lieferantId, mitarbeiterKuerzel.trim(), notiz || null]
  );
  res.json(rows[0]);
});

router.delete("/strecken-bestellungen/:id", async (req, res) => {
  await pool.query("DELETE FROM strecken_bestellungen WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
