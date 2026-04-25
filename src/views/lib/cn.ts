/**
 * Объединяет CSS-классы в одну строку, отфильтровывая falsy-значения.
 *
 * @example
 * cn('btn', isActive && 'btn--active', undefined) // 'btn btn--active'
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
