'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { LeadCard } from './LeadCard';
import { StatusSelect } from './StatusSelect';
import { AssigneePicker } from '@/features/AssigneeMarker';

type SortDir = 'desc' | 'asc';
type StatusFilter = LeadStatus | 'все';

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
  const [updateStatus] = useUpdateLeadStatusMutation();

  const filtered = sortByDate(
    statusFilter === 'все' ? leads : leads.filter((l) => l.status === statusFilter),
    sort,
  );

  return (
    <div className="space-y-3">
      {/* Top row — only sort (status is controlled via stat cards) */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500">
          {statusFilter === 'все' ? 'Все лиды' : `Фильтр: ${statusFilter}`}
          <span className="ml-2 text-gray-700">·</span>
          <span className="ml-2 text-gray-600 tabular-nums">{filtered.length}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSort(v => v === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
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
              {sort === 'desc' ? '↓ Сначала новые' : '↑ Сначала старые'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
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
            filtered.map((lead, i) => <LeadCard key={lead.id} lead={lead} index={i} onOpenChat={onOpenChat} />)
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
              {filtered.map((lead, rowIdx) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: rowIdx * 0.03, ease: 'easeOut' }}
                  onClick={() => onOpenChat?.(lead)}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors
                              ${onOpenChat ? 'cursor-pointer' : ''}`}
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
                    {lead.author
                      ? <a href={lead.author} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-400 hover:text-blue-300 text-xs">
                          {lead.author.replace('https://t.me/', '@')}
                        </a>
                      : <span className="text-gray-700 text-xs">—</span>}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
