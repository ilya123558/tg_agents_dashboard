type PriceSeparator = ' ' | '.' | ',';

interface FormatPriceOptions {
  separator?: PriceSeparator;
  suffix?: string;
}

/**
 * Форматирует число или строку в цену с разделителем тысяч.
 *
 * @param value - Число или строка для форматирования
 * @param options.separator - Разделитель тысяч: ' ' | '.' | ',' (по умолчанию ' ')
 * @param options.suffix - Суффикс без автоматического отступа (добавь сам при необходимости)
 *
 * @example
 * formatPrice(10000)                             // '10 000'
 * formatPrice(10000, { separator: '.' })         // '10.000'
 * formatPrice(10000, { suffix: '₽' })            // '10 000₽'
 * formatPrice(10000, { suffix: ' руб.' })        // '10 000 руб.'
 * formatPrice(10000, { separator: ',', suffix: '$' }) // '10,000$'
 */
export function formatPrice(value: number | string, options?: FormatPriceOptions): string {
  const { separator = ' ', suffix } = options ?? {};
  const num = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '')) : value;
  if (isNaN(num)) return String(value);
  const formatted = Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return suffix ? `${formatted}${suffix}` : formatted;
}

/**
 * Форматирует дату в читаемый вид на русском языке.
 *
 * @example
 * formatDate(new Date('2024-01-15')) // '15 января 2024 г.'
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
