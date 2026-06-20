'use client';

import { motion } from 'framer-motion';
const PALETTE = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16',
];

interface Item { group?: string | null }

export function GroupsStats({ leads, label = 'лидов' }: { leads: Item[]; label?: string }) {
  const raw = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      const g = l.group || 'Без группы';
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const max = raw[0]?.[1] ?? 1;
  const total = leads.length;

  return (
    <div className="bg-[#161616] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white">По группам</span>
          <span className="text-[11px] text-gray-600">распределение {label}</span>
        </div>
        <span className="text-[11px] text-gray-600 tabular-nums">
          <span className="text-white font-semibold">{raw.length}</span> групп · <span className="text-white font-semibold">{total}</span> {label}
        </span>
      </div>

      {/* Bars — single column on mobile, 2 cols on md, 3 cols on lg */}
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
        {raw.length === 0 && (
          <div className="col-span-full text-center py-6 text-gray-700 text-xs">Нет данных</div>
        )}
        {raw.map(([group, count], i) => {
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          const color = PALETTE[i % PALETTE.length];
          const barWidth = max === 0 ? 0 : (count / max) * 100;

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 24) * 0.02, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-xs text-gray-400 truncate flex-1">{group}</span>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-[10px] text-gray-600">{pct}%</span>
                  <span className="text-xs font-semibold text-white w-6 text-right">{count}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, delay: Math.min(i, 24) * 0.02 + 0.05, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
