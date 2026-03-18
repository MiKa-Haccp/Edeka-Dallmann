import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DEVICE_MASTER_PASSWORD =
  process.env.DEVICE_MASTER_PASSWORD || "Dallmann2025!";

router.post("/device/verify", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ authorized: false, error: "Passwort fehlt." });
    return;
  }
  if (password === DEVICE_MASTER_PASSWORD) {
    res.json({ authorized: true });
  } else {
    res.status(401).json({ authorized: false, error: "Falsches Master-Passwort." });
  }
});

export default router;
