import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET available kategorien and subbereiche (from both schulungsnachweise and pflichten)
router.get("/schulungs-kategorien", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [katRes, subRes] = await Promise.all([
      pool.query(
        `SELECT DISTINCT schulung_kategorie as kat FROM schulungs_pflichten WHERE tenant_id=$1
         UNION
         SELECT DISTINCT kategorie as kat FROM schulungsnachweise WHERE tenant_id=$1 AND kategorie IS NOT NULL
         ORDER BY kat`,
        [tenantId]
      ),
      pool.query(
        `SELECT DISTINCT subbereich as sub FROM schulungs_pflichten WHERE tenant_id=$1 AND subbereich IS NOT NULL
         UNION
         SELECT DISTINCT bezeichnung as sub FROM schulungsnachweise WHERE tenant_id=$1 AND bezeichnung IS NOT NULL
         ORDER BY sub`,
        [tenantId]
      ),
    ]);
    res.json({
      kategorien: katRes.rows.map((r: any) => r.kat).filter(Boolean),
      subbereiche: subRes.rows.map((r: any) => r.sub).filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET all schulungs_pflichten for a tenant (flat list with parent info)
router.get("/schulungs-pflichten", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const result = await pool.query(
      `SELECT * FROM schulungs_pflichten WHERE tenant_id = $1 ORDER BY COALESCE(parent_pflicht_id, id), id`,
      [tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST create
router.post("/schulungs-pflichten", async (req, res) => {
  const { tenantId, schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate, personSpezifisch, subbereich, parentPflichtId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_pflichten (tenant_id, schulung_kategorie, bezeichnung, gueltige_gruppen, intervall_monate, person_spezifisch, subbereich, parent_pflicht_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        tenantId || 1,
        schulungKategorie,
        bezeichnung,
        personSpezifisch ? [] : (gueltigeGruppen || []),
        intervallMonate || 12,
        personSpezifisch || false,
        subbereich || null,
        parentPflichtId || null,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT update
router.put("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  const { schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate, isActive, personSpezifisch, subbereich } = req.body;
  try {
    const result = await pool.query(
      `UPDATE schulungs_pflichten
       SET schulung_kategorie=$1, bezeichnung=$2, gueltige_gruppen=$3, intervall_monate=$4, is_active=$5, person_spezifisch=$6, subbereich=$7
       WHERE id=$8 RETURNING *`,
      [schulungKategorie, bezeichnung, personSpezifisch ? [] : (gueltigeGruppen || []), intervallMonate, isActive ?? true, personSpezifisch || false, subbereich || null, id]
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

function calcStatus(nextDate: Date | null, schulungsDatum: string | null, intervallMonate: number, today: Date, soon: Date): "ok" | "bald_fällig" | "überfällig" | "fehlend" {
  if (!nextDate) {
    if (!schulungsDatum) return "fehlend";
    const expiry = new Date(schulungsDatum);
    expiry.setMonth(expiry.getMonth() + intervallMonate);
    if (expiry < today) return "überfällig";
    if (expiry <= soon) return "bald_fällig";
    return "ok";
  }
  if (nextDate < today) return "überfällig";
  if (nextDate <= soon) return "bald_fällig";
  return "ok";
}

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
        `SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 AND is_active=true ORDER BY COALESCE(parent_pflicht_id, id), id`,
        [tenantId]
      ),
      pool.query(
        `SELECT sa.*, sp.bezeichnung as pflicht_bezeichnung FROM schulungs_ausnahmen sa
         JOIN schulungs_pflichten sp ON sp.id = sa.schulungs_pflicht_id
         WHERE sa.tenant_id=$1`,
        [tenantId]
      ),
      pool.query(
        `SELECT mitarbeiter_name, kategorie, bezeichnung, naechste_schulung, schulungs_datum
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
      const trainings: any[] = [];

      for (const p of pflichten) {
        const ausnahme = ausnahmen.find(
          (a: any) => a.user_id === emp.id && a.schulungs_pflicht_id === p.id
        );

        if (p.person_spezifisch) {
          const empNachweise = nachweise.filter((n: any) => {
            const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
            const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
            const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
            return nameMatch && katMatch && subMatch;
          });

          if (empNachweise.length === 0) continue;

          if (ausnahme) {
            trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, personSpezifisch: true, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: "ausnahme", naechsteSchulung: null, ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung } });
            continue;
          }

          const best = empNachweise.reduce((a: any, b: any) => {
            const da = a.naechste_schulung ? new Date(a.naechste_schulung) : new Date(0);
            const db = b.naechste_schulung ? new Date(b.naechste_schulung) : new Date(0);
            return da > db ? a : b;
          });

          const nextDate = best.naechste_schulung ? new Date(best.naechste_schulung) : null;
          trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, personSpezifisch: true, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: calcStatus(nextDate, best.schulungs_datum, p.intervall_monate, today, soon), naechsteSchulung: best.naechste_schulung || null, ausnahme: null });

        } else {
          if (!Array.isArray(p.gueltige_gruppen) || !p.gueltige_gruppen.includes(empGruppe)) continue;

          if (ausnahme) {
            trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, personSpezifisch: false, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: "ausnahme", naechsteSchulung: null, ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung } });
            continue;
          }

          const empNachweise = nachweise.filter((n: any) => {
            const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
            const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
            const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
            return nameMatch && katMatch && subMatch;
          });

          if (empNachweise.length === 0) {
            trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: null, personSpezifisch: false, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: "fehlend", naechsteSchulung: null, ausnahme: null });
            continue;
          }

          const best = empNachweise.reduce((a: any, b: any) => {
            const da = a.naechste_schulung ? new Date(a.naechste_schulung) : new Date(0);
            const db = b.naechste_schulung ? new Date(b.naechste_schulung) : new Date(0);
            return da > db ? a : b;
          });

          const nextDate = best.naechste_schulung ? new Date(best.naechste_schulung) : null;
          trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: null, personSpezifisch: false, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: calcStatus(nextDate, best.schulungs_datum, p.intervall_monate, today, soon), naechsteSchulung: best.naechste_schulung || null, ausnahme: null });
        }
      }

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
