import { useEffect, useMemo } from "react";
import { useListMarkets } from "@workspace/api-client-react";

const CACHE_KEY = "mika-markets-cache";

// Fallback-Daten: bekannte EDEKA DALLMANN Filialen
// Werden sofort angezeigt wenn API nicht erreichbar ist
const FALLBACK_MARKETS = [
  {
    id: 1, tenantId: 1, name: "Leeder", code: "LEE",
    address: "Bahnhofstraße 28, 86925 Fuchstal",
    lat: "47.9778", lng: "10.8047", geoRadiusKm: 10,
    planRotiert: false, betriebsstart: null,
    createdAt: "2026-03-17T12:22:22.112Z",
  },
  {
    id: 2, tenantId: 1, name: "Buching", code: "BUC",
    address: "Mühlfeld 10, 87642 Halblech",
    lat: "47.6917", lng: "10.7731", geoRadiusKm: 10,
    planRotiert: false, betriebsstart: null,
    createdAt: "2026-03-17T12:22:22.112Z",
  },
  {
    id: 3, tenantId: 1, name: "MOD", code: "MOD",
    address: "Ruderatshofenerstraße 81a, 87616 Marktoberdorf",
    lat: "47.7763", lng: "10.6203", geoRadiusKm: 10,
    planRotiert: false, betriebsstart: null,
    createdAt: "2026-03-17T12:22:22.112Z",
  },
];

function loadFromCache() {
  try {
    const s = localStorage.getItem(CACHE_KEY);
    if (!s) return undefined;
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function saveToCache(data: unknown) {
  try {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  } catch {}
}

export function useMarketsWithCache() {
  // Reihenfolge: 1. localStorage-Cache, 2. Fallback-Daten
  const initialData = useMemo(() => loadFromCache() ?? FALLBACK_MARKETS, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useListMarkets(undefined, {
    query: {
      initialData,
      initialDataUpdatedAt: 0, // Immer frische Daten vom Server holen
    } as any,
  });

  // Erfolgreiche API-Antwort im Cache speichern
  useEffect(() => {
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      saveToCache(result.data);
    }
  }, [result.data]);

  return result;
}
