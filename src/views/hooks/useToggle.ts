import { useCallback, useState } from 'react';

/**
 * Булевый переключатель состояния.
 *
 * @param initialValue - Начальное значение (по умолчанию false)
 *
 * @returns [value, toggle, setTrue, setFalse]
 *
 * @example
 * const [isOpen, toggle, open, close] = useToggle();
 *
 * <button onClick={toggle}>Toggle</button>
 * <button onClick={open}>Open</button>
 * <button onClick={close}>Close</button>
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
}
