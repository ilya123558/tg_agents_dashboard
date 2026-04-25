import { RefObject, useEffect } from 'react';

/**
 * Вызывает callback при клике вне указанного элемента.
 * Используй для: модалок, дропдаунов, тултипов.
 *
 * @param ref - Ref элемента
 * @param callback - Функция, вызываемая при клике снаружи
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 *
 * return <div ref={ref}>Dropdown</div>;
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void
): void {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}
