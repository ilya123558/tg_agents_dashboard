'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChinaFlag } from '@/shared/ui/icons/ChinaFlag';

const CATEGORIES = [
  { href: '/china', label: 'Китайские товары', icon: <ChinaFlag size={24} />, active: true },
  { href: '/stroy', label: 'Стройматериалы',   icon: <span className="text-base">🏗</span>,  active: false },
  { href: '/bio',   label: 'Биохакинг',        icon: <span className="text-base">💊</span>,  active: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col bg-[#111] border-r border-white/5 min-h-screen">
      <div className="px-4 py-5 border-b border-white/5">
        <span className="text-sm font-semibold text-white">TG Agents</span>
        <span className="block text-xs text-gray-600 mt-0.5">CRM Dashboard</span>
      </div>
      <nav className="p-2 flex-1">
        {CATEGORIES.map((cat) => {
          const isActive = pathname === cat.href || (pathname === '/' && cat.href === '/china');
          return (
            <Link
              key={cat.href}
              href={cat.active ? cat.href : '#'}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : cat.active
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  : 'text-gray-700 cursor-not-allowed'
              }`}
            >
              <span className="w-6 h-6 rounded overflow-hidden flex items-center justify-center shrink-0">
                {cat.icon}
              </span>
              <span>{cat.label}</span>
              {!cat.active && (
                <span className="ml-auto text-[10px] text-gray-700 bg-white/5 px-1.5 py-0.5 rounded">
                  скоро
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
