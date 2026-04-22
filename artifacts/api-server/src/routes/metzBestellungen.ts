import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Alle Bestellungen für Monat laden ─────────────────────────────────────────
router.get("/metz-bestellungen", async (req, res) => {
  const { tenantId = "1", marketId, year, month } = req.query as Record<string, string>;
  if (!year || !month) return res.status(400).json({ error: "year and month required" });

  const datumFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const datumTo   = `${year}-${String(month).padStart(2, "0")}-31`;

  let query = `
    SELECT * FROM metz_bestellungen
    WHERE tenant_id = $1 AND datum >= $2 AND datum <= $3
  `;
  const params: (string | number)[] = [tenantId, datumFrom, datumTo];

  if (marketId) {
    query += ` AND market_id = $${params.length + 1}`;
    params.push(marketId);
  }
  query += " ORDER BY datum, created_at";

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// ── Neue Bestellung erstellen ──────────────────────────────────────────────────
router.post("/metz-bestellungen", async (req, res) => {
  const {
    tenantId = 1, marketId, datum,
    kundeName, kundeTelefon, artikel, menge, notizen,
  } = req.body;

  if (!datum || !kundeName || !artikel) {
    return res.status(400).json({ error: "datum, kundeName, artikel required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO metz_bestellungen
     (tenant_id, market_id, datum, kunde_name, kunde_telefon, artikel, menge, notizen)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenantId, marketId ?? null, datum, kundeName, kundeTelefon ?? null, artikel, menge ?? null, notizen ?? null]
  );
  res.json(rows[0]);
});

// ── Als "Bestellt" abzeichnen ──────────────────────────────────────────────────
router.put("/metz-bestellungen/:id/bestellt", async (req, res) => {
  const { id } = req.params;
  const { kuerzel, userId } = req.body;
  if (!kuerzel) return res.status(400).json({ error: "kuerzel required" });

  const { rows } = await pool.query(
    `UPDATE metz_bestellungen
     SET bestellt_kuerzel=$1, bestellt_user_id=$2, bestellt_am=NOW()
     WHERE id=$3 RETURNING *`,
    [kuerzel, userId ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// ── Als "Abgeholt" abzeichnen ─────────────────────────────────────────────────
router.put("/metz-bestellungen/:id/abgeholt", async (req, res) => {
  const { id } = req.params;
  const { kuerzel, userId } = req.body;
  if (!kuerzel) return res.status(400).json({ error: "kuerzel required" });

  const { rows } = await pool.query(
    `UPDATE metz_bestellungen
     SET abgeholt_kuerzel=$1, abgeholt_user_id=$2, abgeholt_am=NOW()
     WHERE id=$3 RETURNING *`,
    [kuerzel, userId ?? null, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// ── Bestellung löschen ────────────────────────────────────────────────────────
router.delete("/metz-bestellungen/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM metz_bestellungen WHERE id=$1", [id]);
  res.json({ ok: true });
});

export default router;
