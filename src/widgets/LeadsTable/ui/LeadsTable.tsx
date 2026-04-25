'use client';

import { useState } from 'react';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { LeadCard } from './LeadCard';
import { StatusSelect } from './StatusSelect';

const STATUSES: (LeadStatus | 'все')[] = ['все', 'новый', 'отправлено', 'ответил', 'не ответил'];

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<LeadStatus | 'все'>('все');
  const [updateStatus] = useUpdateLeadStatusMutation();

  const filtered = filter === 'все' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUSES.map((s) => {
          const count = s === 'все' ? leads.length : leads.filter((l) => l.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-gray-600">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">Лидов не найдено</div>
        ) : (
          filtered.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Текст</th>
                <th className="text-left px-4 py-3 font-medium">Группа</th>
                <th className="text-left px-4 py-3 font-medium">Автор</th>
                <th className="text-left px-4 py-3 font-medium">Дата</th>
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
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-gray-200 line-clamp-2 text-xs leading-relaxed">{lead.text || '—'}</div>
                    {lead.link && (
                      <a href={lead.link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-xs mt-1 inline-block">
                        → сообщение
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs">{lead.group || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.author ? (
                      <a href={lead.author} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-xs">
                        {lead.author.replace('https://t.me/', '@')}
                      </a>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-500 text-xs">
                      {lead.date ? new Date(lead.date).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-gray-400 text-xs line-clamp-2">{lead.comment || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={lead.status as LeadStatus}
                      onChange={(status) => updateStatus({ id: lead.id, status })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
