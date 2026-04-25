'use client';

import type { Lead } from '@/entities/Lead';

export function GroupsStats({ leads }: { leads: Lead[] }) {
  const stats = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      const g = l.group || 'Без группы';
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const max = stats[0]?.[1] ?? 1;

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <span className="text-sm font-medium text-white">Статистика по группам</span>
        <span className="ml-2 text-xs text-gray-600">{stats.length} групп</span>
      </div>
      <div className="divide-y divide-white/5">
        {stats.map(([group, count]) => (
          <div key={group} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs text-gray-400 w-48 shrink-0 truncate">{group}</span>
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-white w-6 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
