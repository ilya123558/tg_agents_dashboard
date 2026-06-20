/**
 * Форматирует размер в байтах в читаемый вид.
 *
 * @param bytes - Размер в байтах
 * @param decimals - Количество знаков после запятой (по умолчанию 2)
 *
 * @example
 * formatBytes(0)           // '0 Bytes'
 * formatBytes(1024)        // '1 KB'
 * formatBytes(1048576)     // '1 MB'
 * formatBytes(1500, 1)     // '1.5 KB'
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Возвращает промис, который разрешается через указанное время.
 * Используй для: искусственных задержек, тестирования загрузки.
 *
 * @param ms - Задержка в мс
 *
 * @example
 * await sleep(500); // подождать 500мс
 *
 * // имитация загрузки
 * setLoading(true);
 * await sleep(1000);
 * setLoading(false);
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
