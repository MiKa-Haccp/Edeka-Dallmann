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
