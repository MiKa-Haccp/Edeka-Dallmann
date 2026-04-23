import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

function rowToCamel(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    marketId: row.market_id,
    year: row.year,
    zertifikateDokument: row.zertifikate_dokument,
    zertifikateNotizen: row.zertifikate_notizen,
    pruefungenDokument: row.pruefungen_dokument,
    pruefungenNotizen: row.pruefungen_notizen,
    aktionsplanFoto: row.aktionsplan_foto,
    aktionsplanMassnahmen: row.aktionsplan_massnahmen,
    aktionsplanDatum: row.aktionsplan_datum,
    nachbesserungName: row.nachbesserung_name,
    nachbesserungDatum: row.nachbesserung_datum,
    nachbesserungUnterschrift: row.nachbesserung_unterschrift,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/tuev-jahresbericht", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const marketId = req.query.marketId ? Number(req.query.marketId) : null;

  try {
    let result;
    if (marketId) {
      result = await pool.query(
        `SELECT * FROM tuev_jahresbericht WHERE tenant_id=$1 AND year=$2 AND market_id=$3 LIMIT 1`,
        [tenantId, year, marketId]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM tuev_jahresbericht WHERE tenant_id=$1 AND year=$2 LIMIT 1`,
        [tenantId, year]
      );
    }
    res.json(rowToCamel(result.rows[0] || null));
  } catch (err: any) {
    console.error("[tuev GET]", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/tuev-jahresbericht", async (req, res) => {
  const {
    tenantId = 1,
    marketId = 1,
    year,
    zertifikateDokument,
    zertifikateNotizen,
    pruefungenDokument,
    pruefungenNotizen,
    aktionsplanFoto,
    aktionsplanMassnahmen,
    aktionsplanDatum,
    nachbesserungName,
    nachbesserungDatum,
    nachbesserungUnterschrift,
  } = req.body;

  if (!year) {
    return res.status(400).json({ error: "Jahr fehlt." });
  }

  const datumVal = aktionsplanDatum ? new Date(aktionsplanDatum) : null;

  try {
    const result = await pool.query(
      `INSERT INTO tuev_jahresbericht
         (tenant_id, market_id, year,
          zertifikate_dokument, zertifikate_notizen,
          pruefungen_dokument, pruefungen_notizen,
          aktionsplan_foto, aktionsplan_massnahmen, aktionsplan_datum,
          nachbesserung_name, nachbesserung_datum, nachbesserung_unterschrift,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
       ON CONFLICT (tenant_id, market_id, year) DO UPDATE SET
         zertifikate_dokument      = EXCLUDED.zertifikate_dokument,
         zertifikate_notizen       = EXCLUDED.zertifikate_notizen,
         pruefungen_dokument       = EXCLUDED.pruefungen_dokument,
         pruefungen_notizen        = EXCLUDED.pruefungen_notizen,
         aktionsplan_foto          = EXCLUDED.aktionsplan_foto,
         aktionsplan_massnahmen    = EXCLUDED.aktionsplan_massnahmen,
         aktionsplan_datum         = EXCLUDED.aktionsplan_datum,
         nachbesserung_name        = EXCLUDED.nachbesserung_name,
         nachbesserung_datum       = EXCLUDED.nachbesserung_datum,
         nachbesserung_unterschrift = EXCLUDED.nachbesserung_unterschrift,
         updated_at                = NOW()
       RETURNING *`,
      [
        tenantId, marketId, year,
        zertifikateDokument ?? null, zertifikateNotizen ?? null,
        pruefungenDokument ?? null, pruefungenNotizen ?? null,
        aktionsplanFoto ?? null, aktionsplanMassnahmen ?? null, datumVal,
        nachbesserungName ?? null, nachbesserungDatum ?? null, nachbesserungUnterschrift ?? null,
      ]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (err: any) {
    console.error("[tuev PUT]", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
