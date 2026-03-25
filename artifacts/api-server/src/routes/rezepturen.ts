import { Router } from "express";
import { pool } from "@workspace/db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirnameESM = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirnameESM, "../../../haccp-app/public/rezepturen");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-äöüÄÖÜß]/g, "_");
    const unique = `${Date.now()}_${base}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// POST /rezepturen/upload
router.post("/rezepturen/upload", upload.single("foto"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Keine Datei hochgeladen" });
    return;
  }
  res.json({ dateiname: req.file.filename });
});

// GET /rezepturen/kategorien
router.get("/rezepturen/kategorien", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM rezeptur_kategorien ORDER BY sort_order, id`
  );
  res.json(rows);
});

// POST /rezepturen/kategorien
router.post("/rezepturen/kategorien", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: "Name erforderlich" });
    return;
  }
  const maxSort = await pool.query(
    `SELECT COALESCE(MAX(sort_order),0)+10 AS s FROM rezeptur_kategorien`
  );
  const { rows } = await pool.query(
    `INSERT INTO rezeptur_kategorien (tenant_id, name, sort_order) VALUES (1,$1,$2) RETURNING *`,
    [name.trim(), maxSort.rows[0].s]
  );
  res.json(rows[0]);
});

// PUT /rezepturen/kategorien/:id
router.put("/rezepturen/kategorien/:id", async (req, res) => {
  const { name } = req.body;
  const { rows } = await pool.query(
    `UPDATE rezeptur_kategorien SET name=$1 WHERE id=$2 RETURNING *`,
    [name, req.params.id]
  );
  if (!rows.length) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  res.json(rows[0]);
});

// DELETE /rezepturen/kategorien/:id
router.delete("/rezepturen/kategorien/:id", async (req, res) => {
  await pool.query("DELETE FROM rezeptur_kategorien WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// GET /rezepturen
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
  if (!rows.length) { res.status(404).json({ error: "Nicht gefunden" }); return; }
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
  if (!rows.length) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  res.json(rows[0]);
});

// DELETE /rezepturen/:id
router.delete("/rezepturen/:id", async (req, res) => {
  await pool.query("DELETE FROM rezepturen WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
