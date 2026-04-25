'use client';

import { ReactNode } from 'react';
import { StoreProvider } from './StoreProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
}
