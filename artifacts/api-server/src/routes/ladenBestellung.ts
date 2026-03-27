import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Gebiete ──────────────────────────────────────────────────────────────────

router.get("/laden-bestellgebiete", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  const { rows } = await pool.query(
    `SELECT * FROM laden_bestellgebiete WHERE market_id=$1 AND tenant_id=$2 ORDER BY sort_order, id`,
    [marketId, tenantId]
  );
  res.json(rows);
});

router.post("/laden-bestellgebiete", async (req, res) => {
  const { marketId, tenantId = 1, name, farbe = "#1a3a6b", x = 0, y = 0, w = 180, h = 100, sortOrder = 99 } = req.body;
  if (!marketId || !name) return res.status(400).json({ error: "marketId and name required" });
  const { rows } = await pool.query(
    `INSERT INTO laden_bestellgebiete (market_id, tenant_id, name, farbe, x, y, w, h, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [marketId, tenantId, name, farbe, x, y, w, h, sortOrder]
  );
  res.json(rows[0]);
});

router.put("/laden-bestellgebiete/:id", async (req, res) => {
  const { id } = req.params;
  const { name, farbe, x, y, w, h, sortOrder } = req.body;
  const { rows } = await pool.query(
    `UPDATE laden_bestellgebiete SET
       name=COALESCE($1,name), farbe=COALESCE($2,farbe),
       x=COALESCE($3,x), y=COALESCE($4,y),
       w=COALESCE($5,w), h=COALESCE($6,h),
       sort_order=COALESCE($7,sort_order)
     WHERE id=$8 RETURNING *`,
    [name, farbe, x, y, w, h, sortOrder, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/laden-bestellgebiete/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM laden_bestellungen WHERE gebiet_id=$1", [id]);
  await pool.query("DELETE FROM laden_bestellgebiete WHERE id=$1", [id]);
  res.json({ ok: true });
});

// ── Bestellungen ─────────────────────────────────────────────────────────────

router.get("/laden-bestellungen", async (req, res) => {
  const { marketId, tenantId = "1", datum } = req.query as Record<string, string>;
  if (!marketId || !datum) return res.status(400).json({ error: "marketId and datum required" });
  const { rows } = await pool.query(
    `SELECT * FROM laden_bestellungen WHERE market_id=$1 AND tenant_id=$2 AND datum=$3`,
    [marketId, tenantId, datum]
  );
  res.json(rows);
});

router.post("/laden-bestellungen", async (req, res) => {
  const { marketId, tenantId = 1, gebietId, datum, kuerzel, anmerkung } = req.body;
  if (!marketId || !gebietId || !datum) return res.status(400).json({ error: "marketId, gebietId and datum required" });
  await pool.query(
    `DELETE FROM laden_bestellungen WHERE market_id=$1 AND tenant_id=$2 AND gebiet_id=$3 AND datum=$4`,
    [marketId, tenantId, gebietId, datum]
  );
  const { rows } = await pool.query(
    `INSERT INTO laden_bestellungen (market_id, tenant_id, gebiet_id, datum, kuerzel, anmerkung)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [marketId, tenantId, gebietId, datum, kuerzel || null, anmerkung || null]
  );
  res.json(rows[0]);
});

router.delete("/laden-bestellungen/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM laden_bestellungen WHERE id=$1", [id]);
  res.json({ ok: true });
});

export default router;
