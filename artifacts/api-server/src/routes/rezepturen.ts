import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /rezepturen/kategorien
router.get("/rezepturen/kategorien", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM rezeptur_kategorien ORDER BY sort_order, id`
  );
  res.json(rows);
});

// GET /rezepturen?kategorieId=
router.get("/rezepturen", async (req, res) => {
  const { kategorieId } = req.query;
  let q = `
    SELECT r.*, k.name AS kategorie_name
    FROM rezepturen r
    LEFT JOIN rezeptur_kategorien k ON k.id = r.kategorie_id
  `;
  const params: unknown[] = [];
  if (kategorieId) {
    q += ` WHERE r.kategorie_id = $1`;
    params.push(kategorieId);
  }
  q += ` ORDER BY r.sort_order, r.name`;
  const { rows } = await pool.query(q, params);
  res.json(rows);
});

// GET /rezepturen/:id
router.get("/rezepturen/:id", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, k.name AS kategorie_name
     FROM rezepturen r
     LEFT JOIN rezeptur_kategorien k ON k.id = r.kategorie_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rows.length) {
    res.status(404).json({ error: "Nicht gefunden" });
    return;
  }
  res.json(rows[0]);
});

// POST /rezepturen
router.post("/rezepturen", async (req, res) => {
  const {
    kategorieId, name, plu, naehrwerte, zutatenText, zutatenverzeichnis,
    allergene, allergeneSpuren, herstellungsablauf, bildDateiname,
    rezepturDatum, ersetztDatum, sortOrder
  } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO rezepturen
      (tenant_id, kategorie_id, name, plu, naehrwerte, zutaten_text, zutatenverzeichnis,
       allergene, allergene_spuren, herstellungsablauf, bild_dateiname, rezeptur_datum, ersetzt_datum, sort_order)
     VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      kategorieId || null, name, plu || null, naehrwerte || null, zutatenText || null,
      zutatenverzeichnis || null, allergene || null, allergeneSpuren || null,
      herstellungsablauf || null, bildDateiname || null,
      rezepturDatum || null, ersetztDatum || null, sortOrder ?? 0
    ]
  );
  res.json(rows[0]);
});

// PUT /rezepturen/:id
router.put("/rezepturen/:id", async (req, res) => {
  const {
    kategorieId, name, plu, naehrwerte, zutatenText, zutatenverzeichnis,
    allergene, allergeneSpuren, herstellungsablauf, bildDateiname,
    rezepturDatum, ersetztDatum, sortOrder
  } = req.body;
  const { rows } = await pool.query(
    `UPDATE rezepturen SET
       kategorie_id=$1, name=$2, plu=$3, naehrwerte=$4, zutaten_text=$5,
       zutatenverzeichnis=$6, allergene=$7, allergene_spuren=$8,
       herstellungsablauf=$9, bild_dateiname=$10, rezeptur_datum=$11,
       ersetzt_datum=$12, sort_order=$13
     WHERE id=$14 RETURNING *`,
    [
      kategorieId || null, name, plu || null, naehrwerte || null, zutatenText || null,
      zutatenverzeichnis || null, allergene || null, allergeneSpuren || null,
      herstellungsablauf || null, bildDateiname || null,
      rezepturDatum || null, ersetztDatum || null, sortOrder ?? 0,
      req.params.id
    ]
  );
  if (!rows.length) {
    res.status(404).json({ error: "Nicht gefunden" });
    return;
  }
  res.json(rows[0]);
});

// DELETE /rezepturen/:id
router.delete("/rezepturen/:id", async (req, res) => {
  await pool.query("DELETE FROM rezepturen WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
