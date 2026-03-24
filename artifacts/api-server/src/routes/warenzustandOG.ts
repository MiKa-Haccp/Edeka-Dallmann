import { Router, type IRouter } from "express";
import { db, warenzustandOGTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/warencheck-og", async (req, res) => {
  const marketId = Number(req.query.marketId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!marketId || !year || !month) {
    res.status(400).json({ error: "marketId, year, month required" });
    return;
  }
  const rows = await db
    .select()
    .from(warenzustandOGTable)
    .where(
      and(
        eq(warenzustandOGTable.marketId, marketId),
        eq(warenzustandOGTable.year, year),
        eq(warenzustandOGTable.month, month)
      )
    );
  res.json(rows);
});

const SLOT_START_HOURS: Record<string, number> = {
  s1: 6, s2: 9, s3: 12, s4: 15, s5: 18,
};

router.post("/warencheck-og", async (req, res) => {
  const { tenantId = 1, marketId, year, month, day, slot, kuerzel, userId } = req.body;
  if (!marketId || !year || !month || !day || !slot || !kuerzel) {
    res.status(400).json({ error: "Pflichtfelder fehlen" });
    return;
  }

  const now = new Date();
  const berlinParts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(berlinParts.find(p => p.type === type)?.value ?? 0);
  const nowYear  = get("year");
  const nowMonth = get("month");
  const nowDay   = get("day");
  const nowHour  = get("hour");

  const entryDate = new Date(year, month - 1, day);
  const today     = new Date(nowYear, nowMonth - 1, nowDay);

  if (entryDate > today) {
    res.status(400).json({ error: "Eintragungen fuer zukuenftige Tage sind nicht erlaubt" });
    return;
  }

  if (year === nowYear && month === nowMonth && day === nowDay) {
    const startHour = SLOT_START_HOURS[slot];
    if (startHour !== undefined && nowHour < startHour) {
      res.status(400).json({ error: "Diese Zeitphase hat noch nicht begonnen" });
      return;
    }
  }
  const existing = await db
    .select()
    .from(warenzustandOGTable)
    .where(
      and(
        eq(warenzustandOGTable.marketId, marketId),
        eq(warenzustandOGTable.year, year),
        eq(warenzustandOGTable.month, month),
        eq(warenzustandOGTable.day, day),
        eq(warenzustandOGTable.slot, slot)
      )
    );
  if (existing.length > 0) {
    res.status(409).json({ error: "Dieser Zeitslot wurde bereits abgezeichnet" });
    return;
  }
  const [row] = await db
    .insert(warenzustandOGTable)
    .values({ tenantId, marketId, year, month, day, slot, kuerzel, userId })
    .returning();
  res.json(row);
});

router.delete("/warencheck-og/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(warenzustandOGTable).where(eq(warenzustandOGTable.id, id));
  res.json({ ok: true });
});

export default router;
