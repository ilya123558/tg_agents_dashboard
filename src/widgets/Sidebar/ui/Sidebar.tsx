'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { href: '/electronics', label: 'Электроника',    icon: '📱', active: true },
  { href: '/clothing',    label: 'Одежда',         icon: '👗', active: true },
  { href: '/bio',         label: 'Биохакинг',      icon: '💊', active: true },
  { href: '/ecopulse',    label: 'Ecopulse',       icon: '❤️', active: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col bg-[#111] border-r border-white/5 min-h-screen">
      <div className="px-4 py-5 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="text-sm font-semibold text-white">TG Agents</span>
          <span className="block text-xs text-gray-600 mt-0.5">CRM Dashboard</span>
        </motion.div>
      </div>

      <nav className="p-2 flex-1">
        {CATEGORIES.map((cat, i) => {
          const isActive =
            pathname === cat.href ||
            (pathname === '/' && cat.href === '/electronics') ||
            pathname.startsWith(cat.href + '/');

          return (
            <motion.div
              key={cat.href}
              className="relative mb-0.5"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: 'easeOut' }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 bg-white/10 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.42 }}
                />
              )}
              <Link
                href={cat.active ? cat.href : '#'}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'text-white'
                    : cat.active
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    : 'text-gray-700 cursor-not-allowed'
                }`}
              >
                <motion.span
                  className="w-6 h-6 flex items-center justify-center shrink-0 text-base"
                  whileHover={cat.active ? { scale: 1.22, rotate: 8 } : undefined}
                  transition={{ type: 'spring', stiffness: 350, damping: 12 }}
                >
                  {cat.icon}
                </motion.span>
                <span>{cat.label}</span>
                {!cat.active && (
                  <span className="ml-auto text-[10px] text-gray-700 bg-white/5 px-1.5 py-0.5 rounded">
                    скоро
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
