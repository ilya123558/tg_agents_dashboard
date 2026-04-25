'use client';

import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { StatusSelect } from './StatusSelect';

export function LeadCard({ lead }: { lead: Lead }) {
  const [updateStatus] = useUpdateLeadStatusMutation();

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-200 leading-relaxed flex-1">{lead.text || '—'}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
        <span>{lead.group || '—'}</span>
        {lead.date && (
          <>
            <span>·</span>
            <span>
              {new Date(lead.date).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </>
        )}
      </div>

      {lead.comment && (
        <p className="text-xs text-gray-500 bg-white/[0.03] rounded-lg px-3 py-2 leading-relaxed">
          {lead.comment}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          {lead.author && (
            <a href={lead.author} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-400">
              {lead.author.replace('https://t.me/', '@')}
            </a>
          )}
          {lead.link && (
            <a href={lead.link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-400">
              → сообщение
            </a>
          )}
        </div>
        <StatusSelect
          value={lead.status as LeadStatus}
          onChange={(status) => updateStatus({ id: lead.id, status })}
        />
      </div>
    </div>
  );
}
