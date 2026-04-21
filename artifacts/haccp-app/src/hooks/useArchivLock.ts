import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "/api";

export interface ArchivLock {
  id: number;
  marketId: number;
  year: number;
  lockedAt: string;
  lockedBy: number | null;
  lockedByName: string | null;
}

const cache: Record<string, { locked: boolean; info: ArchivLock | null; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 Minute

export function useArchivLock(year: number, marketId: number | null) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<ArchivLock | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketId || !year) { setIsLocked(false); setLockInfo(null); return; }
    const key = `${marketId}-${year}`;
    const cached = cache[key];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setIsLocked(cached.locked);
      setLockInfo(cached.info);
      return;
    }
    setLoading(true);
    fetch(`${BASE}/archiv/locks?marketId=${marketId}&year=${year}`)
      .then(r => r.json())
      .then((rows: ArchivLock[]) => {
        const info = rows.length > 0 ? rows[0] : null;
        const locked = rows.length > 0;
        cache[key] = { locked, info, ts: Date.now() };
        setIsLocked(locked);
        setLockInfo(info);
      })
      .catch(() => { setIsLocked(false); setLockInfo(null); })
      .finally(() => setLoading(false));
  }, [year, marketId]);

  return { isLocked, lockInfo, loading };
}

export function invalidateArchivCache(marketId: number, year: number) {
  const key = `${marketId}-${year}`;
  delete cache[key];
}
