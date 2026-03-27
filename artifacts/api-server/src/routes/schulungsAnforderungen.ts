import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcStatus(
  nextDateStr: string | null,
  schulungsDatum: string | null,
  intervallMonate: number,
  today: Date,
  soon: Date
): "ok" | "bald_fällig" | "überfällig" | "fehlend" {
  const nextDate = nextDateStr ? new Date(nextDateStr) : null;
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

// ── Kategorien / Subbereiche ─────────────────────────────────────────────────

router.get("/schulungs-kategorien", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [katRes, subRes] = await Promise.all([
      pool.query(
        `SELECT DISTINCT schulung_kategorie as kat FROM schulungs_pflichten WHERE tenant_id=$1
         UNION SELECT DISTINCT kategorie FROM schulungsnachweise WHERE tenant_id=$1 AND kategorie IS NOT NULL
         ORDER BY kat`,
        [tenantId]
      ),
      pool.query(
        `SELECT DISTINCT subbereich as sub FROM schulungs_pflichten WHERE tenant_id=$1 AND subbereich IS NOT NULL
         UNION SELECT DISTINCT bezeichnung FROM schulungsnachweise WHERE tenant_id=$1 AND bezeichnung IS NOT NULL
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

// ── Mitarbeiterliste für Person-Picker ───────────────────────────────────────

router.get("/mitarbeiter-fuer-picker", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const result = await pool.query(
      `SELECT id, name, gruppe FROM users WHERE tenant_id=$1 AND status != 'inaktiv' ORDER BY name`,
      [tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── CRUD Schulungs-Pflichten ─────────────────────────────────────────────────

router.get("/schulungs-pflichten", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [pflichtRes, zuordnungRes] = await Promise.all([
      pool.query(
        `SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 ORDER BY typ DESC, COALESCE(parent_pflicht_id, id), id`,
        [tenantId]
      ),
      pool.query(
        `SELECT spz.schulungs_pflicht_id, spz.user_id, u.name, u.gruppe
         FROM schulungs_person_zuordnungen spz
         JOIN users u ON u.id = spz.user_id
         WHERE spz.tenant_id=$1`,
        [tenantId]
      ),
    ]);

    const zuordnungen = zuordnungRes.rows;
    const pflichten = pflichtRes.rows.map((p: any) => ({
      ...p,
      personen: zuordnungen
        .filter((z: any) => z.schulungs_pflicht_id === p.id)
        .map((z: any) => ({ userId: z.user_id, name: z.name, gruppe: z.gruppe })),
    }));

    res.json(pflichten);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/schulungs-pflichten", async (req, res) => {
  const {
    tenantId, schulungKategorie, bezeichnung, gueltigeGruppen,
    intervallMonate, personSpezifisch, subbereich, parentPflichtId,
    typ, zuordnungModus,
  } = req.body;
  const modus = zuordnungModus || (personSpezifisch ? "auto" : "gruppe");
  const gruppen = modus === "gruppe" ? (gueltigeGruppen || []) : [];
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_pflichten
         (tenant_id, schulung_kategorie, bezeichnung, gueltige_gruppen, intervall_monate, person_spezifisch, subbereich, parent_pflicht_id, typ, zuordnung_modus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenantId || 1, schulungKategorie, bezeichnung, gruppen, intervallMonate || 12,
       modus === "auto", subbereich || null, parentPflichtId || null,
       typ || "schulung", modus]
    );
    res.json({ ...result.rows[0], personen: [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  const {
    schulungKategorie, bezeichnung, gueltigeGruppen,
    intervallMonate, isActive, subbereich, typ, zuordnungModus,
  } = req.body;
  const gruppen = zuordnungModus === "gruppe" ? (gueltigeGruppen || []) : [];
  try {
    const result = await pool.query(
      `UPDATE schulungs_pflichten
       SET schulung_kategorie=$1, bezeichnung=$2, gueltige_gruppen=$3, intervall_monate=$4,
           is_active=$5, person_spezifisch=$6, subbereich=$7, typ=$8, zuordnung_modus=$9
       WHERE id=$10 RETURNING *`,
      [schulungKategorie, bezeichnung, gruppen, intervallMonate, isActive ?? true,
       zuordnungModus === "auto", subbereich || null,
       typ || "schulung", zuordnungModus || "gruppe", id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM schulungs_pflichten WHERE id=$1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Person-Zuordnungen (für Modus 'personen') ────────────────────────────────

router.get("/schulungs-person-zuordnungen/:pflichtId", async (req, res) => {
  const { pflichtId } = req.params;
  try {
    const result = await pool.query(
      `SELECT spz.user_id, u.name, u.gruppe
       FROM schulungs_person_zuordnungen spz JOIN users u ON u.id=spz.user_id
       WHERE spz.schulungs_pflicht_id=$1`,
      [pflichtId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/schulungs-person-zuordnungen/:pflichtId", async (req, res) => {
  const { pflichtId } = req.params;
  const { tenantId, userIds } = req.body; // full replacement
  try {
    await pool.query(`DELETE FROM schulungs_person_zuordnungen WHERE schulungs_pflicht_id=$1`, [pflichtId]);
    if (Array.isArray(userIds) && userIds.length > 0) {
      const values = userIds.map((_: number, i: number) => `($1, $${i + 2}, $${userIds.length + 2})`).join(",");
      await pool.query(
        `INSERT INTO schulungs_person_zuordnungen (schulungs_pflicht_id, user_id, tenant_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [pflichtId, ...userIds, tenantId || 1]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Compliance: Schulungen ───────────────────────────────────────────────────

router.get("/schulungs-compliance", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [empRes, pflichtRes, ausnahmenRes, nachweisRes, personZuordRes] = await Promise.all([
      pool.query(`SELECT id, name, gruppe, status FROM users WHERE tenant_id=$1 AND status != 'inaktiv' ORDER BY name`, [tenantId]),
      pool.query(`SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 AND is_active=true AND typ='schulung' ORDER BY COALESCE(parent_pflicht_id, id), id`, [tenantId]),
      pool.query(`SELECT sa.* FROM schulungs_ausnahmen sa JOIN schulungs_pflichten sp ON sp.id=sa.schulungs_pflicht_id WHERE sa.tenant_id=$1`, [tenantId]),
      pool.query(`SELECT mitarbeiter_name, kategorie, bezeichnung, naechste_schulung, schulungs_datum FROM schulungsnachweise WHERE tenant_id=$1 ORDER BY schulungs_datum DESC`, [tenantId]),
      pool.query(`SELECT schulungs_pflicht_id, user_id FROM schulungs_person_zuordnungen WHERE tenant_id=$1`, [tenantId]),
    ]);

    const employees = empRes.rows;
    const pflichten = pflichtRes.rows;
    const ausnahmen = ausnahmenRes.rows;
    const nachweise = nachweisRes.rows;
    const personZuord = personZuordRes.rows;

    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);

    const result = employees.map((emp: any) => {
      const trainings: any[] = [];

      for (const p of pflichten) {
        const ausnahme = ausnahmen.find((a: any) => a.user_id === emp.id && a.schulungs_pflicht_id === p.id);

        // Relevanzprüfung je nach Modus
        let relevant = false;
        if (p.zuordnung_modus === "gruppe") {
          relevant = Array.isArray(p.gueltige_gruppen) && p.gueltige_gruppen.includes(emp.gruppe);
        } else if (p.zuordnung_modus === "personen") {
          relevant = personZuord.some((z: any) => z.schulungs_pflicht_id === p.id && z.user_id === emp.id);
        } else if (p.zuordnung_modus === "auto") {
          // Relevant wenn Nachweis vorhanden
          relevant = nachweise.some((n: any) => {
            const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
            const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
            const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
            return nameMatch && katMatch && subMatch;
          });
        }

        if (!relevant) continue;

        if (ausnahme) {
          trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, zuordnungModus: p.zuordnung_modus, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: "ausnahme", naechsteSchulung: null, ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung } });
          continue;
        }

        const empNachweise = nachweise.filter((n: any) => {
          const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
          const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
          const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
          return nameMatch && katMatch && subMatch;
        });

        if (empNachweise.length === 0) {
          trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, zuordnungModus: p.zuordnung_modus, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: "fehlend", naechsteSchulung: null, ausnahme: null });
          continue;
        }

        const best = empNachweise.reduce((a: any, b: any) => {
          const da = a.naechste_schulung ? new Date(a.naechste_schulung) : new Date(0);
          const db = b.naechste_schulung ? new Date(b.naechste_schulung) : new Date(0);
          return da > db ? a : b;
        });

        trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, subbereich: p.subbereich || null, zuordnungModus: p.zuordnung_modus, parentPflichtId: p.parent_pflicht_id || null, intervallMonate: p.intervall_monate, status: calcStatus(best.naechste_schulung, best.schulungs_datum, p.intervall_monate, today, soon), naechsteSchulung: best.naechste_schulung || null, ausnahme: null });
      }

      const problems = trainings.filter((t) => t.status === "fehlend" || t.status === "überfällig");
      const warnings = trainings.filter((t) => t.status === "bald_fällig");
      return { employeeId: emp.id, name: emp.name, gruppe: emp.gruppe, status: emp.status, trainings, hasProblems: problems.length > 0, problemCount: problems.length, warningCount: warnings.length };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Compliance: Bescheinigungen ──────────────────────────────────────────────

router.get("/bescheinigungen-compliance", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [pflichtRes, beschRes, gesundRes, personZuordRes] = await Promise.all([
      pool.query(`SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 AND is_active=true AND typ='bescheinigung' ORDER BY id`, [tenantId]),
      pool.query(`SELECT mitarbeiter_name, kategorie, bezeichnung, gueltig_bis FROM bescheinigungen WHERE tenant_id=$1`, [tenantId]),
      pool.query(`SELECT mitarbeiter_name, naechste_pruefung FROM gesundheitszeugnisse WHERE tenant_id=$1`, [tenantId]),
      pool.query(
        `SELECT spz.schulungs_pflicht_id, spz.user_id, u.name, u.gruppe
         FROM schulungs_person_zuordnungen spz JOIN users u ON u.id=spz.user_id
         WHERE spz.tenant_id=$1`, [tenantId]
      ),
    ]);

    const pflichten = pflichtRes.rows;
    const bescheinigungen = beschRes.rows;
    const gesundheitszeugnisse = gesundRes.rows;
    const personZuord = personZuordRes.rows;

    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);

    // Build result: per Pflicht, list persons with status
    const result = pflichten.map((p: any) => {
      const isGesundheitszeugnis = p.schulung_kategorie === "Gesundheitszeugnis";
      let entries: any[] = [];

      if (p.zuordnung_modus === "personen") {
        // Explicit person list
        const zugeordnet = personZuord.filter((z: any) => z.schulungs_pflicht_id === p.id);
        entries = zugeordnet.map((z: any) => {
          if (isGesundheitszeugnis) {
            const gz = gesundheitszeugnisse.find((g: any) =>
              g.mitarbeiter_name?.trim().toLowerCase() === z.name?.trim().toLowerCase()
            );
            return {
              name: z.name, gruppe: z.gruppe,
              gueltigBis: gz?.naechste_pruefung || null,
              status: gz ? calcStatus(gz.naechste_pruefung, null, p.intervall_monate, today, soon) : "fehlend",
            };
          } else {
            const bs = bescheinigungen.filter((b: any) =>
              b.mitarbeiter_name?.trim().toLowerCase() === z.name?.trim().toLowerCase() &&
              b.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase()
            ).sort((a: any, b: any) => new Date(b.gueltig_bis || 0).getTime() - new Date(a.gueltig_bis || 0).getTime())[0];
            return {
              name: z.name, gruppe: z.gruppe,
              gueltigBis: bs?.gueltig_bis || null,
              status: bs ? calcStatus(bs.gueltig_bis, null, p.intervall_monate, today, soon) : "fehlend",
            };
          }
        });
      } else {
        // Auto: whoever has an entry
        if (isGesundheitszeugnis) {
          entries = gesundheitszeugnisse.map((gz: any) => ({
            name: gz.mitarbeiter_name, gruppe: null,
            gueltigBis: gz.naechste_pruefung || null,
            status: calcStatus(gz.naechste_pruefung, null, p.intervall_monate, today, soon),
          }));
        } else {
          const katMatch = bescheinigungen.filter((b: any) =>
            b.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase()
          );
          // Group by person, take latest
          const byName: Record<string, any> = {};
          for (const b of katMatch) {
            const key = b.mitarbeiter_name?.trim().toLowerCase();
            if (!byName[key] || new Date(b.gueltig_bis) > new Date(byName[key].gueltig_bis)) {
              byName[key] = b;
            }
          }
          entries = Object.values(byName).map((b: any) => ({
            name: b.mitarbeiter_name, gruppe: null,
            gueltigBis: b.gueltig_bis || null,
            status: calcStatus(b.gueltig_bis, null, p.intervall_monate, today, soon),
          }));
        }
      }

      const problemCount = entries.filter((e) => e.status === "fehlend" || e.status === "überfällig").length;
      const warningCount = entries.filter((e) => e.status === "bald_fällig").length;

      return {
        pflichtId: p.id,
        bezeichnung: p.bezeichnung,
        kategorie: p.schulung_kategorie,
        intervallMonate: p.intervall_monate,
        zuordnungModus: p.zuordnung_modus,
        personen: personZuord.filter((z: any) => z.schulungs_pflicht_id === p.id).map((z: any) => ({ userId: z.user_id, name: z.name })),
        entries,
        hasProblems: problemCount > 0,
        problemCount,
        warningCount,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Ausnahmen ────────────────────────────────────────────────────────────────

router.post("/schulungs-ausnahmen", async (req, res) => {
  const { tenantId, userId, schulungsPflichtId, begruendung } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_ausnahmen (tenant_id, user_id, schulungs_pflicht_id, begruendung)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, schulungs_pflicht_id) DO UPDATE SET begruendung=EXCLUDED.begruendung RETURNING *`,
      [tenantId || 1, userId, schulungsPflichtId, begruendung || ""]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

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
