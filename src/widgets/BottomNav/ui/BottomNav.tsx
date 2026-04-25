'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChinaFlag } from '@/shared/ui/icons/ChinaFlag';

const CATEGORIES = [
  { href: '/china', label: 'Китай',   icon: <ChinaFlag size={28} />, active: true },
  { href: '/stroy', label: 'Стройка', icon: <span className="text-xl">🏗</span>,  active: false },
  { href: '/bio',   label: 'Био',     icon: <span className="text-xl">💊</span>,  active: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/5 flex z-50">
      {CATEGORIES.map((cat) => {
        const isActive = pathname === cat.href || (pathname === '/' && cat.href === '/china');
        return (
          <Link
            key={cat.href}
            href={cat.active ? cat.href : '#'}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
              isActive ? 'text-white' : cat.active ? 'text-gray-500' : 'text-gray-800'
            }`}
          >
            <span className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
              {cat.icon}
            </span>
            <span>{cat.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
