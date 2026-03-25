import { Router, type IRouter } from "express";
import { db, registeredDevicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

const router: IRouter = Router();

const DEVICE_MASTER_PASSWORD =
  process.env.DEVICE_MASTER_PASSWORD || "Dallmann2025!";

router.post("/device/register", async (req, res) => {
  const { password, name } = req.body as { password?: string; name?: string };

  if (!password || !name?.trim()) {
    res.status(400).json({ authorized: false, error: "Passwort und Gerätename sind erforderlich." });
    return;
  }

  if (password !== DEVICE_MASTER_PASSWORD) {
    res.status(401).json({ authorized: false, error: "Falsches Master-Passwort." });
    return;
  }

  const token = randomBytes(32).toString("hex");

  const [device] = await db
    .insert(registeredDevicesTable)
    .values({ tenantId: 1, name: name.trim(), token, isActive: true })
    .returning();

  res.json({ authorized: true, token, deviceId: device.id, deviceName: device.name });
});

router.post("/device/verify-token", async (req, res) => {
  const { token } = req.body as { token?: string };

  if (!token) {
    res.json({ valid: false });
    return;
  }

  const [device] = await db
    .select()
    .from(registeredDevicesTable)
    .where(eq(registeredDevicesTable.token, token));

  if (!device || !device.isActive) {
    res.json({ valid: false });
    return;
  }

  res.json({ valid: true, deviceId: device.id, deviceName: device.name });
});

router.get("/devices", async (req, res) => {
  const devices = await db
    .select()
    .from(registeredDevicesTable)
    .orderBy(desc(registeredDevicesTable.createdAt));

  res.json(devices);
});

router.delete("/devices/:id", async (req, res) => {
  const id = Number(req.params.id);

  await db
    .update(registeredDevicesTable)
    .set({ isActive: false, revokedAt: new Date() })
    .where(eq(registeredDevicesTable.id, id));

  res.json({ success: true });
});

router.delete("/devices/:id/permanent", async (req, res) => {
  const id = Number(req.params.id);

  await db
    .delete(registeredDevicesTable)
    .where(eq(registeredDevicesTable.id, id));

  res.json({ success: true });
});

export default router;
