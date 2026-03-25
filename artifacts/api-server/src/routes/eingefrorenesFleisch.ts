import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /eingefrorenes-fleisch?marketId=&year=
router.get("/eingefrorenes-fleisch", async (req, res) => {
  const { marketId, year } = req.query;
  if (!marketId || !year) {
    res.status(400).json({ error: "marketId, year required" });
    return;
  }
  const { rows } = await pool.query(
    `SELECT * FROM eingefrorenes_fleisch WHERE market_id=$1 AND year=$2 ORDER BY eingefroren_am NULLS LAST, id`,
    [marketId, year]
  );
  res.json(rows);
});

// POST /eingefrorenes-fleisch
router.post("/eingefrorenes-fleisch", async (req, res) => {
  const { marketId, year, artikel, vkp, mengeKg, eingefrorenAm, eingefrorenDurch, kuerzel, userId } = req.body;
  if (!marketId || !year || !artikel || !kuerzel) {
    res.status(400).json({ error: "marketId, year, artikel, kuerzel required" });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO eingefrorenes_fleisch
      (tenant_id, market_id, year, artikel, vkp, menge_kg, eingefroren_am, eingefroren_durch, kuerzel, user_id)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [marketId, year, artikel, vkp || null, mengeKg || null,
     eingefrorenAm || null, eingefrorenDurch || null, kuerzel, userId || null]
  );
  res.json(rows[0]);
});

// PATCH /eingefrorenes-fleisch/:id  (Entnahmen + Aufgebraucht aktualisieren)
router.patch("/eingefrorenes-fleisch/:id", async (req, res) => {
  const { entnahme1Kg, entnahme2Kg, entnahme3Kg, entnahme4Kg, aufgebrauchtAm } = req.body;
  const { rows } = await pool.query(
    `UPDATE eingefrorenes_fleisch SET
       entnahme_1_kg = COALESCE($2, entnahme_1_kg),
       entnahme_2_kg = COALESCE($3, entnahme_2_kg),
       entnahme_3_kg = COALESCE($4, entnahme_3_kg),
       entnahme_4_kg = COALESCE($5, entnahme_4_kg),
       aufgebraucht_am = COALESCE($6, aufgebraucht_am)
     WHERE id=$1 RETURNING *`,
    [req.params.id, entnahme1Kg || null, entnahme2Kg || null,
     entnahme3Kg || null, entnahme4Kg || null, aufgebrauchtAm || null]
  );
  res.json(rows[0]);
});

// DELETE /eingefrorenes-fleisch/:id
router.delete("/eingefrorenes-fleisch/:id", async (req, res) => {
  await pool.query("DELETE FROM eingefrorenes_fleisch WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
