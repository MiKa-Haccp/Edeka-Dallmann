import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

const BOOKING_RETURN_TIMEOUT_MS = 60 * 1000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "pointerdown",
];

const EXEMPT_PATHS = ["/", "/admin", "/admin/login", "/admin/users"];

export function useBookingAutoReturn() {
  const [location, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExempt = EXEMPT_PATHS.some(
    (p) => location === p || location.startsWith("/admin")
  );

  const navigateHome = useCallback(() => {
    setLocation("/");
  }, [setLocation]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(navigateHome, BOOKING_RETURN_TIMEOUT_MS);
  }, [navigateHome]);

  useEffect(() => {
    if (isExempt) {
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
  }, [isExempt, resetTimer]);
}
