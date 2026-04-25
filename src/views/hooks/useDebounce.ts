import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Дебаунсит значение — возвращает обновлённое значение только после паузы.
 * Используй для: инпутов поиска, фильтров — когда нужно подождать пока пользователь перестанет вводить.
 *
 * @param value - Значение для дебаунса
 * @param delay - Задержка в мс
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   fetchResults(debouncedSearch); // вызовется только после паузы в 500мс
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Дебаунсит функцию — вызывает её только после паузы с момента последнего вызова.
 * Используй для: кнопок отправки, обработчиков событий — когда нет значения, а есть действие.
 *
 * @param callback - Функция для дебаунса
 * @param delay - Задержка в мс
 *
 * @example
 * const handleClick = useDebouncedCallback(() => {
 *   sendRequest();
 * }, 1000);
 *
 * <button onClick={handleClick}>Отправить</button>
 * // сколько бы раз не кликнул — запрос уйдёт один раз через 1000мс после последнего клика
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}
