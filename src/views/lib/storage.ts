/**
 * Получает значение из localStorage.
 *
 * @param key - Ключ
 * @param fallback - Значение по умолчанию если ключа нет
 *
 * @example
 * getStorage('theme', 'light') // 'dark' или 'light' если нет
 */
export function getStorage<T>(key: string, fallback?: T): T | undefined {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Сохраняет значение в localStorage.
 *
 * @example
 * setStorage('theme', 'dark')
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`setStorage: failed to set "${key}"`, error);
  }
}

/**
 * Удаляет ключ из localStorage.
 *
 * @example
 * removeStorage('theme')
 */
export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`removeStorage: failed to remove "${key}"`, error);
  }
}

/**
 * Проверяет наличие ключа в localStorage.
 *
 * @example
 * hasStorage('theme') // true | false
 */
export function hasStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key) !== null;
}
