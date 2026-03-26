import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET all schulungs_pflichten for a tenant
router.get("/schulungs-pflichten", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const result = await pool.query(
      `SELECT * FROM schulungs_pflichten WHERE tenant_id = $1 ORDER BY id`,
      [tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST create
router.post("/schulungs-pflichten", async (req, res) => {
  const { tenantId, schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_pflichten (tenant_id, schulung_kategorie, bezeichnung, gueltige_gruppen, intervall_monate)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tenantId || 1, schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate || 12]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT update
router.put("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  const { schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate, isActive } = req.body;
  try {
    const result = await pool.query(
      `UPDATE schulungs_pflichten
       SET schulung_kategorie=$1, bezeichnung=$2, gueltige_gruppen=$3, intervall_monate=$4, is_active=$5
       WHERE id=$6 RETURNING *`,
      [schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate, isActive ?? true, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE
router.delete("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM schulungs_pflichten WHERE id=$1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET compliance for all employees of a tenant
router.get("/schulungs-compliance", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [empRes, pflichtRes, ausnahmenRes, nachweisRes] = await Promise.all([
      pool.query(
        `SELECT id, name, gruppe, status FROM users WHERE tenant_id=$1 AND status != 'inaktiv' ORDER BY name`,
        [tenantId]
      ),
      pool.query(
        `SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 AND is_active=true ORDER BY id`,
        [tenantId]
      ),
      pool.query(
        `SELECT sa.*, sp.bezeichnung FROM schulungs_ausnahmen sa
         JOIN schulungs_pflichten sp ON sp.id = sa.schulungs_pflicht_id
         WHERE sa.tenant_id=$1`,
        [tenantId]
      ),
      pool.query(
        `SELECT mitarbeiter_name, kategorie, naechste_schulung, schulungs_datum
         FROM schulungsnachweise
         WHERE tenant_id=$1 ORDER BY schulungs_datum DESC`,
        [tenantId]
      ),
    ]);

    const employees = empRes.rows;
    const pflichten = pflichtRes.rows;
    const ausnahmen = ausnahmenRes.rows;
    const nachweise = nachweisRes.rows;

    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);

    const result = employees.map((emp) => {
      const empGruppe = emp.gruppe;
      const relevantePflichten = pflichten.filter((p) =>
        Array.isArray(p.gueltige_gruppen) && p.gueltige_gruppen.includes(empGruppe)
      );

      const trainings = relevantePflichten.map((p) => {
        const ausnahme = ausnahmen.find(
          (a) => a.user_id === emp.id && a.schulungs_pflicht_id === p.id
        );

        if (ausnahme) {
          return {
            pflichtId: p.id,
            bezeichnung: p.bezeichnung,
            kategorie: p.schulung_kategorie,
            intervallMonate: p.intervall_monate,
            status: "ausnahme" as const,
            naechsteSchulung: null,
            ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung },
          };
        }

        // Find best matching nachweis (same name, same kategorie)
        const empNachweise = nachweise.filter(
          (n) =>
            n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase() &&
            n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase()
        );

        if (empNachweise.length === 0) {
          return {
            pflichtId: p.id,
            bezeichnung: p.bezeichnung,
            kategorie: p.schulung_kategorie,
            intervallMonate: p.intervall_monate,
            status: "fehlend" as const,
            naechsteSchulung: null,
            ausnahme: null,
          };
        }

        // Take the one with the furthest naechste_schulung
        const best = empNachweise.reduce((a, b) => {
          const da = a.naechste_schulung ? new Date(a.naechste_schulung) : new Date(0);
          const db = b.naechste_schulung ? new Date(b.naechste_schulung) : new Date(0);
          return da > db ? a : b;
        });

        const nextDate = best.naechste_schulung ? new Date(best.naechste_schulung) : null;
        let status: "ok" | "bald_fällig" | "überfällig" | "fehlend";

        if (!nextDate) {
          // Only has schulungs_datum, calculate from interval
          const schulungsDatum = best.schulungs_datum ? new Date(best.schulungs_datum) : null;
          if (!schulungsDatum) {
            status = "fehlend";
          } else {
            const expiry = new Date(schulungsDatum);
            expiry.setMonth(expiry.getMonth() + p.intervall_monate);
            if (expiry < today) status = "überfällig";
            else if (expiry <= soon) status = "bald_fällig";
            else status = "ok";
          }
        } else {
          if (nextDate < today) status = "überfällig";
          else if (nextDate <= soon) status = "bald_fällig";
          else status = "ok";
        }

        return {
          pflichtId: p.id,
          bezeichnung: p.bezeichnung,
          kategorie: p.schulung_kategorie,
          intervallMonate: p.intervall_monate,
          status,
          naechsteSchulung: best.naechste_schulung || null,
          ausnahme: null,
        };
      });

      const problems = trainings.filter((t) => t.status === "fehlend" || t.status === "überfällig");
      const warnings = trainings.filter((t) => t.status === "bald_fällig");

      return {
        employeeId: emp.id,
        name: emp.name,
        gruppe: emp.gruppe,
        status: emp.status,
        trainings,
        hasProblems: problems.length > 0,
        problemCount: problems.length,
        warningCount: warnings.length,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST ausnahme
router.post("/schulungs-ausnahmen", async (req, res) => {
  const { tenantId, userId, schulungsPflichtId, begruendung } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_ausnahmen (tenant_id, user_id, schulungs_pflicht_id, begruendung)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, schulungs_pflicht_id) DO UPDATE SET begruendung=EXCLUDED.begruendung
       RETURNING *`,
      [tenantId || 1, userId, schulungsPflichtId, begruendung || ""]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE ausnahme
router.delete("/schulungs-ausnahmen/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM schulungs_ausnahmen WHERE id=$1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
