'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIShell } from '@/views/providers';

const CATEGORIES = [
  { href: '/electronics', label: 'Электроника', icon: '📱', active: true },
  { href: '/clothing',    label: 'Одежда',      icon: '👗', active: true },
  { href: '/cars',        label: 'Машины',      icon: '🚗', active: true },
  { href: '/stroy',       label: 'Стройка',     icon: '🏗',  active: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { mobileFullscreen } = useUIShell();

  return (
    <AnimatePresence>
      {!mobileFullscreen && (
        <motion.nav
          key="bottom-nav"
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-sm border-t border-white/5 flex z-50">
      {CATEGORIES.map((cat) => {
        const isActive =
          pathname === cat.href ||
          (pathname === '/' && cat.href === '/electronics') ||
          pathname.startsWith(cat.href + '/');

        return (
          <Link
            key={cat.href}
            href={cat.active ? cat.href : '#'}
            className={`relative flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
              isActive ? 'text-white' : cat.active ? 'text-gray-500' : 'text-gray-800'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-bar"
                className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-white"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
              />
            )}
            <motion.span
              className="w-7 h-7 flex items-center justify-center text-xl"
              whileTap={cat.active ? { scale: 0.82 } : undefined}
              animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              {cat.icon}
            </motion.span>
            <span>{cat.label}</span>
          </Link>
        );
      })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
