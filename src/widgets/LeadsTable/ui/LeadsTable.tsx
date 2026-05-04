'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { LeadCard } from './LeadCard';
import { StatusSelect } from './StatusSelect';

const STATUSES: (LeadStatus | 'все')[] = ['все', 'новый', 'отправлено', 'ответил', 'не ответил'];

type SortDir = 'desc' | 'asc';

function sortByDate(items: Lead[], dir: SortDir) {
  return [...items].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return dir === 'desc' ? tb - ta : ta - tb;
  });
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<LeadStatus | 'все'>('все');
  const [sort, setSort] = useState<SortDir>('desc');
  const [updateStatus] = useUpdateLeadStatusMutation();

  const filtered = sortByDate(
    filter === 'все' ? leads : leads.filter((l) => l.status === filter),
    sort,
  );

  return (
    <div className="space-y-3">
      {/* Filter + sort row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map((s) => {
            const count = s === 'все' ? leads.length : leads.filter((l) => l.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1.5 text-gray-600">{count}</span>
              </button>
            );
          })}
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
            filtered.map((lead, i) => <LeadCard key={lead.id} lead={lead} index={i} />)
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-[#161616] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-gray-600 uppercase tracking-wider">
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
                  <td colSpan={6} className="text-center py-12 text-gray-600">Лидов не найдено</td>
                </tr>
              )}
              {filtered.map((lead, rowIdx) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: rowIdx * 0.03, ease: 'easeOut' }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-gray-300 line-clamp-2 text-xs leading-relaxed">{lead.text || '—'}</div>
                    {lead.link && (
                      <a href={lead.link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-xs mt-1 inline-block">→ сообщение</a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-xs">{lead.group || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.author
                      ? <a href={lead.author} target="_blank" rel="noopener noreferrer"
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
                  <td className="px-4 py-3">
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
