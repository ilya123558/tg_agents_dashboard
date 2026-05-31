'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface UIShellContextValue {
  /** Скрыть глобальную нижнюю навигацию (на mobile). Используется когда чат открыт во весь экран. */
  mobileFullscreen: boolean;
  setMobileFullscreen: (v: boolean) => void;
}

const UIShellContext = createContext<UIShellContextValue | null>(null);

export function UIShellProvider({ children }: { children: ReactNode }) {
  const [mobileFullscreen, setMobileFullscreenState] = useState(false);

  const setMobileFullscreen = useCallback((v: boolean) => setMobileFullscreenState(v), []);

  const value = useMemo<UIShellContextValue>(
    () => ({ mobileFullscreen, setMobileFullscreen }),
    [mobileFullscreen, setMobileFullscreen],
  );

  return <UIShellContext.Provider value={value}>{children}</UIShellContext.Provider>;
}

export function useUIShell(): UIShellContextValue {
  const ctx = useContext(UIShellContext);
  if (!ctx) {
    // Безопасный фоллбек, если хук вызван вне провайдера.
    return { mobileFullscreen: false, setMobileFullscreen: () => {} };
  }
  return ctx;
}
