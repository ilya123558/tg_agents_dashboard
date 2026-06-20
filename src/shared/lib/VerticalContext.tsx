'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type Vertical = 'electronics' | 'clothing' | 'cars' | 'stroy';

const Ctx = createContext<Vertical>('electronics');

export function VerticalProvider({ value, children }: { value: Vertical; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVertical(): Vertical {
  return useContext(Ctx);
}
