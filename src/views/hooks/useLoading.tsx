import { Loading } from "@/shared/ui/loading/Loading";
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

type TProps = { initialLoading?: boolean; ms_timeout?: number };

/**
 * Управляет состоянием загрузки с минимальным временем отображения.
 *
 * @param initialLoading - Начальное состояние загрузки (по умолчанию false)
 * @param ms_timeout - Минимальное время показа загрузки в мс (по умолчанию 0)
 *
 * @returns isLoading - текущее состояние загрузки
 * @returns setLoading - управление состоянием (true — начать, false — завершить)
 * @returns LoadingWrapper - компонент-обёртка: показывает спиннер пока isLoading, иначе children
 *
 * @example
 * // данные грузятся при монтировании
 * const { setLoading, LoadingWrapper } = useLoading({ initialLoading: true, ms_timeout: 500 });
 *
 * // загрузка по действию пользователя
 * const { setLoading, LoadingWrapper } = useLoading({ initialLoading: false });
 *
 * return <LoadingWrapper><Content /></LoadingWrapper>;
 */
export const useLoading = ({ initialLoading = false, ms_timeout = 0 }: TProps) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const startTimeRef = useRef<number>(initialLoading ? Date.now() : 0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLoading = (value: boolean) => {
    if (value) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      startTimeRef.current = Date.now();
      setIsLoading(true);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, ms_timeout - elapsed);

    if (remaining === 0) {
      setIsLoading(false);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const LoadingWrapper = useCallback(
    ({ children }: PropsWithChildren) => (
      <>
        {isLoading
          ? <Loading />
          : children
        }
      </>
    ),
    [isLoading]
  );

  return {
    isLoading,
    setLoading,
    LoadingWrapper,
  };
};
