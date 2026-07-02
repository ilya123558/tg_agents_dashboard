'use client';

import { motion } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { AssigneePicker } from '@/features/AssigneeMarker';
import { StatusSelect } from './StatusSelect';

const STATUS_BADGE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'новый':      { label: 'Новый',      dot: 'bg-blue-400',   text: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  'отправлено': { label: 'Отправлено', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'ответил':    { label: 'Ответил',    dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  'не ответил': { label: 'Не ответил', dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};

interface LeadCardProps {
  lead: Lead;
  index?: number;
  onOpenChat?: (lead: Lead) => void;
  replied?: boolean;
  /** Если передан — статус можно менять прямо на карточке (селект вместо бейджа). */
  onStatusChange?: (status: LeadStatus) => void;
}

export function LeadCard({
  lead, index = 0, onOpenChat, replied = false, onStatusChange,
}: LeadCardProps) {
  const badge = STATUS_BADGE[lead.status] ?? STATUS_BADGE['новый'];
  const username = lead.author ? lead.author.replace(/^https?:\/\/t\.me\//i, '@').replace(/^@?/, '@') : null;
  const dateStr = lead.date
    ? new Date(lead.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      onClick={() => onOpenChat?.(lead)}
      className={`group relative flex flex-col h-[300px] overflow-hidden rounded-2xl border
                  bg-[#161616] transition-all duration-200
                  ${onOpenChat ? 'cursor-pointer' : ''}
                  ${replied
                    ? 'border-emerald-500/25 hover:border-emerald-500/45'
                    : 'border-white/[0.07] hover:border-white/20'}
                  hover:bg-[#1a1a1a] hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}
    >
      {/* Header: менеджер + статус + ответил + дата */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5" onClick={(e) => e.stopPropagation()}>
        <AssigneePicker author={lead.author} size="md" />
        {onStatusChange ? (
          <StatusSelect value={lead.status as LeadStatus} onChange={onStatusChange} />
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        )}
        {replied && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            ответил
          </span>
        )}
        {dateStr && <span className="ml-auto text-[11px] text-gray-600 shrink-0 tabular-nums">{dateStr}</span>}
      </div>

      {/* Автор + регион */}
      <div className="flex items-center gap-2 px-4 pb-2 min-w-0">
        {username ? (
          <a
            href={lead.author ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-white hover:text-blue-300 transition-colors truncate"
          >
            {username}
          </a>
        ) : (
          <span className="text-sm font-semibold text-gray-500 truncate">без автора</span>
        )}
        {lead.region?.trim() && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/15 text-[10px] font-medium">
            <span className="opacity-70">📍</span>
            {lead.region.trim()}
          </span>
        )}
      </div>

      {/* Тело: текст + AI-комментарий (обрезаются, заполняют высоту) */}
      <div className="flex-1 min-h-0 overflow-hidden px-4">
        <p className="text-[13px] text-gray-200 leading-relaxed line-clamp-3">
          {lead.text || '—'}
        </p>
        {lead.comment && (
          <div className="mt-2.5 flex gap-2 rounded-xl border border-white/[0.05] bg-white/[0.035] px-3 py-2">
            <span className="shrink-0 text-xs mt-px">🤖</span>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{lead.comment}</p>
          </div>
        )}
      </div>

      {/* Footer: группа + понятный CTA */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[11px] text-gray-500">
          {lead.group || '—'}
        </span>
        {onOpenChat ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors group-hover:text-blue-300">
            Открыть чат
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        ) : lead.link ? (
          <a
            href={lead.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-[11px] text-gray-500 transition-colors hover:text-gray-300"
          >
            → сообщение
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}
