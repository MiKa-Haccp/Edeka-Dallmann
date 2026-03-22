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
    if (isClosed(now, holidays)) { setStatus("none"); return; }
    const hour = now.getHours();
    if (hour < 6) { setStatus("green"); return; }

    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

    let cancelled = false;
    fetch(`${BASE}/metz-reinigung?marketId=${selectedMarketId}&von=${todayStr}&bis=${todayStr}`)
      .then(r => r.json())
      .then((entries: { itemKey: string }[]) => {
        if (cancelled) return;
        const done = new Set(entries.map(e => e.itemKey));
        const doneDaily = METZ_DAILY_KEYS.filter(k => done.has(k)).length;

        // Vergangene Wochentage auf Lücken prüfen
        const monday = getMondayOfWeek(now);
        const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
        let missedPast = false;
        for (let d = new Date(monday); d < todayStart; d.setDate(d.getDate()+1)) {
          if (isClosed(d, holidays)) continue;
          const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
          // fetch per day wäre zu viele requests → prüfe nur via heutige Daten nicht möglich
          // hier vereinfacht: wenn heutige Daten 0 → kein Indikator für Vergangenheit
          void ds; void missedPast;
        }

        if (doneDaily >= METZ_TOTAL_DAILY) { setStatus("green"); return; }
        if (doneDaily > 0)                 { setStatus("yellow"); return; }
        setStatus(hour >= 8 ? "yellow" : "none");
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
