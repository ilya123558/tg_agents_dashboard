'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollToTopProps {
  /** При каком скролле (px) показывать кнопку. По умолчанию 400. */
  threshold?: number;
}

/**
 * Плавающая кнопка возврата наверх. Появляется когда window.scrollY > threshold.
 * Снизу-справа, на mobile поднята над нижней навигацией.
 */
export function ScrollToTop({ threshold = 400 }: ScrollToTopProps = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > threshold);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  function goTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          type="button"
          onClick={goTop}
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          title="Наверх"
          aria-label="Наверх"
          className="fixed right-4 md:right-6 bottom-20 md:bottom-6 z-40 w-11 h-11 rounded-full
                     bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15
                     text-white shadow-2xl flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
