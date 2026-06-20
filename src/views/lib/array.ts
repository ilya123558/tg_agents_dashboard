/**
 * Группирует элементы массива по ключу.
 *
 * @param array - Исходный массив
 * @param key - Ключ для группировки
 *
 * @example
 * const products = [
 *   { category: 'phones', name: 'iPhone' },
 *   { category: 'phones', name: 'Samsung' },
 *   { category: 'tablets', name: 'iPad' },
 * ];
 *
 * groupBy(products, 'category');
 * // { phones: [...], tablets: [...] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    return {
      ...result,
      [group]: [...(result[group] ?? []), item],
    };
  }, {} as Record<string, T[]>);
}
