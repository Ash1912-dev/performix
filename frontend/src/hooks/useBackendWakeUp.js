import { useCallback, useEffect, useRef, useState } from 'react';

const PING_INTERVAL = 3000;
const PING_TIMEOUT = 5000;
const MAX_WAIT = 120000;

export default function useBackendWakeUp() {
  const [isAwake, setIsAwake] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const pingBackend = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    try {
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    startTimeRef.current = Date.now();

    const check = async () => {
      const alive = await pingBackend();

      if (!isMounted) return;

      if (alive) {
        setIsAwake(true);
        setIsChecking(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      if (Date.now() - startTimeRef.current >= MAX_WAIT) {
        setHasTimedOut(true);
        setIsChecking(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // First check immediately
    check();

    intervalRef.current = setInterval(check, PING_INTERVAL);

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pingBackend]);

  return { isAwake, isChecking, hasTimedOut };
}
