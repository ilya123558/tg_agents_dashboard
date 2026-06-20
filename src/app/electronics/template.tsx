'use client';

import { motion } from 'framer-motion';
import { VerticalProvider } from '@/shared/lib/VerticalContext';

export default function ElectronicsTemplate({ children }: { children: React.ReactNode }) {
  return (
    <VerticalProvider value="electronics">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </VerticalProvider>
  );
}
