import { useState } from 'react';
import { getStorage, hasStorage, removeStorage, setStorage } from '../lib/storage';

/**
 * Синхронизирует состояние React с localStorage.
 * Для работы без состояния используй getStorage / setStorage / removeStorage напрямую.
 *
 * @param key - Ключ в localStorage
 * @param initialValue - Начальное значение если ключа ещё нет (по умолчанию undefined)
 *
 * @example
 * const { value, setValue, removeValue } = useLocalStorage('theme', 'light');
 * const { value } = useLocalStorage<string>('theme'); // value: string | undefined
 *
 * setValue('dark');  // обновляет state + localStorage
 * removeValue();     // удаляет из localStorage, сбрасывает state в initialValue
 */
export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [value, setStateValue] = useState<T | undefined>(() => {
    if (typeof window === 'undefined') return initialValue;
    if (!hasStorage(key) && initialValue !== undefined) {
      setStorage(key, initialValue);
    }
    return getStorage(key, initialValue);
  });

  const setValue = (next: T | ((prev: T | undefined) => T)) => {
    const valueToStore = next instanceof Function ? next(value) : next;
    setStateValue(valueToStore);
    setStorage(key, valueToStore);
  };

  const removeValue = () => {
    removeStorage(key);
    setStateValue(initialValue);
  };

  return { value, setValue, removeValue };
}
