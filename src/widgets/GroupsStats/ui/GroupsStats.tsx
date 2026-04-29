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
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-sm font-medium text-white">По группам</span>
        <span className="text-xs text-gray-600">{raw.length} групп · {total} {label}</span>
      </div>

      {/* Bars */}
      <div className="px-4 py-3 space-y-3">
        {raw.map(([group, count], i) => {
          const pct = Math.round((count / total) * 100);
          const color = PALETTE[i % PALETTE.length];
          const barWidth = (count / max) * 100;

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs text-gray-400 truncate flex-1">{group}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-600">{pct}%</span>
                  <span className="text-xs font-semibold text-white w-5 text-right">{count}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 + 0.1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex flex-wrap gap-2">
        {raw.slice(0, 4).map(([group, count], i) => (
          <div key={group} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-[10px] text-gray-600 truncate max-w-[80px]">{group.split(' ')[0]}</span>
          </div>
        ))}
        {raw.length > 4 && (
          <span className="text-[10px] text-gray-700">+{raw.length - 4} ещё</span>
        )}
      </div>
    </div>
  );
}
