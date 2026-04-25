/**
 * Ограничивает частоту вызова функции — не чаще одного раза за указанный интервал.
 * В отличие от debounce, вызывает функцию сразу, затем игнорирует повторные вызовы до конца интервала.
 *
 * Используй для: scroll, resize, mousemove — когда нужна регулярность, а не ожидание паузы.
 *
 * @param func - Функция для ограничения
 * @param limit - Минимальный интервал между вызовами в мс
 *
 * @example
 * const handleScroll = throttle(() => console.log(window.scrollY), 500);
 * window.addEventListener('scroll', handleScroll); // максимум 2 вызова в секунду
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
