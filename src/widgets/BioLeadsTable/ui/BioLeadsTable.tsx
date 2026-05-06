'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BioLead, BioLeadStatus, BioReadiness } from '@/entities/BioLead';
import { BioLeadCard } from '@/widgets/BioLeadCard';

type SortKey = 'date_desc' | 'date_asc' | 'readiness' | 'expertise';

const READINESS_ORDER: Record<string, number> = { горячий: 0, тёплый: 1, холодный: 2 };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc',  label: '↓ Новые сначала' },
  { value: 'date_asc',   label: '↑ Старые сначала' },
  { value: 'readiness',  label: '🔥 По готовности' },
  { value: 'expertise',  label: '⚗️ Эксперты сначала' },
];

const STATUSES: (BioLeadStatus | 'все')[] = ['все', 'новый', 'отправлено', 'ответил', 'не ответил', 'архив'];
const READINESS_FILTERS: (BioReadiness | 'все')[] = ['все', 'горячий', 'тёплый', 'холодный'];

const READINESS_BADGE: Record<BioReadiness, { label: string; active: string; inactive: string }> = {
  горячий:  { label: '🔥 Горячий',  active: 'bg-red-500/20 border-red-500/40 text-red-300',    inactive: 'text-gray-500 border-white/[0.06] hover:text-red-400 hover:border-red-500/30' },
  тёплый:   { label: '☀️ Тёплый',   active: 'bg-amber-500/20 border-amber-500/40 text-amber-300', inactive: 'text-gray-500 border-white/[0.06] hover:text-amber-400 hover:border-amber-500/30' },
  холодный: { label: '❄️ Холодный', active: 'bg-blue-500/20 border-blue-500/40 text-blue-300',   inactive: 'text-gray-500 border-white/[0.06] hover:text-blue-400 hover:border-blue-500/30' },
};

function sortLeads(leads: BioLead[], sort: SortKey): BioLead[] {
  return [...leads].sort((a, b) => {
    if (sort === 'date_desc' || sort === 'date_asc') {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return sort === 'date_desc' ? tb - ta : ta - tb;
    }
    if (sort === 'readiness') {
      const ra = READINESS_ORDER[a.readiness ?? ''] ?? 3;
      const rb = READINESS_ORDER[b.readiness ?? ''] ?? 3;
      if (ra !== rb) return ra - rb;
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    }
    if (sort === 'expertise') {
      const ea = a.expertise === 'разбирается' ? 0 : 1;
      const eb = b.expertise === 'разбирается' ? 0 : 1;
      if (ea !== eb) return ea - eb;
      const ra = READINESS_ORDER[a.readiness ?? ''] ?? 3;
      const rb = READINESS_ORDER[b.readiness ?? ''] ?? 3;
      return ra - rb;
    }
    return 0;
  });
}

interface Props { leads: BioLead[] }

export function BioLeadsTable({ leads }: Props) {
  const [statusFilter, setStatusFilter]       = useState<BioLeadStatus | 'все'>('все');
  const [readinessFilter, setReadinessFilter] = useState<BioReadiness | 'все'>('все');
  const [genderFilter, setGenderFilter]       = useState<'все' | 'мужской' | 'женский'>('все');
  const [sort, setSort]                       = useState<SortKey>('readiness');
  const [sortOpen, setSortOpen]               = useState(false);
  const [hydrated, setHydrated]               = useState(false);

  // Restore filters + scroll from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bio-filters');
      if (saved) {
        const f = JSON.parse(saved);
        if (f.statusFilter)   setStatusFilter(f.statusFilter);
        if (f.readinessFilter) setReadinessFilter(f.readinessFilter);
        if (f.genderFilter)   setGenderFilter(f.genderFilter);
        if (f.sort)           setSort(f.sort);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const scroll = sessionStorage.getItem('bio-scroll');
    if (scroll) {
      sessionStorage.removeItem('bio-scroll');
      requestAnimationFrame(() => window.scrollTo({ top: parseInt(scroll, 10) }));
    }
  }, [hydrated]);

  // Persist filters
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem('bio-filters', JSON.stringify({ statusFilter, readinessFilter, genderFilter, sort }));
  }, [statusFilter, readinessFilter, genderFilter, sort, hydrated]);

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== 'все')   result = result.filter((l) => l.status === statusFilter);
    if (readinessFilter !== 'все') result = result.filter((l) => l.readiness === readinessFilter);
    if (genderFilter !== 'все')   result = result.filter((l) => l.gender === genderFilter);
    return sortLeads(result, sort);
  }, [leads, statusFilter, readinessFilter, genderFilter, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { все: leads.length };
    leads.forEach((l) => { c[l.status] = (c[l.status] ?? 0) + 1; });
    return c;
  }, [leads]);

  const readinessCounts = useMemo(() => {
    const c: Record<string, number> = { все: leads.length };
    leads.forEach((l) => { if (l.readiness) c[l.readiness] = (c[l.readiness] ?? 0) + 1; });
    return c;
  }, [leads]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)!;

  return (
    <div className="space-y-4">

      {/* FILTER BAR — status */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.94 }}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
              statusFilter === s
                ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                : 'bg-transparent border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/20'
            }`}
          >
            {s === 'все' ? 'Все' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-[10px] opacity-60">{counts[s] ?? 0}</span>
          </motion.button>
        ))}
      </div>

      {/* FILTER BAR 2 — readiness + gender + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Readiness filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReadinessFilter('все')}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
              readinessFilter === 'все'
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
            }`}
          >
            Все
          </button>
          {READINESS_FILTERS.filter((r) => r !== 'все').map((r) => {
            const cfg = READINESS_BADGE[r as BioReadiness];
            return (
              <motion.button
                key={r}
                whileTap={{ scale: 0.92 }}
                onClick={() => setReadinessFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                  readinessFilter === r ? cfg.active : `bg-transparent ${cfg.inactive}`
                }`}
              >
                {cfg.label}
                <span className="ml-1 opacity-60 text-[10px]">{readinessCounts[r] ?? 0}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Gender filter */}
        <div className="flex items-center gap-1 ml-1">
          {(['все', 'мужской', 'женский'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                genderFilter === g
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
              }`}
            >
              {g === 'все' ? 'Все' : g === 'мужской' ? '♂ Муж' : '♀ Жен'}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] border border-emerald-900/40 bg-emerald-950/30 text-emerald-400 hover:border-emerald-700/50 transition-all"
          >
            <span>{currentSort.label}</span>
            <svg className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full mt-1 z-50 bg-[#0e1a12] border border-emerald-900/40 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-emerald-900/20 transition-colors ${
                      opt.value === sort ? 'text-emerald-400 bg-emerald-900/20' : 'text-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">
          Показано <span className="text-emerald-500/80 font-medium">{filtered.length}</span> из {leads.length}
        </span>
        {filtered.length !== leads.length && (
          <button
            onClick={() => { setStatusFilter('все'); setReadinessFilter('все'); setGenderFilter('все'); }}
            className="text-[11px] text-gray-700 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            сбросить
          </button>
        )}
      </div>

      {/* CARDS GRID */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-3xl mb-3 opacity-30">💊</div>
          <p className="text-sm text-gray-600">Нет лидов по выбранным фильтрам</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered.map((lead, i) => (
              <BioLeadCard key={lead.id} lead={lead} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
