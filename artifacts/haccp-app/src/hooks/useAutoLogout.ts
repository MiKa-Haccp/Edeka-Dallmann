import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function useAutoLogout() {
  const adminSession = useAppStore((s) => s.adminSession);
  const setAdminSession = useAppStore((s) => s.setAdminSession);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedIn = !!adminSession;

  const logout = useCallback(() => {
    setAdminSession(null);
  }, [setAdminSession]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    resetTimer();

    const handler = () => resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handler, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handler);
      }
    };
  }, [isLoggedIn, resetTimer]);
}
