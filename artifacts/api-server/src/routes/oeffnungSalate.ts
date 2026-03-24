import { Router, type IRouter } from "express";
import { db, oeffnungSalateTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/oeffnung-salate", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(oeffnungSalateTable)
    .where(
      and(
        eq(oeffnungSalateTable.marketId, marketId),
        eq(oeffnungSalateTable.year, year),
        eq(oeffnungSalateTable.month, month)
      )
    );
  res.json(rows);
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

  const [row] = await db
    .insert(oeffnungSalateTable)
    .values({ tenantId, marketId, year, month, day, artikelBezeichnung, verbrauchsdatum: verbrauchsdatum || null, eigenherstellung: !!eigenherstellung, kuerzel, userId: userId || null })
    .returning();
  res.json(row);
});

router.delete("/oeffnung-salate/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(oeffnungSalateTable).where(eq(oeffnungSalateTable.id, id));
  res.json({ ok: true });
});

export default router;
