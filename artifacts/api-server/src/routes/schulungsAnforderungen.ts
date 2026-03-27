import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcStatus(
  nextDateStr: string | null,
  baseDateStr: string | null,
  intervallMonate: number,
  today: Date,
  soon: Date
): "ok" | "bald_fällig" | "überfällig" | "fehlend" {
  const nextDate = nextDateStr ? new Date(nextDateStr) : null;
  if (!nextDate) {
    if (!baseDateStr) return "fehlend";
    const expiry = new Date(baseDateStr);
    expiry.setMonth(expiry.getMonth() + intervallMonate);
    if (expiry < today) return "überfällig";
    if (expiry <= soon) return "bald_fällig";
    return "ok";
  }
  if (nextDate < today) return "überfällig";
  if (nextDate <= soon) return "bald_fällig";
  return "ok";
}

// ── Schulungsthemen aus Protokoll (training_topics) ──────────────────────────

router.get("/schulungs-themen-katalog", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, responsible FROM training_topics WHERE is_default=true ORDER BY sort_order, id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Kategorien / Subbereiche ─────────────────────────────────────────────────

router.get("/schulungs-kategorien", async (req, res) => {
  const tenantId = Number(req.query.tenantId) || 1;
  try {
    const [schulKatRes, beschKatRes, subRes] = await Promise.all([
      pool.query(
        `SELECT DISTINCT schulung_kategorie as kat FROM schulungs_pflichten
         WHERE tenant_id=$1 AND typ='schulung' AND schulung_kategorie IS NOT NULL
         ORDER BY kat`,
        [tenantId]
      ),
      pool.query(
        `SELECT DISTINCT schulung_kategorie as kat FROM schulungs_pflichten
         WHERE tenant_id=$1 AND typ='bescheinigung' AND schulung_kategorie IS NOT NULL
         ORDER BY kat`,
        [tenantId]
      ),
      pool.query(
        `SELECT DISTINCT subbereich as sub FROM schulungs_pflichten
         WHERE tenant_id=$1 AND subbereich IS NOT NULL ORDER BY sub`,
        [tenantId]
      ),
    ]);
    const schulungsKategorien = schulKatRes.rows.map((r: any) => r.kat).filter(Boolean);
    const bescheinigungenKategorien = beschKatRes.rows.map((r: any) => r.kat).filter(Boolean);
    res.json({
      kategorien: schulungsKategorien,
      schulungsKategorien,
      bescheinigungenKategorien,
      subbereiche: subRes.rows.map((r: any) => r.sub).filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Mitarbeiterliste ─────────────────────────────────────────────────────────

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
        `SELECT sp.*, tt.title as training_topic_title
         FROM schulungs_pflichten sp
         LEFT JOIN training_topics tt ON tt.id = sp.training_topic_id
         WHERE sp.tenant_id=$1 ORDER BY sp.typ DESC, COALESCE(sp.parent_pflicht_id, sp.id), sp.id`,
        [tenantId]
      ),
      pool.query(
        `SELECT spz.schulungs_pflicht_id, spz.user_id, u.name, u.gruppe
         FROM schulungs_person_zuordnungen spz JOIN users u ON u.id=spz.user_id
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
    intervallMonate, subbereich, parentPflichtId,
    typ, zuordnungModus, pruefModus, trainingTopicId,
  } = req.body;
  const modus = zuordnungModus || "gruppe";
  const gruppen = modus === "gruppe" ? (gueltigeGruppen || []) : [];
  try {
    const result = await pool.query(
      `INSERT INTO schulungs_pflichten
         (tenant_id, schulung_kategorie, bezeichnung, gueltige_gruppen, intervall_monate,
          person_spezifisch, subbereich, parent_pflicht_id, typ, zuordnung_modus, pruef_modus, training_topic_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [tenantId || 1, schulungKategorie, bezeichnung, gruppen, intervallMonate || 12,
       modus === "auto", subbereich || null, parentPflichtId || null,
       typ || "schulung", modus, pruefModus || "zeitbasiert", trainingTopicId || null]
    );
    res.json({ ...result.rows[0], personen: [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/schulungs-pflichten/:id", async (req, res) => {
  const { id } = req.params;
  const {
    schulungKategorie, bezeichnung, gueltigeGruppen, intervallMonate,
    isActive, subbereich, typ, zuordnungModus, pruefModus, trainingTopicId,
  } = req.body;
  const gruppen = zuordnungModus === "gruppe" ? (gueltigeGruppen || []) : [];
  try {
    const result = await pool.query(
      `UPDATE schulungs_pflichten
       SET schulung_kategorie=$1, bezeichnung=$2, gueltige_gruppen=$3, intervall_monate=$4,
           is_active=$5, person_spezifisch=$6, subbereich=$7, typ=$8, zuordnung_modus=$9,
           pruef_modus=$10, training_topic_id=$11
       WHERE id=$12 RETURNING *`,
      [schulungKategorie, bezeichnung, gruppen, intervallMonate, isActive ?? true,
       zuordnungModus === "auto", subbereich || null,
       typ || "schulung", zuordnungModus || "gruppe",
       pruefModus || "zeitbasiert", trainingTopicId || null, id]
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

// ── Person-Zuordnungen ───────────────────────────────────────────────────────

router.get("/schulungs-person-zuordnungen/:pflichtId", async (req, res) => {
  const { pflichtId } = req.params;
  try {
    const result = await pool.query(
      `SELECT spz.user_id, u.name, u.gruppe FROM schulungs_person_zuordnungen spz
       JOIN users u ON u.id=spz.user_id WHERE spz.schulungs_pflicht_id=$1`,
      [pflichtId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put("/schulungs-person-zuordnungen/:pflichtId", async (req, res) => {
  const { pflichtId } = req.params;
  const { tenantId, userIds } = req.body;
  try {
    await pool.query(`DELETE FROM schulungs_person_zuordnungen WHERE schulungs_pflicht_id=$1`, [pflichtId]);
    if (Array.isArray(userIds) && userIds.length > 0) {
      const values = userIds.map((_: any, i: number) => `($1, $${i + 2}, $${userIds.length + 2})`).join(",");
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
    const [empRes, pflichtRes, ausnahmenRes, nachweisRes, personZuordRes, attendanceRes] = await Promise.all([
      pool.query(
        `SELECT id, name, gruppe, status FROM users WHERE tenant_id=$1 AND status != 'inaktiv' ORDER BY name`,
        [tenantId]
      ),
      pool.query(
        `SELECT sp.*, tt.title as training_topic_title
         FROM schulungs_pflichten sp
         LEFT JOIN training_topics tt ON tt.id = sp.training_topic_id
         WHERE sp.tenant_id=$1 AND sp.is_active=true AND sp.typ='schulung'
         ORDER BY COALESCE(sp.parent_pflicht_id, sp.id), sp.id`,
        [tenantId]
      ),
      pool.query(
        `SELECT sa.* FROM schulungs_ausnahmen sa
         JOIN schulungs_pflichten sp ON sp.id=sa.schulungs_pflicht_id
         WHERE sa.tenant_id=$1`,
        [tenantId]
      ),
      pool.query(
        `SELECT mitarbeiter_name, kategorie, bezeichnung, naechste_schulung, schulungs_datum
         FROM schulungsnachweise WHERE tenant_id=$1 ORDER BY schulungs_datum DESC`,
        [tenantId]
      ),
      pool.query(`SELECT schulungs_pflicht_id, user_id FROM schulungs_person_zuordnungen WHERE tenant_id=$1`, [tenantId]),
      // Last attendance per user per topic via training sessions
      pool.query(
        `SELECT ta.user_id, tst.topic_id, MAX(ts.session_date) as letzte_teilnahme
         FROM training_attendances ta
         JOIN training_sessions ts ON ts.id = ta.session_id
         JOIN training_session_topics tst ON tst.session_id = ts.id
         WHERE ts.tenant_id=$1
         GROUP BY ta.user_id, tst.topic_id`,
        [tenantId]
      ),
    ]);

    const employees = empRes.rows;
    const pflichten = pflichtRes.rows;
    const ausnahmen = ausnahmenRes.rows;
    const nachweise = nachweisRes.rows;
    const personZuord = personZuordRes.rows;
    const attendances = attendanceRes.rows;

    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);

    const result = employees.map((emp: any) => {
      const trainings: any[] = [];

      for (const p of pflichten) {
        const ausnahme = ausnahmen.find((a: any) => a.user_id === emp.id && a.schulungs_pflicht_id === p.id);

        // Relevanzprüfung
        let relevant = false;
        if (p.zuordnung_modus === "gruppe") {
          relevant = Array.isArray(p.gueltige_gruppen) && p.gueltige_gruppen.includes(emp.gruppe);
        } else if (p.zuordnung_modus === "personen") {
          relevant = personZuord.some((z: any) => z.schulungs_pflicht_id === p.id && z.user_id === emp.id);
        } else if (p.zuordnung_modus === "auto") {
          if (p.training_topic_id) {
            relevant = attendances.some((a: any) => a.user_id === emp.id && a.topic_id === p.training_topic_id);
          } else {
            relevant = nachweise.some((n: any) => {
              const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
              const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
              const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
              return nameMatch && katMatch && subMatch;
            });
          }
        }

        if (!relevant) continue;

        if (ausnahme) {
          trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, zuordnungModus: p.zuordnung_modus, parentPflichtId: p.parent_pflicht_id || null, pruefModus: p.pruef_modus, trainingTopicTitle: p.training_topic_title || null, intervallMonate: p.intervall_monate, status: "ausnahme", naechsteSchulung: null, ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung } });
          continue;
        }

        // Compliance-Berechnung je nach Quelle
        let status: string = "fehlend";
        let naechsteSchulung: string | null = null;

        if (p.training_topic_id) {
          // Aus Schulungsprotokoll / training_sessions
          const att = attendances.find((a: any) => a.user_id === emp.id && a.topic_id === p.training_topic_id);
          if (att) {
            if (p.pruef_modus === "vorhanden") {
              status = "ok";
            } else {
              const letzte = new Date(att.letzte_teilnahme);
              const expiry = new Date(letzte);
              expiry.setMonth(expiry.getMonth() + p.intervall_monate);
              naechsteSchulung = expiry.toISOString().slice(0, 10);
              if (expiry < today) status = "überfällig";
              else if (expiry <= soon) status = "bald_fällig";
              else status = "ok";
            }
          }
        } else {
          // Aus schulungsnachweise
          const empNachweise = nachweise.filter((n: any) => {
            const nameMatch = n.mitarbeiter_name?.trim().toLowerCase() === emp.name?.trim().toLowerCase();
            const katMatch = n.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase();
            const subMatch = !p.subbereich || n.bezeichnung?.toLowerCase().includes(p.subbereich.toLowerCase());
            return nameMatch && katMatch && subMatch;
          });

          if (empNachweise.length > 0) {
            if (p.pruef_modus === "vorhanden") {
              status = "ok";
            } else {
              const best = empNachweise.reduce((a: any, b: any) => {
                const da = a.naechste_schulung ? new Date(a.naechste_schulung) : new Date(0);
                const db = b.naechste_schulung ? new Date(b.naechste_schulung) : new Date(0);
                return da > db ? a : b;
              });
              naechsteSchulung = best.naechste_schulung || null;
              status = calcStatus(best.naechste_schulung, best.schulungs_datum, p.intervall_monate, today, soon);
            }
          }
        }

        trainings.push({ pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie, zuordnungModus: p.zuordnung_modus, parentPflichtId: p.parent_pflicht_id || null, pruefModus: p.pruef_modus, trainingTopicTitle: p.training_topic_title || null, intervallMonate: p.intervall_monate, status, naechsteSchulung, ausnahme: null });
      }

      const problems = trainings.filter((t) => t.status === "fehlend" || t.status === "überfällig");
      const warnings = trainings.filter((t) => t.status === "bald_fällig");
      return { employeeId: emp.id, name: emp.name, gruppe: emp.gruppe, trainings, hasProblems: problems.length > 0, problemCount: problems.length, warningCount: warnings.length };
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
    const [pflichtRes, beschRes, gesundRes, personZuordRes, ausnahmenRes, empRes] = await Promise.all([
      pool.query(
        `SELECT * FROM schulungs_pflichten WHERE tenant_id=$1 AND is_active=true AND typ='bescheinigung' ORDER BY id`,
        [tenantId]
      ),
      pool.query(`SELECT mitarbeiter_name, kategorie, bezeichnung, gueltig_bis FROM bescheinigungen WHERE tenant_id=$1`, [tenantId]),
      pool.query(`SELECT mitarbeiter_name, naechste_pruefung, ausstellungs_datum FROM gesundheitszeugnisse WHERE tenant_id=$1`, [tenantId]),
      pool.query(
        `SELECT spz.schulungs_pflicht_id, spz.user_id, u.name, u.gruppe
         FROM schulungs_person_zuordnungen spz JOIN users u ON u.id=spz.user_id WHERE spz.tenant_id=$1`,
        [tenantId]
      ),
      pool.query(
        `SELECT sa.* FROM schulungs_ausnahmen sa
         JOIN schulungs_pflichten sp ON sp.id=sa.schulungs_pflicht_id WHERE sa.tenant_id=$1`,
        [tenantId]
      ),
      pool.query(`SELECT id, name, gruppe FROM users WHERE tenant_id=$1 AND status != 'inaktiv' ORDER BY name`, [tenantId]),
    ]);

    const pflichten = pflichtRes.rows;
    const bescheinigungen = beschRes.rows;
    const gesundheitszeugnisse = gesundRes.rows;
    const personZuord = personZuordRes.rows;
    const ausnahmen = ausnahmenRes.rows;
    const employees = empRes.rows;

    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);

    const result = pflichten.map((p: any) => {
      const isGZ = p.schulung_kategorie === "Gesundheitszeugnis";
      const zugeordnet = personZuord.filter((z: any) => z.schulungs_pflicht_id === p.id);

      let candidatePersons: { name: string; gruppe: string | null; userId?: number }[] = [];

      if (p.zuordnung_modus === "personen") {
        candidatePersons = zugeordnet.map((z: any) => ({ name: z.name, gruppe: z.gruppe, userId: z.user_id }));
      } else if (p.zuordnung_modus === "gruppe") {
        // All employees in matching group
        candidatePersons = employees
          .filter((e: any) => Array.isArray(p.gueltige_gruppen) && p.gueltige_gruppen.includes(e.gruppe))
          .map((e: any) => ({ name: e.name, gruppe: e.gruppe, userId: e.id }));
      } else {
        // Auto: whoever has an entry
        if (isGZ) {
          candidatePersons = gesundheitszeugnisse.map((gz: any) => {
            const emp = employees.find((e: any) => e.name?.trim().toLowerCase() === gz.mitarbeiter_name?.trim().toLowerCase());
            return { name: gz.mitarbeiter_name, gruppe: emp?.gruppe || null, userId: emp?.id };
          });
        } else {
          const katMatch = bescheinigungen.filter((b: any) =>
            b.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase()
          );
          const names = [...new Set(katMatch.map((b: any) => b.mitarbeiter_name?.trim()))];
          candidatePersons = names.map((name: string) => {
            const emp = employees.find((e: any) => e.name?.trim().toLowerCase() === name.toLowerCase());
            return { name, gruppe: emp?.gruppe || null, userId: emp?.id };
          });
        }
      }

      const entries = candidatePersons.map((person) => {
        const empId = person.userId ?? employees.find((e: any) => e.name?.trim().toLowerCase() === person.name?.trim().toLowerCase())?.id;
        const ausnahme = ausnahmen.find((a: any) => a.user_id === empId && a.schulungs_pflicht_id === p.id);

        if (ausnahme) return { name: person.name, gruppe: person.gruppe, gueltigBis: null, status: "ausnahme", ausnahme: { id: ausnahme.id, begruendung: ausnahme.begruendung } };

        if (isGZ) {
          const gz = gesundheitszeugnisse.find((g: any) =>
            g.mitarbeiter_name?.trim().toLowerCase() === person.name?.trim().toLowerCase()
          );
          if (!gz) return { name: person.name, gruppe: person.gruppe, gueltigBis: null, status: "fehlend", ausnahme: null };
          if (p.pruef_modus === "vorhanden") return { name: person.name, gruppe: person.gruppe, gueltigBis: gz.naechste_pruefung || null, status: "ok", ausnahme: null };
          return { name: person.name, gruppe: person.gruppe, gueltigBis: gz.naechste_pruefung || null, status: calcStatus(gz.naechste_pruefung, gz.ausstellungs_datum, p.intervall_monate, today, soon), ausnahme: null };
        } else {
          const bs = bescheinigungen
            .filter((b: any) => b.mitarbeiter_name?.trim().toLowerCase() === person.name?.trim().toLowerCase() && b.kategorie?.trim().toLowerCase() === p.schulung_kategorie?.trim().toLowerCase())
            .sort((a: any, b: any) => new Date(b.gueltig_bis || 0).getTime() - new Date(a.gueltig_bis || 0).getTime())[0];

          if (!bs) return { name: person.name, gruppe: person.gruppe, gueltigBis: null, status: "fehlend", ausnahme: null };
          if (p.pruef_modus === "vorhanden") return { name: person.name, gruppe: person.gruppe, gueltigBis: bs.gueltig_bis || null, status: "ok", ausnahme: null };
          return { name: person.name, gruppe: person.gruppe, gueltigBis: bs.gueltig_bis || null, status: calcStatus(bs.gueltig_bis, null, p.intervall_monate, today, soon), ausnahme: null };
        }
      });

      const problemCount = entries.filter((e) => e.status === "fehlend" || e.status === "überfällig").length;
      const warningCount = entries.filter((e) => e.status === "bald_fällig").length;

      return {
        pflichtId: p.id, bezeichnung: p.bezeichnung, kategorie: p.schulung_kategorie,
        intervallMonate: p.intervall_monate, zuordnungModus: p.zuordnung_modus, pruefModus: p.pruef_modus,
        personen: zugeordnet.map((z: any) => ({ userId: z.user_id, name: z.name })),
        entries, hasProblems: problemCount > 0, problemCount, warningCount,
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
