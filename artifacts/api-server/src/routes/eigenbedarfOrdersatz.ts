import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/eigenbedarf-ordersatz", async (req, res) => {
  const { marketId, tenantId = "1" } = req.query as Record<string, string>;
  if (!marketId) return res.status(400).json({ error: "marketId required" });
  const { rows } = await pool.query(
    `SELECT id, market_id, tenant_id, seite_nr, titel, datei_typ, datei_name, erstellt_am
     FROM eigenbedarf_ordersatz WHERE market_id=$1 AND tenant_id=$2 ORDER BY seite_nr, id`,
    [marketId, tenantId]
  );
  res.json(rows);
});

router.get("/eigenbedarf-ordersatz/:id/data", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT datei_data, datei_typ, datei_name FROM eigenbedarf_ordersatz WHERE id=$1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.post("/eigenbedarf-ordersatz", async (req, res) => {
  const { marketId, tenantId = 1, seiteNr, titel, dateiTyp, dateiName, dateiData } = req.body;
  if (!marketId || !dateiData) return res.status(400).json({ error: "marketId and dateiData required" });
  const { rows } = await pool.query(
    `INSERT INTO eigenbedarf_ordersatz (market_id, tenant_id, seite_nr, titel, datei_typ, datei_name, datei_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, market_id, tenant_id, seite_nr, titel, datei_typ, datei_name, erstellt_am`,
    [marketId, tenantId, seiteNr || 1, titel || null, dateiTyp || null, dateiName || null, dateiData]
  );
  res.json(rows[0]);
});

router.put("/eigenbedarf-ordersatz/:id", async (req, res) => {
  const { id } = req.params;
  const { seiteNr, titel } = req.body;
  const { rows } = await pool.query(
    `UPDATE eigenbedarf_ordersatz SET
       seite_nr=COALESCE($1,seite_nr),
       titel=COALESCE($2,titel)
     WHERE id=$3 RETURNING id, seite_nr, titel, datei_typ, datei_name, erstellt_am`,
    [seiteNr || null, titel || null, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.delete("/eigenbedarf-ordersatz/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM eigenbedarf_ordersatz WHERE id=$1", [id]);
  res.json({ ok: true });
});

export default router;
