/**
 * Склоняет слово в зависимости от числа (для русского языка).
 *
 * @param count - Число
 * @param forms - [1 товар, 2 товара, 5 товаров]
 *
 * @example
 * pluralize(1, ['товар', 'товара', 'товаров'])   // '1 товар'
 * pluralize(3, ['товар', 'товара', 'товаров'])   // '3 товара'
 * pluralize(11, ['товар', 'товара', 'товаров'])  // '11 товаров'
 */
export function pluralize(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  const n = abs % 10;

  if (abs > 10 && abs < 20) return `${count} ${forms[2]}`;
  if (n > 1 && n < 5) return `${count} ${forms[1]}`;
  if (n === 1) return `${count} ${forms[0]}`;
  return `${count} ${forms[2]}`;
}

/**
 * Обрезает строку до указанной длины и добавляет суффикс.
 *
 * @param text - Исходная строка
 * @param maxLength - Максимальная длина
 * @param suffix - Суффикс (по умолчанию '...')
 *
 * @example
 * truncate('Длинный заголовок статьи', 10)        // 'Длинный за...'
 * truncate('Длинный заголовок статьи', 10, ' →')  // 'Длинный за →'
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + suffix;
}

/**
 * Делает первую букву строки заглавной.
 *
 * @example
 * capitalize('привет мир') // 'Привет мир'
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
