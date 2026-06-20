'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CursorGlow() {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const x = useSpring(mx, { stiffness: 90, damping: 22 });
  const y = useSpring(my, { stiffness: 90, damping: 22 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX - 200);
      my.set(e.clientY - 200);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mx, my]);

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] rounded-full z-50"
      style={{
        x,
        y,
        background: 'radial-gradient(circle, rgba(255,255,255,0.038) 0%, transparent 68%)',
      }}
    />
  );
}
