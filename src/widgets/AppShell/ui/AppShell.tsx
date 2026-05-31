'use client';

import { type ReactNode } from 'react';
import { Sidebar } from '@/widgets/Sidebar';
import { useUIShell } from '@/views/providers';

/**
 * Оболочка приложения: sidebar (desktop) + контентная колонка.
 * Внизу контентной колонки добавляется отступ под мобильную нижнюю навигацию,
 * который убирается когда `mobileFullscreen` активен (чат на весь экран).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { mobileFullscreen } = useUIShell();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 md:pb-0 ${
          mobileFullscreen ? 'pb-0' : 'pb-16'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
