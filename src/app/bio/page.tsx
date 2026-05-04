'use client';

import { useGetBioLeadsQuery } from '@/entities/BioLead';
import { BioLeadsTable } from '@/widgets/BioLeadsTable';
import { motion } from 'framer-motion';

function BioStats({ leads }: { leads: any[] }) {
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

export default function BioPage() {
  const { data, isLoading, isError, refetch } = useGetBioLeadsQuery();

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
            💊
          </motion.span>
          <div>
            <span className="font-semibold text-white text-sm">Биохакинг</span>
            <span className="block text-[11px] text-emerald-700/80">Клиенты Александра</span>
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
            <BioStats leads={data.leads} />
            <BioLeadsTable leads={data.leads} />
          </>
        )}
      </main>
    </>
  );
}
