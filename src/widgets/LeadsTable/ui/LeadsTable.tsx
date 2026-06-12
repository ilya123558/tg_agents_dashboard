'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { LeadCard } from './LeadCard';
import { StatusSelect } from './StatusSelect';
import { AssigneePicker } from '@/features/AssigneeMarker';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useConversations } from '@/shared/lib/useConversations';

type SortDir = 'desc' | 'asc';
type StatusFilter = LeadStatus | 'все';
type AssigneeFilter = 'all' | 'unassigned' | string;

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
  const [updateStatus] = useUpdateLeadStatusMutation();
  const { get: getAssignee, managers, countBy } = useAssignees();
  const { hasReplied } = useConversations();

  // 1) статус → 2) поиск → 3) менеджер → 4) сортировка
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = statusFilter === 'все' ? leads : leads.filter((l) => l.status === statusFilter);
    if (q) {
      list = list.filter((l) => {
        const hay = `${l.author ?? ''} ${l.group ?? ''} ${l.text ?? ''} ${l.comment ?? ''}`.toLowerCase();
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
    return sortByDate(list, sort);
  }, [leads, statusFilter, search, assigneeFilter, sort, getAssignee]);

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
    const c = countBy(list);
    const unassigned = list.filter((l) => getAssignee(l.author ?? '') == null).length;
    return { ...c, unassigned, all: list.length } as Record<string, number>;
  }, [leads, statusFilter, search, countBy, getAssignee]);

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

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-600 text-sm"
            >
              Лидов не найдено
            </motion.div>
          ) : (
            filtered.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} onOpenChat={onOpenChat} replied={hasReplied(lead.author)} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-[#161616] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-gray-600 uppercase tracking-wider">
                <th className="px-3 py-3 font-medium w-8"></th>
                <th className="text-left px-4 py-3 font-medium">Текст</th>
                <th className="text-left px-4 py-3 font-medium">Группа</th>
                <th className="text-left px-4 py-3 font-medium">Автор</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => setSort(v => v === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                  >
                    Дата
                    <motion.span
                      animate={{ rotate: sort === 'asc' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      ↓
                    </motion.span>
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Комментарий AI</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">Лидов не найдено</td>
                </tr>
              )}
              {filtered.map((lead, rowIdx) => {
                const replied = hasReplied(lead.author);
                return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: rowIdx * 0.03, ease: 'easeOut' }}
                  onClick={() => onOpenChat?.(lead)}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors
                              ${onOpenChat ? 'cursor-pointer' : ''}
                              ${replied ? 'bg-emerald-500/[0.025]' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <AssigneePicker author={lead.author} size="md" />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-gray-300 line-clamp-2 text-xs leading-relaxed">{lead.text || '—'}</div>
                    {lead.link && (
                      <a href={lead.link} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-400 text-xs mt-1 inline-block">→ сообщение</a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-xs">{lead.group || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {lead.author
                        ? <a href={lead.author} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 text-xs">
                            {lead.author.replace('https://t.me/', '@')}
                          </a>
                        : <span className="text-gray-700 text-xs">—</span>}
                      {replied && (
                        <span title="Ответил в личке" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          ответил
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-600 text-xs">
                      {lead.date ? new Date(lead.date).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-gray-500 text-xs line-clamp-2">{lead.comment || '—'}</span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect
                      value={lead.status as LeadStatus}
                      onChange={(status) => updateStatus({ id: lead.id, status })}
                    />
                  </td>
                </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
