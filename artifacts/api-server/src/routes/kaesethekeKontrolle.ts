import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

function getBerlinDay() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

// GET: alle Eintraege eines Monats fuer einen Markt
router.get("/kaesetheke-kontrolle", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const { rows } = await pool.query(
    `SELECT * FROM kaesetheke_kontrolle
     WHERE market_id = $1 AND year = $2 AND month = $3
     ORDER BY kontrolle_art, day, id`,
    [marketId, year, month]
  );
  res.json(rows);
});

// POST: neuen Eintrag speichern
router.post("/kaesetheke-kontrolle", async (req, res) => {
  const {
    tenantId = 1, marketId, year, month, day,
    kontrolleArt, produkt, temperatur, luftfeuchtigkeit,
    kernTempGaren, tempHeisshalten, massnahme, kuerzel, userId,
  } = req.body;

  if (!marketId || !year || !month || !day || !kontrolleArt || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }

  const { y, m, d } = getBerlinDay();
  const entryDate = new Date(year, month - 1, day);
  const today = new Date(y, m - 1, d);
  if (entryDate > today) {
    res.status(400).json({ error: "Eintragungen fuer zukuenftige Tage sind nicht erlaubt" });
    return;
  }

  const { defekt = false } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO kaesetheke_kontrolle
      (tenant_id, market_id, year, month, day, kontrolle_art,
       produkt, temperatur, luftfeuchtigkeit, kern_temp_garen,
       temp_heisshalten, massnahme, kuerzel, user_id, defekt)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      tenantId, marketId, year, month, day, kontrolleArt,
      produkt || null, temperatur || null, luftfeuchtigkeit || null,
      kernTempGaren || null, tempHeisshalten || null,
      massnahme || null, kuerzel, userId || null, !!defekt,
    ]
  );
  res.json(rows[0]);
});

// PATCH: Eintrag aktualisieren (Bearbeitung mit PIN)
router.patch("/kaesetheke-kontrolle/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { temperatur, luftfeuchtigkeit, kernTempGaren, tempHeisshalten, massnahme, kuerzel, userId, defekt } = req.body;
  if (!kuerzel) { res.status(400).json({ error: "kuerzel required" }); return; }
  const { rows } = await pool.query(
    `UPDATE kaesetheke_kontrolle
     SET temperatur=$1, luftfeuchtigkeit=$2, kern_temp_garen=$3, temp_heisshalten=$4,
         massnahme=$5, kuerzel=$6, user_id=$7, defekt=$8
     WHERE id=$9 RETURNING *`,
    [temperatur||null, luftfeuchtigkeit||null, kernTempGaren||null, tempHeisshalten||null,
     massnahme||null, kuerzel, userId||null, !!defekt, id]
  );
  if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
  res.json(rows[0]);
});

// DELETE
router.delete("/kaesetheke-kontrolle/:id", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query("DELETE FROM kaesetheke_kontrolle WHERE id = $1", [id]);
  res.json({ ok: true });
});

export default router;
