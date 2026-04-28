import { useState, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export type GeoStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error"
  | "insecure";

export function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface MarketWithGeo {
  id: number;
  name: string;
  code: string;
  lat?: string | null;
  lng?: string | null;
  geoRadiusKm?: number | null;
}

export function findNearestMarket(
  position: GeoPosition,
  markets: MarketWithGeo[]
): { market: MarketWithGeo; distanceKm: number } | null {
  let nearest: { market: MarketWithGeo; distanceKm: number } | null = null;

  for (const market of markets) {
    if (!market.lat || !market.lng) continue;
    const lat = parseFloat(market.lat);
    const lng = parseFloat(market.lng);
    if (isNaN(lat) || isNaN(lng)) continue;

    const distanceKm = getDistanceKm(position.lat, position.lng, lat, lng);
    const radius = market.geoRadiusKm ?? 10;

    if (distanceKm <= radius) {
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { market, distanceKm };
      }
    }
  }

  return nearest;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    // Prüfen ob HTTPS-Kontext vorliegt (iOS Safari und Chrome blockieren GPS auf HTTP)
    const isSecure = typeof window !== "undefined" && window.isSecureContext;
    if (!isSecure) {
      setStatus("insecure");
      setError("HTTPS erforderlich. GPS-Ortung funktioniert nur über eine sichere HTTPS-Verbindung.");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("unavailable");
      setError("GPS wird von diesem Browser nicht unterstützt.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("GPS-Zugriff wurde verweigert.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus("unavailable");
          setError("Standort nicht verfügbar.");
        } else {
          setStatus("error");
          setError("Standortermittlung fehlgeschlagen.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, []);

  return { position, status, error, request };
}
