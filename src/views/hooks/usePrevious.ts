import { useEffect, useRef } from 'react';

/**
 * Возвращает предыдущее значение состояния или пропса.
 *
 * @param value - Текущее значение
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * // count = 5, prevCount = 4
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
