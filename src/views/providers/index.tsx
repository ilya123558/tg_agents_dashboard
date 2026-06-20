'use client';

import { ReactNode } from 'react';
import { StoreProvider } from './StoreProvider';
import { UIShellProvider } from './UIShellProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      <UIShellProvider>
        {children}
      </UIShellProvider>
    </StoreProvider>
  );
}

export { useUIShell } from './UIShellProvider';
