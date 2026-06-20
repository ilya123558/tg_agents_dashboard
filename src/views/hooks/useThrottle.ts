import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Дебаунсит значение по принципу throttle — обновляет не чаще одного раза за интервал.
 * Используй для: отслеживания позиции скролла, координат мыши в состоянии.
 *
 * @param value - Значение для throttle
 * @param limit - Минимальный интервал обновления в мс
 *
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 200);
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = limit - (now - lastUpdated.current);

    if (remaining <= 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Дебаунсит функцию по принципу throttle — вызывает не чаще одного раза за интервал.
 * Используй для: scroll, resize, mousemove обработчиков.
 *
 * @param callback - Функция для throttle
 * @param limit - Минимальный интервал между вызовами в мс
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   console.log(window.scrollY);
 * }, 200);
 *
 * window.addEventListener('scroll', handleScroll);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => (inThrottle.current = false), limit);
    }
  }, [callback, limit]);
}
