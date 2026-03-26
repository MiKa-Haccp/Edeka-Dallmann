import { Router, type IRouter } from "express";
import { db, oeffnungSalateTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    marketId: r.market_id,
    year: r.year,
    month: r.month,
    day: r.day,
    artikelBezeichnung: r.artikel_bezeichnung,
    verbrauchsdatum: r.verbrauchsdatum,
    eigenherstellung: r.eigenherstellung,
    kuerzel: r.kuerzel,
    userId: r.user_id,
    createdAt: r.created_at,
    aufgebrauchtAm: r.aufgebraucht_am,
    aufgebrauchtKuerzel: r.aufgebraucht_kuerzel ?? null,
    aufgebrauchtUserId: r.aufgebraucht_user_id ?? null,
  };
}

router.get("/oeffnung-salate", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const { rows } = await pool.query(
    `SELECT * FROM oeffnung_salate WHERE market_id=$1 AND year=$2 AND month=$3 ORDER BY day, created_at`,
    [marketId, year, month]
  );
  res.json(rows.map(mapRow));
});

router.post("/oeffnung-salate", async (req, res) => {
  const { tenantId = 1, marketId, year, month, day, artikelBezeichnung, verbrauchsdatum, eigenherstellung, kuerzel, userId } = req.body;
  if (!marketId || !year || !month || !day || !artikelBezeichnung || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }
  const now = new Date();
  const berlinParts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(berlinParts.find(p => p.type === type)?.value ?? 0);
  const nowYear  = get("year");
  const nowMonth = get("month");
  const nowDay   = get("day");
  const entryDate = new Date(year, month - 1, day);
  const today     = new Date(nowYear, nowMonth - 1, nowDay);
  if (entryDate > today) {
    res.status(400).json({ error: "Eintragungen fuer zukuenftige Tage sind nicht erlaubt" });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO oeffnung_salate
       (tenant_id, market_id, year, month, day, artikel_bezeichnung, verbrauchsdatum, eigenherstellung, kuerzel, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [tenantId, marketId, year, month, day, artikelBezeichnung, verbrauchsdatum || null, !!eigenherstellung, kuerzel, userId || null]
  );
  res.json(mapRow(rows[0]));
});

router.patch("/oeffnung-salate/:id/aufgebraucht", async (req, res) => {
  const id = Number(req.params.id);
  const { kuerzel, userId } = req.body;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  await pool.query(
    `UPDATE oeffnung_salate SET aufgebraucht_am=$1, aufgebraucht_kuerzel=$2, aufgebraucht_user_id=$3 WHERE id=$4`,
    [today, kuerzel || null, userId || null, id]
  );
  res.json({ ok: true });
});

router.patch("/oeffnung-salate/:id/aufgebraucht-rueckgaengig", async (req, res) => {
  const id = Number(req.params.id);
  await pool.query(
    `UPDATE oeffnung_salate SET aufgebraucht_am=NULL, aufgebraucht_kuerzel=NULL, aufgebraucht_user_id=NULL WHERE id=$1`,
    [id]
  );
  res.json({ ok: true });
});

router.delete("/oeffnung-salate/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(oeffnungSalateTable).where(eq(oeffnungSalateTable.id, id));
  res.json({ ok: true });
});

export default router;
