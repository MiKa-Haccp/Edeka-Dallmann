import { Router, type IRouter } from "express";
import { db, trainingTopicsTable, trainingSessionsTable, trainingSessionTopicsTable, trainingAttendancesTable, usersTable } from "@workspace/db";
import { eq, and, asc, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/training-topics", async (_req, res) => {
  const topics = await db
    .select()
    .from(trainingTopicsTable)
    .where(eq(trainingTopicsTable.isDefault, true))
    .orderBy(asc(trainingTopicsTable.sortOrder));

  res.json(topics);
});

router.get("/markets/:marketId/training-sessions", async (req, res) => {
  const marketId = parseInt(req.params.marketId);
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

  const sessions = await db
    .select({
      id: trainingSessionsTable.id,
      tenantId: trainingSessionsTable.tenantId,
      marketId: trainingSessionsTable.marketId,
      sessionDate: trainingSessionsTable.sessionDate,
      trainerId: trainingSessionsTable.trainerId,
      trainerName: trainingSessionsTable.trainerName,
      notes: trainingSessionsTable.notes,
      createdAt: trainingSessionsTable.createdAt,
    })
    .from(trainingSessionsTable)
    .where(
      and(
        eq(trainingSessionsTable.marketId, marketId),
        sql`EXTRACT(YEAR FROM ${trainingSessionsTable.sessionDate}::date) = ${year}`
      )
    )
    .orderBy(desc(trainingSessionsTable.sessionDate));

  const sessionsWithCounts = await Promise.all(
    sessions.map(async (session) => {
      const [topicCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(trainingSessionTopicsTable)
        .where(eq(trainingSessionTopicsTable.sessionId, session.id));
      const [attendanceCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(trainingAttendancesTable)
        .where(eq(trainingAttendancesTable.sessionId, session.id));
      return {
        ...session,
        topicCount: topicCount?.count ?? 0,
        attendanceCount: attendanceCount?.count ?? 0,
      };
    })
  );

  res.json(sessionsWithCounts);
});

router.post("/markets/:marketId/training-sessions", async (req, res) => {
  const marketId = parseInt(req.params.marketId);
  const { tenantId, sessionDate, trainerId, trainerName, notes, topicIds, customTopicTitle } = req.body;

  const [session] = await db
    .insert(trainingSessionsTable)
    .values({
      tenantId,
      marketId,
      sessionDate,
      trainerId: trainerId || null,
      trainerName: trainerName || null,
      notes: notes || null,
    })
    .returning();

  if (topicIds && topicIds.length > 0) {
    await db.insert(trainingSessionTopicsTable).values(
      topicIds.map((topicId: number) => ({
        sessionId: session.id,
        topicId,
        checked: false,
      }))
    );
  }

  if (customTopicTitle) {
    const [customTopic] = await db
      .insert(trainingTopicsTable)
      .values({
        title: customTopicTitle,
        isDefault: false,
        sortOrder: 99,
      })
      .returning();

    await db.insert(trainingSessionTopicsTable).values({
      sessionId: session.id,
      topicId: customTopic.id,
      customTitle: customTopicTitle,
      checked: false,
    });
  }

  res.status(201).json(session);
});

router.get("/training-sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const [session] = await db
    .select()
    .from(trainingSessionsTable)
    .where(eq(trainingSessionsTable.id, sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const sessionTopics = await db
    .select({
      id: trainingSessionTopicsTable.id,
      topicId: trainingSessionTopicsTable.topicId,
      customTitle: trainingSessionTopicsTable.customTitle,
      checked: trainingSessionTopicsTable.checked,
      title: trainingTopicsTable.title,
      responsible: trainingTopicsTable.responsible,
      trainingMaterial: trainingTopicsTable.trainingMaterial,
    })
    .from(trainingSessionTopicsTable)
    .innerJoin(trainingTopicsTable, eq(trainingSessionTopicsTable.topicId, trainingTopicsTable.id))
    .where(eq(trainingSessionTopicsTable.sessionId, sessionId))
    .orderBy(asc(trainingTopicsTable.sortOrder));

  const attendances = await db
    .select({
      id: trainingAttendancesTable.id,
      sessionId: trainingAttendancesTable.sessionId,
      userId: trainingAttendancesTable.userId,
      initials: trainingAttendancesTable.initials,
      confirmedAt: trainingAttendancesTable.confirmedAt,
      userName: usersTable.name,
    })
    .from(trainingAttendancesTable)
    .innerJoin(usersTable, eq(trainingAttendancesTable.userId, usersTable.id))
    .where(eq(trainingAttendancesTable.sessionId, sessionId))
    .orderBy(asc(trainingAttendancesTable.confirmedAt));

  res.json({
    ...session,
    topics: sessionTopics.map((t) => ({
      id: t.id,
      topicId: t.topicId,
      title: t.customTitle || t.title,
      customTitle: t.customTitle,
      responsible: t.responsible,
      trainingMaterial: t.trainingMaterial,
      checked: t.checked,
    })),
    attendances,
  });
});

router.put("/training-sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { sessionDate, trainerId, trainerName, notes, topics } = req.body;

  await db
    .update(trainingSessionsTable)
    .set({
      ...(sessionDate && { sessionDate }),
      ...(trainerId !== undefined && { trainerId: trainerId || null }),
      ...(trainerName !== undefined && { trainerName: trainerName || null }),
      ...(notes !== undefined && { notes: notes || null }),
      updatedAt: new Date(),
    })
    .where(eq(trainingSessionsTable.id, sessionId));

  if (topics && Array.isArray(topics)) {
    for (const topic of topics) {
      await db
        .update(trainingSessionTopicsTable)
        .set({
          checked: topic.checked,
          ...(topic.customTitle !== undefined && { customTitle: topic.customTitle }),
        })
        .where(
          and(
            eq(trainingSessionTopicsTable.sessionId, sessionId),
            eq(trainingSessionTopicsTable.topicId, topic.topicId)
          )
        );
    }
  }

  const [session] = await db
    .select()
    .from(trainingSessionsTable)
    .where(eq(trainingSessionsTable.id, sessionId));

  const sessionTopics = await db
    .select({
      id: trainingSessionTopicsTable.id,
      topicId: trainingSessionTopicsTable.topicId,
      customTitle: trainingSessionTopicsTable.customTitle,
      checked: trainingSessionTopicsTable.checked,
      title: trainingTopicsTable.title,
      responsible: trainingTopicsTable.responsible,
      trainingMaterial: trainingTopicsTable.trainingMaterial,
    })
    .from(trainingSessionTopicsTable)
    .innerJoin(trainingTopicsTable, eq(trainingSessionTopicsTable.topicId, trainingTopicsTable.id))
    .where(eq(trainingSessionTopicsTable.sessionId, sessionId))
    .orderBy(asc(trainingTopicsTable.sortOrder));

  const attendances = await db
    .select({
      id: trainingAttendancesTable.id,
      sessionId: trainingAttendancesTable.sessionId,
      userId: trainingAttendancesTable.userId,
      initials: trainingAttendancesTable.initials,
      confirmedAt: trainingAttendancesTable.confirmedAt,
      userName: usersTable.name,
    })
    .from(trainingAttendancesTable)
    .innerJoin(usersTable, eq(trainingAttendancesTable.userId, usersTable.id))
    .where(eq(trainingAttendancesTable.sessionId, sessionId))
    .orderBy(asc(trainingAttendancesTable.confirmedAt));

  res.json({
    ...session,
    topics: sessionTopics.map((t) => ({
      id: t.id,
      topicId: t.topicId,
      title: t.customTitle || t.title,
      customTitle: t.customTitle,
      responsible: t.responsible,
      trainingMaterial: t.trainingMaterial,
      checked: t.checked,
    })),
    attendances,
  });
});

router.delete("/training-sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  await db.delete(trainingSessionsTable).where(eq(trainingSessionsTable.id, sessionId));
  res.status(204).send();
});

router.post("/training-sessions/:sessionId/attendance", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { initials, pin } = req.body;

  const [session] = await db
    .select()
    .from(trainingSessionsTable)
    .where(eq(trainingSessionsTable.id, sessionId));

  if (!session) {
    res.status(404).json({ error: "Schulung nicht gefunden." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.initials, initials.toUpperCase()),
        eq(usersTable.tenantId, session.tenantId)
      )
    );

  if (!user) {
    res.status(404).json({ error: "Kein Mitarbeiter mit diesem Kürzel gefunden." });
    return;
  }

  if (user.pin !== pin) {
    res.status(401).json({ error: "Falsche PIN." });
    return;
  }

  const existing = await db
    .select()
    .from(trainingAttendancesTable)
    .where(
      and(
        eq(trainingAttendancesTable.sessionId, sessionId),
        eq(trainingAttendancesTable.userId, user.id)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Teilnahme bereits bestätigt." });
    return;
  }

  const [attendance] = await db
    .insert(trainingAttendancesTable)
    .values({
      sessionId,
      userId: user.id,
      initials: initials.toUpperCase(),
    })
    .returning();

  res.status(201).json({
    ...attendance,
    userName: user.name,
  });
});

router.delete("/training-sessions/:sessionId/attendance/:attendanceId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const attendanceId = parseInt(req.params.attendanceId);
  await db.delete(trainingAttendancesTable).where(
    and(
      eq(trainingAttendancesTable.id, attendanceId),
      eq(trainingAttendancesTable.sessionId, sessionId)
    )
  );
  res.status(204).send();
});

export default router;
