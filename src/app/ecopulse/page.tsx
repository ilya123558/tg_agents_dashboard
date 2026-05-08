'use client';

import { useState } from 'react';
import { useGetEcoLeadsQuery } from '@/entities/EcoLead';
import { EcoLeadsTable } from '@/widgets/EcoLeadsTable';
import { motion, AnimatePresence } from 'framer-motion';

function EcoStats({ leads }: { leads: any[] }) {
  const total    = leads.length;
  const hot      = leads.filter((l) => l.readiness === 'горячий').length;
  const warm     = leads.filter((l) => l.readiness === 'тёплый').length;
  const experts  = leads.filter((l) => l.expertise === 'разбирается').length;
  const answered = leads.filter((l) => l.status === 'ответил').length;

  const stats = [
    { label: 'Всего лидов',   value: total,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: '🔥 Горячих',    value: hot,     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
    { label: '☀️ Тёплых',     value: warm,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: '⚗️ Экспертов',  value: experts, color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: '✅ Ответили',   value: answered, color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
          className={`rounded-2xl border px-4 py-3 ${s.bg}`}
        >
          <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

const EMERALD_PALETTE = [
  'bg-emerald-400',
  'bg-emerald-500',
  'bg-teal-400',
  'bg-teal-500',
  'bg-green-400',
  'bg-green-500',
  'bg-cyan-400',
  'bg-cyan-500',
];

function EcoGroupsStats({ leads }: { leads: any[] }) {
  const [open, setOpen] = useState(false);

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
    <div className="bg-[#0c1810] border border-emerald-900/20 rounded-2xl overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between group hover:bg-emerald-900/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">По группам</span>
          <span className="text-[11px] text-emerald-700/80">{raw.length} групп · {total} лидов</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="text-gray-600 group-hover:text-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="groups"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">
              {raw.map(([group, count], i) => {
                const pct = Math.round((count / total) * 100);
                const barWidth = (count / max) * 100;
                const colorClass = EMERALD_PALETTE[i % EMERALD_PALETTE.length];

                return (
                  <motion.div
                    key={group}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                  >
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className="text-xs text-gray-400 truncate flex-1">{group}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-emerald-700/70">{pct}%</span>
                        <span className="text-xs font-semibold text-gray-300 w-5 text-right">{count}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-emerald-950/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${colorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 + 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer summary */}
            <div className="px-4 py-3 border-t border-emerald-900/15 flex flex-wrap gap-2">
              {raw.slice(0, 4).map(([group], i) => (
                <div key={group} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${EMERALD_PALETTE[i % EMERALD_PALETTE.length]}`} />
                  <span className="text-[10px] text-gray-600 truncate max-w-[90px]">{group.split(' ')[0]}</span>
                </div>
              ))}
              {raw.length > 4 && (
                <span className="text-[10px] text-emerald-700/70">+{raw.length - 4} ещё</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EcopulsePage() {
  const { data, isLoading, isError, refetch } = useGetEcoLeadsQuery();

  return (
    <>
      <header className="border-b border-emerald-900/20 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a120d]/90 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2.5">
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="text-xl"
          >
            ❤️
          </motion.span>
          <div>
            <span className="font-semibold text-white text-sm">Ecopulse</span>
            <span className="block text-[11px] text-emerald-700/80">Клиенты Олега</span>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-900/20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto w-full">

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-600 text-sm gap-2">
            <svg className="animate-spin w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Загружаю лидов…
          </div>
        )}

        {isError && (
          <div className="text-center py-24 text-red-500/70 text-sm">Ошибка загрузки</div>
        )}

        {data && (
          <>
            <EcoStats leads={data.leads} />
            <EcoGroupsStats leads={data.leads} />
            <EcoLeadsTable leads={data.leads} />
          </>
        )}
      </main>
    </>
  );
}
