'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { LeadCard } from './LeadCard';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useConversations } from '@/shared/lib/useConversations';

type SortDir = 'desc' | 'asc';
type StatusFilter = LeadStatus | 'все';
type AssigneeFilter = 'all' | 'unassigned' | string;
type RegionFilter = 'all' | string;

const REGION_UNKNOWN = '__no_region__';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function sortByDate(items: Lead[], dir: SortDir) {
  return [...items].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return dir === 'desc' ? tb - ta : ta - tb;
  });
}

interface LeadsTableProps {
  leads: Lead[];
  statusFilter?: StatusFilter;
  onOpenChat?: (lead: Lead) => void;
}

export function LeadsTable({ leads, statusFilter = 'все', onOpenChat }: LeadsTableProps) {
  const [sort, setSort] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [updateStatus] = useUpdateLeadStatusMutation();
  const { get: getAssignee, managers, countBy } = useAssignees();
  const { hasReplied, get: getConv } = useConversations();

  // «Живой» лид для счётчика: переписка ≤ недели ИЛИ добавлен ≤ недели без переписки.
  const isActiveLead = (l: Lead) => {
    const conv = getConv(l.author);
    const now = Date.now();
    if (conv) return now - new Date(conv.lastMessageAt).getTime() <= WEEK_MS;
    return l.date ? now - new Date(l.date).getTime() <= WEEK_MS : false;
  };

  // Список уникальных регионов из лидов (для дропдауна)
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    let hasUnknown = false;
    for (const l of leads) {
      const r = (l.region ?? '').trim();
      if (r) set.add(r);
      else hasUnknown = true;
    }
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
    return { regions: arr, hasUnknown };
  }, [leads]);

  // 1) статус → 2) поиск → 3) менеджер → 4) регион → 5) сортировка
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = statusFilter === 'все' ? leads : leads.filter((l) => l.status === statusFilter);
    if (q) {
      list = list.filter((l) => {
        const hay = `${l.author ?? ''} ${l.group ?? ''} ${l.text ?? ''} ${l.comment ?? ''} ${l.region ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (assigneeFilter !== 'all') {
      list = list.filter((l) => {
        const a = getAssignee(l.author ?? '');
        if (assigneeFilter === 'unassigned') return a == null;
        return a === assigneeFilter;
      });
    }
    if (regionFilter !== 'all') {
      list = list.filter((l) => {
        const r = (l.region ?? '').trim();
        if (regionFilter === REGION_UNKNOWN) return !r;
        return r === regionFilter;
      });
    }
    return sortByDate(list, sort);
  }, [leads, statusFilter, search, assigneeFilter, regionFilter, sort, getAssignee]);

  // Счётчики для чипов менеджеров (среди отфильтрованных по статусу+поиску, без фильтра менеджера)
  const counts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = statusFilter === 'все' ? leads : leads.filter((l) => l.status === statusFilter);
    if (q) {
      list = list.filter((l) => {
        const hay = `${l.author ?? ''} ${l.group ?? ''} ${l.text ?? ''} ${l.comment ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const active = list.filter(isActiveLead);   // то же недельное правило, что и в шапке
    const c = countBy(active);
    const unassigned = active.filter((l) => getAssignee(l.author ?? '') == null).length;
    return { ...c, unassigned, all: active.length } as Record<string, number>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, statusFilter, search, countBy, getAssignee, getConv]);

  return (
    <div className="space-y-3">
      {/* Search + sort row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по автору, группе, тексту..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-white/[0.04] border border-white/[0.06] rounded-xl
                       text-white placeholder:text-gray-700 focus:outline-none focus:border-white/15 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-gray-600
                         hover:text-gray-300 hover:bg-white/5 transition-colors text-sm leading-none"
              title="Очистить"
            >
              ×
            </button>
          )}
        </div>

        {(regionOptions.regions.length > 0 || regionOptions.hasUnknown) && (
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
            className="px-3 py-2 rounded-xl text-xs font-medium
                       text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]
                       border border-white/[0.06] transition-colors shrink-0
                       focus:outline-none focus:border-white/15
                       max-w-[160px]"
            title="Фильтр по региону"
          >
            <option value="all" className="bg-[#161616]">📍 Все регионы</option>
            {regionOptions.regions.map((r) => (
              <option key={r} value={r} className="bg-[#161616]">{r}</option>
            ))}
            {regionOptions.hasUnknown && (
              <option value={REGION_UNKNOWN} className="bg-[#161616]">— Без региона</option>
            )}
          </select>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSort(v => v === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                     text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]
                     border border-white/[0.06] transition-colors shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={sort}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {sort === 'desc' ? '↓ Новые' : '↑ Старые'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Manager filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setAssigneeFilter('all')}
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors
                      ${assigneeFilter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {assigneeFilter === 'all' && (
            <motion.span
              layoutId="leadstable-filter-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 bg-white/[0.08] rounded-full -z-10"
            />
          )}
          Все
          <span className="text-[10px] text-gray-600 tabular-nums">{counts.all}</span>
        </button>
        {managers.map((m) => {
          const active = assigneeFilter === m.id;
          const count = counts[m.id] ?? 0;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setAssigneeFilter(active ? 'all' : m.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors
                          ${active ? m.meta.text : 'text-gray-500 hover:text-gray-300'}`}
            >
              {active && (
                <motion.span
                  layoutId="leadstable-filter-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className={`absolute inset-0 rounded-full -z-10 ${m.meta.soft}`}
                />
              )}
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${m.meta.bg}`}>
                {m.initials}
              </span>
              {m.name}
              <span className="text-[10px] text-gray-600 tabular-nums">{count}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAssigneeFilter(assigneeFilter === 'unassigned' ? 'all' : 'unassigned')}
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors
                      ${assigneeFilter === 'unassigned' ? 'text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {assigneeFilter === 'unassigned' && (
            <motion.span
              layoutId="leadstable-filter-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 bg-gray-500/10 rounded-full -z-10"
            />
          )}
          <span className="w-3.5 h-3.5 rounded-full bg-gray-700 flex items-center justify-center text-[8px] font-bold text-white">?</span>
          Без менеджера
          <span className="text-[10px] text-gray-600 tabular-nums">{counts.unassigned}</span>
        </button>

        <div className="ml-auto text-[11px] text-gray-600 tabular-nums">{filtered.length} найдено</div>
      </div>

      {/* Карточки — адаптивная сетка (1 / 2 / 3 колонки) на всех экранах */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">Лидов не найдено</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={Math.min(i, 10)}
                onOpenChat={onOpenChat}
                replied={hasReplied(lead.author)}
                onStatusChange={(status) => updateStatus({ id: lead.id, status })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
