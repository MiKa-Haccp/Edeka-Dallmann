import { Router, type IRouter } from "express";
import { db, responsibilitiesTable, marketInfoTable } from "@workspace/db";
import {
  ListResponsibilitiesParams,
  ListResponsibilitiesQueryParams,
  ListResponsibilitiesResponse,
  UpsertResponsibilitiesParams,
  UpsertResponsibilitiesBody,
  GetMarketInfoParams,
  GetMarketInfoQueryParams,
  UpsertMarketInfoParams,
  UpsertMarketInfoBody,
} from "@workspace/api-zod";
import { eq, and, asc, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/markets/:marketId/responsibilities", async (req, res) => {
  const params = ListResponsibilitiesParams.parse(req.params);
  const query = ListResponsibilitiesQueryParams.parse(req.query);
  const year = query.year || new Date().getFullYear();

  const results = await db
    .select()
    .from(responsibilitiesTable)
    .where(
      and(
        eq(responsibilitiesTable.marketId, params.marketId),
        eq(responsibilitiesTable.year, year)
      )
    )
    .orderBy(asc(responsibilitiesTable.sortOrder));

  const data = ListResponsibilitiesResponse.parse(results);
  res.json(data);
});

router.put("/markets/:marketId/responsibilities", async (req, res) => {
  const params = UpsertResponsibilitiesParams.parse(req.params);
  const body = UpsertResponsibilitiesBody.parse(req.body);

  await db
    .delete(responsibilitiesTable)
    .where(
      and(
        eq(responsibilitiesTable.marketId, params.marketId),
        eq(responsibilitiesTable.year, body.year)
      )
    );

  const inserted = await db
    .insert(responsibilitiesTable)
    .values(
      body.items.map((item: any) => ({
        marketId: params.marketId,
        department: item.department,
        responsibleName: item.responsibleName,
        responsiblePhone: item.responsiblePhone,
        deputyName: item.deputyName,
        deputyPhone: item.deputyPhone,
        sortOrder: item.sortOrder,
        year: body.year,
      }))
    )
    .returning();

  res.json(inserted);
});

router.get("/markets/:marketId/info", async (req, res) => {
  const params = GetMarketInfoParams.parse(req.params);
  const query = GetMarketInfoQueryParams.parse(req.query);
  const year = query.year || new Date().getFullYear();

  const results = await db
    .select()
    .from(marketInfoTable)
    .where(
      and(
        eq(marketInfoTable.marketId, params.marketId),
        eq(marketInfoTable.year, year)
      )
    );

  if (results.length === 0) {
    // Vorjahreswerte als Vorlage holen (market_number, street, plz_ort bleiben gleich)
    const previous = await db
      .select()
      .from(marketInfoTable)
      .where(eq(marketInfoTable.marketId, params.marketId))
      .orderBy(desc(marketInfoTable.year))
      .limit(1);
    const template = previous[0] ?? {};
    const [created] = await db
      .insert(marketInfoTable)
      .values({
        marketId: params.marketId,
        year,
        marketNumber: template.marketNumber ?? null,
        street: template.street ?? null,
        plzOrt: template.plzOrt ?? null,
      })
      .returning();
    res.json(created);
    return;
  }

  res.json(results[0]);
});

router.put("/markets/:marketId/info", async (req, res) => {
  const params = UpsertMarketInfoParams.parse(req.params);
  const body = UpsertMarketInfoBody.parse(req.body);

  const existing = await db
    .select()
    .from(marketInfoTable)
    .where(
      and(
        eq(marketInfoTable.marketId, params.marketId),
        eq(marketInfoTable.year, body.year)
      )
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(marketInfoTable)
      .set({
        marketNumber: body.marketNumber,
        street: body.street,
        plzOrt: body.plzOrt,
        updatedAt: new Date(),
      })
      .where(eq(marketInfoTable.id, existing[0].id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(marketInfoTable)
      .values({
        marketId: params.marketId,
        marketNumber: body.marketNumber,
        street: body.street,
        plzOrt: body.plzOrt,
        year: body.year,
      })
      .returning();
    res.json(created);
  }
});

export default router;
