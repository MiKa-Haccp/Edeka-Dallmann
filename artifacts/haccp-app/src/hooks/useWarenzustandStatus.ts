import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { getBavarianHolidays } from "@/utils/holidays";

const BASE = import.meta.env.VITE_API_URL || "/api";

const SLOT_WINDOWS = [
  { key: "s1", startHour: 6,  endHour: 9  },
  { key: "s2", startHour: 9,  endHour: 12 },
  { key: "s3", startHour: 12, endHour: 15 },
  { key: "s4", startHour: 15, endHour: 18 },
  { key: "s5", startHour: 18, endHour: 24 },
];

export type TrafficLight = "green" | "yellow" | "red" | "none";

/** Gibt den Montag der laufenden Woche als Date zurück (00:00 Uhr) */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=So, 1=Mo ... 6=Sa
  const diff = dow === 0 ? -6 : 1 - dow; // Montag der Woche
  d.setDate(d.getDate() + diff);
  return d;
}

function isClosed(date: Date, holidays: Set<string>): boolean {
  const dow = date.getDay();
  if (dow === 0) return true; // Sonntag
  const s = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return holidays.has(s);
}

export function useWarenzustandOGStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("warenzustand-og-updated", onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener("warenzustand-og-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }

    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.getDate();
    const hour  = now.getHours() + now.getMinutes() / 60;

    const holidays = getBavarianHolidays(year);

    // Heute Feiertag oder Sonntag → kein Indikator
    if (isClosed(now, holidays)) { setStatus("none"); return; }

    // Vor Ladenöffnung → alles in Ordnung
    if (hour < 6) { setStatus("green"); return; }

    let cancelled = false;

    fetch(`${BASE}/warencheck-og?marketId=${selectedMarketId}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((entries: { day: number; slot: string }[]) => {
        if (cancelled) return;

        // --- Vergangene Wochentage (Mo bis gestern) prüfen ---
        const monday = getMondayOfWeek(now);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        for (let d = new Date(monday); d < todayStart; d.setDate(d.getDate() + 1)) {
          if (isClosed(d, holidays)) continue; // Sonntag / Feiertag überspringen

          const dayNum = d.getDate();
          // Nur relevant wenn der Tag im selben Monat liegt
          if (d.getMonth() + 1 !== month) continue;

          const dayChecked = new Set(
            entries.filter(e => e.day === dayNum).map(e => e.slot)
          );
          const missing = SLOT_WINDOWS.filter(w => !dayChecked.has(w.key));
          if (missing.length > 0) {
            setStatus("red");
            return;
          }
        }

        // --- Heutige Slots prüfen ---
        const todayChecked = new Set(
          entries.filter(e => e.day === today).map(e => e.slot)
        );

        const pastSlots: string[] = [];
        let currentSlot: string | null = null;

        for (const w of SLOT_WINDOWS) {
          if (hour >= w.endHour) {
            pastSlots.push(w.key);
          } else if (hour >= w.startHour) {
            currentSlot = w.key;
            break;
          }
        }

        const todayPastMissing = pastSlots.filter(s => !todayChecked.has(s));
        if (todayPastMissing.length > 0) { setStatus("red"); return; }

        if (!currentSlot) {
          // Nach 18 Uhr — alle 5 Slots müssen erledigt sein
          setStatus(SLOT_WINDOWS.every(w => todayChecked.has(w.key)) ? "green" : "red");
          return;
        }

        setStatus(todayChecked.has(currentSlot) ? "green" : "yellow");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ===== 2.5 Wareneingänge =====
function dateStrHook(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export function useWareneingaengeStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("wareneingaenge-updated", onUpdate);
    return () => { clearInterval(id); window.removeEventListener("wareneingaenge-updated", onUpdate); };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    const now = new Date();
    const holidays = getBavarianHolidays(now.getFullYear());
    if (isClosed(now, holidays)) { setStatus("none"); return; }
    let cancelled = false;
    fetch(`${BASE}/wareneingang-today-summary?marketId=${selectedMarketId}&section=wareneingaenge`)
      .then(r => r.json())
      .then((rows: { type_id: number; liefertage: number[] | null; liefertage_ausnahmen: Record<string, string> | null; criteria_values: Record<string, string> | null }[]) => {
        if (cancelled) return;
        const wd = now.getDay();
        const ds = dateStrHook(now.getFullYear(), now.getMonth() + 1, now.getDate());
        let anyRed = false, anyYellow = false, anyGreen = false, anyExpected = false;
        for (const row of rows) {
          const lt = row.liefertage ?? [];
          const aus = row.liefertage_ausnahmen ?? {};
          const isLiefertag = aus[ds] === "liefertag" ? true
            : aus[ds] === "kein_liefertag" ? false
            : lt.includes(wd);
          if (!isLiefertag || lt.length === 0) continue;
          anyExpected = true;
          if (!row.criteria_values || Object.keys(row.criteria_values).length === 0) { anyRed = true; }
          else { anyGreen = true; }
        }
        if (!anyExpected) { setStatus("none"); return; }
        if (anyRed) { setStatus("red"); return; }
        if (anyYellow) { setStatus("yellow"); return; }
        setStatus(anyGreen ? "green" : "none");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ===== 3.1 Wareneingänge Metzgerei =====
export function useMetzgereiWareneingaengeStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("metzgerei-wareneingaenge-updated", onUpdate);
    return () => { clearInterval(id); window.removeEventListener("metzgerei-wareneingaenge-updated", onUpdate); };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    const now = new Date();
    const holidays = getBavarianHolidays(now.getFullYear());
    if (isClosed(now, holidays)) { setStatus("none"); return; }
    let cancelled = false;
    fetch(`${BASE}/wareneingang-today-summary?marketId=${selectedMarketId}&section=metzgerei`)
      .then(r => r.json())
      .then((rows: { type_id: number; liefertage: number[] | null; liefertage_ausnahmen: Record<string, string> | null; criteria_values: Record<string, string> | null }[]) => {
        if (cancelled) return;
        const wd = now.getDay();
        const ds = dateStrHook(now.getFullYear(), now.getMonth() + 1, now.getDate());
        let anyRed = false, anyGreen = false, anyExpected = false;
        for (const row of rows) {
          const lt = row.liefertage ?? [];
          const aus = row.liefertage_ausnahmen ?? {};
          const isLiefertag = aus[ds] === "liefertag" ? true
            : aus[ds] === "kein_liefertag" ? false
            : lt.includes(wd);
          if (!isLiefertag || lt.length === 0) continue;
          anyExpected = true;
          if (!row.criteria_values || Object.keys(row.criteria_values).length === 0) { anyRed = true; }
          else { anyGreen = true; }
        }
        if (!anyExpected) { setStatus("none"); return; }
        if (anyRed) { setStatus("red"); return; }
        setStatus(anyGreen ? "green" : "none");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ===== 3.2 Metzgerei Reinigungsplan =====
const METZ_DAILY_KEYS = [
  "vorb_fussboden","vorb_tuergriffe","vorb_arbeits","vorb_messer","vorb_geraete",
  "vorb_backofen","vorb_hygiene","vorb_abfall",
  "waren_transport","waren_annahme","waren_kuehl_boden",
  "theke_fussboden","theke_tueren","theke_tuergriffe","theke_arbeits","theke_waren",
  "theke_werkzeuge","theke_hackfleisch","theke_warmhalte","theke_waagen",
  "theke_verkauf","theke_fisch","theke_hygiene","theke_preise","theke_abfall",
];
const METZ_TOTAL_DAILY = METZ_DAILY_KEYS.length; // 25

const METZ_JAHR_REQS: { key: string; monate: number[] }[] = [
  { key:"j_grundrein_kuehl",   monate:[3,9] },
  { key:"j_grundrein_prod",    monate:[3,6,9,12] },
  { key:"j_grundrein_theke",   monate:[3,6,9,12] },
  { key:"j_schaedling",        monate:[1,4,7,10] },
  { key:"j_fettabscheider",    monate:[1,4,7,10] },
  { key:"j_kanalisation",      monate:[4,10] },
  { key:"j_maschinen_wartung", monate:[1,7] },
  { key:"j_kuehl_wartung",     monate:[5,11] },
  { key:"j_abluft",            monate:[1,7] },
];

function worstLight(a: TrafficLight, b: TrafficLight): TrafficLight {
  const rank: Record<TrafficLight, number> = { red:3, yellow:2, green:1, none:0 };
  return rank[a] >= rank[b] ? a : b;
}

export function useMetzgereiReinigungWocheStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("metz-reinigung-updated", onUpdate);
    return () => { clearInterval(id); window.removeEventListener("metz-reinigung-updated", onUpdate); };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }

    const now      = new Date();
    const holidays = getBavarianHolidays(now.getFullYear());
    const pad      = (n: number) => String(n).padStart(2, "0");
    const toStr    = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

    // Letzten Arbeitstag finden (heute wenn Werktag, sonst zurückgehen)
    const ref = new Date(now);
    for (let i = 0; i < 7; i++) {
      if (!isClosed(ref, holidays)) break;
      ref.setDate(ref.getDate() - 1);
    }
    const refStr = toStr(ref);

    // Montag der Woche des Referenztags
    const monday  = getMondayOfWeek(ref);
    const monStr  = toStr(monday);
    const satDate = new Date(monday); satDate.setDate(monday.getDate() + 5);
    const satStr  = toStr(satDate);

    let cancelled = false;
    // Ganze Woche laden um vergangene Tage prüfen zu können
    fetch(`${BASE}/metz-reinigung?marketId=${selectedMarketId}&von=${monStr}&bis=${satStr}`)
      .then(r => r.json())
      .then((entries: { itemKey: string; datum: string }[]) => {
        if (cancelled) return;

        // Prüfe vergangene Werktage dieser Woche (Mo bis ref-Tag) auf Lücken
        const refStart = new Date(ref); refStart.setHours(0,0,0,0);
        let hasMissed = false;

        for (let d = new Date(monday); d <= refStart; d.setDate(d.getDate()+1)) {
          if (isClosed(d, holidays)) continue;
          const ds = toStr(d);
          const dayDone = new Set(entries.filter(e => e.datum === ds).map(e => e.itemKey));
          const doneCount = METZ_DAILY_KEYS.filter(k => dayDone.has(k)).length;
          if (doneCount < METZ_TOTAL_DAILY) { hasMissed = true; break; }
        }

        if (!hasMissed) { setStatus("green"); return; }

        // Referenztag selbst geprüft
        const refDone = new Set(entries.filter(e => e.datum === refStr).map(e => e.itemKey));
        const refCount = METZ_DAILY_KEYS.filter(k => refDone.has(k)).length;

        if (refCount >= METZ_TOTAL_DAILY) { setStatus("yellow"); return; } // vergangene Tage lückig
        if (refCount > 0)                 { setStatus("yellow"); return; }
        setStatus("red");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

export function useMetzgereiReinigungJahrStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("metz-reinigung-updated", onUpdate);
    return () => { clearInterval(id); window.removeEventListener("metz-reinigung-updated", onUpdate); };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    const now        = new Date();
    const year       = now.getFullYear();
    const curMonth   = now.getMonth() + 1;
    let cancelled    = false;

    fetch(`${BASE}/metz-reinigung?marketId=${selectedMarketId}&von=${year}-01-01&bis=${year}-12-31`)
      .then(r => r.json())
      .then((entries: { itemKey: string; datum: string }[]) => {
        if (cancelled) return;

        // Signierte (key, monat) Paare bestimmen
        const signed = new Set<string>();
        for (const e of entries) {
          const m = parseInt(e.datum.slice(5, 7), 10);
          signed.add(`${e.itemKey}__${m}`);
        }

        let total = 0, done = 0;
        for (const req of METZ_JAHR_REQS) {
          for (const m of req.monate) {
            if (m > curMonth) continue; // Zukunft ignorieren
            total++;
            if (signed.has(`${req.key}__${m}`)) done++;
          }
        }
        if (total === 0)         { setStatus("none"); return; }
        if (done === total)      { setStatus("green"); return; }
        if (done >= total * 0.7) { setStatus("yellow"); return; }
        setStatus("red");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

export function useMetzgereiReinigungStatus(): TrafficLight {
  const woche = useMetzgereiReinigungWocheStatus();
  const jahr  = useMetzgereiReinigungJahrStatus();
  return worstLight(woche, jahr);
}

// ===== 2.2 Reinigungsdokumentation täglich =====
const REINIGUNG_AREA_COUNT = 12;

export function useReinigungTaeglichStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("reinigung-taeglich-updated", onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener("reinigung-taeglich-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }

    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.getDate();
    const hour  = now.getHours();

    const holidays = getBavarianHolidays(year);

    if (isClosed(now, holidays)) { setStatus("none"); return; }

    let cancelled = false;

    fetch(`${BASE}/reinigung-taeglich?marketId=${selectedMarketId}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((entries: { day: number; area: string }[]) => {
        if (cancelled) return;

        const monday    = getMondayOfWeek(now);
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

        for (let d = new Date(monday); d < todayStart; d.setDate(d.getDate() + 1)) {
          if (isClosed(d, holidays)) continue;
          if (d.getMonth() + 1 !== month) continue;
          const dayNum = d.getDate();
          const count  = entries.filter(e => e.day === dayNum).length;
          if (count < REINIGUNG_AREA_COUNT) {
            setStatus("red");
            return;
          }
        }

        const todayCount = entries.filter(e => e.day === today).length;
        if (todayCount >= REINIGUNG_AREA_COUNT) { setStatus("green"); return; }
        if (todayCount > 0)                     { setStatus("yellow"); return; }
        setStatus(hour >= 8 ? "yellow" : "none");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ─── Käsetheke-Ampel (3.4) ──────────────────────────────────────────────────
// Grün  = alle 3 Arten heute eingetragen
// Gelb  = heute noch nicht vollständig (aber noch kein vergangener Tag offen)
// Rot   = mindestens ein vergangener Tag ohne Eintrag ODER heute fehlt nach Ladenöffnung

const KAESETHEKE_ARTEN = ["reifeschrank", "kaesekühlschrank", "heisse_theke"] as const;

export function useKaesethekeStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("kaesetheke-updated", onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener("kaesetheke-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }

    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.getDate();
    const hour  = now.getHours();

    let cancelled = false;

    fetch(`${BASE}/kaesetheke-kontrolle?marketId=${selectedMarketId}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((entries: { day: number; kontrolle_art: string }[]) => {
        if (cancelled) return;

        // Vergangene Tage prüfen (alle 3 Arten müssen vorhanden sein)
        for (let d = 1; d < today; d++) {
          for (const art of KAESETHEKE_ARTEN) {
            if (!entries.some(e => e.day === d && e.kontrolle_art === art)) {
              setStatus("red");
              return;
            }
          }
        }

        // Heute prüfen
        const todayComplete = KAESETHEKE_ARTEN.every(art =>
          entries.some(e => e.day === today && e.kontrolle_art === art)
        );
        if (todayComplete) { setStatus("green"); return; }

        const todayPartial = KAESETHEKE_ARTEN.some(art =>
          entries.some(e => e.day === today && e.kontrolle_art === art)
        );
        if (todayPartial) { setStatus("yellow"); return; }

        setStatus(hour >= 7 ? "yellow" : "none");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ─── 3.8 GQ-Betriebsbegehung – Quartalsampel ────────────────────────────────
function currentGQQuartal() {
  const m = new Date().getMonth() + 1;
  return m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
}

function gqQuartalEnd(year: number, q: number): Date {
  const ends: [number, number][] = [[3,31],[6,30],[9,30],[12,31]];
  const [em, ed] = ends[q - 1];
  return new Date(year, em - 1, ed, 23, 59, 59);
}

export function useGQBegehungStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("gq-begehung-updated", onUpdate);
    return () => { clearInterval(id); window.removeEventListener("gq-begehung-updated", onUpdate); };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    const now   = new Date();
    const year  = now.getFullYear();
    const q     = currentGQQuartal();
    const qEnd  = gqQuartalEnd(year, q);
    const daysLeft = Math.ceil((qEnd.getTime() - now.getTime()) / 86400000);
    let cancelled  = false;

    fetch(`${BASE}/gq-begehung?tenantId=1&marketId=${selectedMarketId}&year=${year}&quartal=${q}`)
      .then(r => r.json())
      .then((data: unknown[]) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) { setStatus("green"); return; }
        if (daysLeft < 0)   { setStatus("red");    return; }
        if (daysLeft <= 14) { setStatus("yellow");  return; }
        setStatus("none");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ===== 1.1 Verantwortlichkeiten – Jahresampel =====
export function useResponsibilitiesStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    let cancelled = false;

    fetch(`${BASE}/markets/${selectedMarketId}/responsibilities?year=${year}`)
      .then(r => r.json())
      .then((items: { responsibleName?: string | null }[]) => {
        if (cancelled) return;
        const hasFilled = Array.isArray(items) && items.some(r => r.responsibleName && r.responsibleName.trim() !== "");
        if (hasFilled) { setStatus("green"); return; }
        if (month >= 11) { setStatus("red"); return; }
        setStatus("yellow");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ===== 1.5 Reinigungsplan Jahr – Monatsampel =====
const ANNUAL_PLAN_ITEMS: { key: string; activeMonths: number[] }[] = [
  { key: "vp_schraenke", activeMonths: [1,4,7,10] },
  { key: "vp_lueftungsgitter", activeMonths: [1,4,7,10] },
  { key: "vp_decken_lampen", activeMonths: [1,7] },
  { key: "vp_fettabscheider", activeMonths: [1,4,7,10] },
  { key: "th_verkaufstheke", activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { key: "th_schraenke", activeMonths: [1,4,7,10] },
  { key: "th_lueftungsgitter", activeMonths: [1,4,7,10] },
  { key: "th_decken_lampen", activeMonths: [1,7] },
  { key: "wbl_kuehleinrichtungen", activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { key: "wbl_tk_trocken", activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { key: "wbl_lueftungsgitter", activeMonths: [1,4,7,10] },
  { key: "wbl_tk_nass", activeMonths: [1] },
  { key: "wbl_decken_lampen", activeMonths: [1,7] },
  { key: "wbl_aussenrampe", activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
];

/** Gibt den letzten Monat der Periode zurück, die beim activeMonth beginnt.
 *  Z.B. halbjährlich [1,7]: Periode 1 → Ende 6, Periode 2 → Ende 12
 *       jährlich [1]:       Periode 1 → Ende 12
 *       monatlich [1..12]:  Periode m → Ende m  */
function periodEndMonth(activeMonths: number[], idx: number): number {
  if (idx + 1 < activeMonths.length) return activeMonths[idx + 1] - 1;
  return 12;
}

export function useAnnualCleaningPlanStatus(): TrafficLight {
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    let cancelled = false;

    fetch(`${BASE}/cleaning-plan?tenantId=1&year=${year}`)
      .then(r => r.json())
      .then((confirmations: { itemKey: string; month: number }[]) => {
        if (cancelled) return;

        const confirmedSet = new Set(
          confirmations.map(c => `${c.itemKey}__${c.month}`)
        );

        let anyOverdue = false;
        let hasCurrentItems = false;
        let allCurrentDone = true;

        for (const item of ANNUAL_PLAN_ITEMS) {
          for (let i = 0; i < item.activeMonths.length; i++) {
            const am = item.activeMonths[i];
            const periodEnd = periodEndMonth(item.activeMonths, i);

            if (periodEnd < month) {
              // Periode vollständig abgelaufen → auf Überfall prüfen
              if (!confirmedSet.has(`${item.key}__${am}`)) {
                anyOverdue = true;
              }
            } else if (am <= month) {
              // Wir befinden uns innerhalb dieser Periode
              hasCurrentItems = true;
              if (!confirmedSet.has(`${item.key}__${am}`)) {
                allCurrentDone = false;
              }
            }
            // Zukünftige Perioden (am > month) → ignorieren
          }
        }

        if (anyOverdue)        { setStatus("red");    return; }
        if (!hasCurrentItems)  { setStatus("none");   return; }
        if (allCurrentDone)    { setStatus("green");  return; }
        setStatus("yellow");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [tick]);

  return status;
}

// ===== 1.6 Betriebsbegehung – Quartalsampel =====
export function useBetriebsbegehungStatus(): TrafficLight {
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const curQ = Math.ceil((now.getMonth() + 1) / 3);
    let cancelled = false;

    fetch(`${BASE}/betriebsbegehung?tenantId=1`)
      .then(r => r.json())
      .then((reports: { quartal: number; year: number }[]) => {
        if (cancelled) return;
        const thisYear = reports.filter(r => r.year === year);
        const doneQ = new Set(thisYear.map(r => r.quartal));

        if (doneQ.has(curQ)) { setStatus("green"); return; }
        if (curQ > 1 && !doneQ.has(curQ - 1)) { setStatus("red"); return; }
        setStatus("yellow");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [tick]);

  return status;
}

// ─── 3.3 Öffnung Salate & Eigenherstellung – MHD-Ampel ───────────────────────
export function useOeffnungSalateStatus(): TrafficLight {
  const { selectedMarketId } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    const onUpdate = () => setTick(t => t + 1);
    window.addEventListener("oeffnung-salate-updated", onUpdate);
    return () => {
      clearInterval(id);
      window.removeEventListener("oeffnung-salate-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }

    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(now);

    let cancelled = false;

    fetch(`${BASE}/oeffnung-salate?marketId=${selectedMarketId}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((entries: { verbrauchsdatum: string | null; aufgebrauchtAm: string | null }[]) => {
        if (cancelled) return;
        const mitMhd = entries.filter(e => !!e.verbrauchsdatum);
        if (mitMhd.length === 0) { setStatus("none"); return; }
        const abgelaufen = mitMhd.filter(e => !!e.verbrauchsdatum && e.verbrauchsdatum < todayStr && !e.aufgebrauchtAm);
        setStatus(abgelaufen.length > 0 ? "red" : "green");
      })
      .catch(() => { if (!cancelled) setStatus("none"); });

    return () => { cancelled = true; };
  }, [selectedMarketId, tick]);

  return status;
}

// ─── 1.4 Schulungsnachweise – Jahresampel ─────────────────────────────────────
export function useSchulungsnachweiseStatus(): TrafficLight {
  const { selectedMarketId, selectedYear } = useAppStore();
  const [status, setStatus] = useState<TrafficLight>("none");

  useEffect(() => {
    if (!selectedMarketId) { setStatus("none"); return; }
    let cancelled = false;

    const types = ["schulungsprotokoll", "taraschulung", "lebensmittelleitkultur", "strohschwein"];

    Promise.all(
      types.map(type =>
        fetch(`${BASE}/markets/${selectedMarketId}/training-sessions?year=${selectedYear}&type=${type}`)
          .then(r => r.json())
          .then((data: unknown[]) => Array.isArray(data) && data.length > 0)
          .catch(() => false)
      )
    ).then(results => {
      if (cancelled) return;
      const allDone = results.every(r => r);
      if (allDone) { setStatus("green"); return; }
      const now = new Date();
      const jan31 = new Date(selectedYear, 0, 31, 23, 59, 59);
      setStatus(now > jan31 ? "red" : "yellow");
    });

    return () => { cancelled = true; };
  }, [selectedMarketId, selectedYear]);

  return status;
}
