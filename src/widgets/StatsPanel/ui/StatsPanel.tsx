'use client';

import type { Lead } from '@/entities/Lead';

interface StatsPanelProps {
  leads: Lead[];
}

const STATUS_COLORS: Record<string, string> = {
  'новый': 'text-blue-400',
  'отправлено': 'text-yellow-400',
  'ответил': 'text-green-400',
  'не ответил': 'text-red-400',
};

export function StatsPanel({ leads }: StatsPanelProps) {
  const total = leads.length;
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const groups = new Set(leads.map((l) => l.group)).size;

  const stats = [
    { label: 'Всего лидов', value: total, color: 'text-white' },
    { label: 'Новых', value: byStatus['новый'] ?? 0, color: STATUS_COLORS['новый'] },
    { label: 'Отправлено', value: byStatus['отправлено'] ?? 0, color: STATUS_COLORS['отправлено'] },
    { label: 'Ответили', value: byStatus['ответил'] ?? 0, color: STATUS_COLORS['ответил'] },
    { label: 'Не ответили', value: byStatus['не ответил'] ?? 0, color: STATUS_COLORS['не ответил'] },
    { label: 'Групп', value: groups, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
