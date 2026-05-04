'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import { useUpdateLeadStatusMutation } from '@/entities/Lead';
import { StatusSelect } from './StatusSelect';

const STATUS_BADGE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'новый':      { label: 'Новый',      dot: 'bg-blue-400',   text: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  'отправлено': { label: 'Отправлено', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'ответил':    { label: 'Ответил',    dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  'не ответил': { label: 'Не ответил', dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};

const LONG_TEXT = 120;

export function LeadCard({ lead, index = 0 }: { lead: Lead; index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [updateStatus] = useUpdateLeadStatusMutation();
  const badge = STATUS_BADGE[lead.status] ?? STATUS_BADGE['новый'];
  const isLong = (lead.text?.length ?? 0) > LONG_TEXT;

  const dateStr = lead.date
    ? new Date(lead.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, delay: 0 } }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative bg-[#161616] border border-white/[0.07] rounded-2xl p-4 space-y-3
                 hover:border-white/[0.15] hover:bg-[#1a1a1a] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                 transition-all duration-200 cursor-default"
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text}`}>
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {badge.label}
        </span>
        {dateStr && <span className="text-[11px] text-gray-600">{dateStr}</span>}
      </div>

      {/* Text with expand */}
      <div>
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.p
              key="full"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-200 leading-relaxed overflow-hidden"
            >
              {lead.text || '—'}
            </motion.p>
          ) : (
            <motion.p
              key="short"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-gray-200 leading-relaxed line-clamp-2"
            >
              {lead.text || '—'}
            </motion.p>
          )}
        </AnimatePresence>
        {isLong && (
          <motion.button
            onClick={() => setExpanded(v => !v)}
            whileTap={{ scale: 0.95 }}
            className="mt-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            {expanded ? '↑ свернуть' : '↓ читать полностью'}
          </motion.button>
        )}
      </div>

      {/* AI comment */}
      {lead.comment && (
        <div className="flex gap-2 bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.04]">
          <span className="text-xs shrink-0 mt-px">🤖</span>
          <p className="text-[11px] text-gray-400 leading-relaxed">{lead.comment}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-1 border-t border-white/[0.05] flex flex-wrap items-center gap-x-3 gap-y-2">
        {lead.author && (
          <a href={lead.author} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            {lead.author.replace('https://t.me/', '@')}
          </a>
        )}
        {lead.group && (
          <span className="text-[11px] text-gray-600 truncate max-w-[160px]">{lead.group}</span>
        )}
        {lead.link && (
          <a href={lead.link} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors whitespace-nowrap">
            → сообщение
          </a>
        )}
        <div className="ml-auto">
          <StatusSelect
            value={lead.status as LeadStatus}
            onChange={(status) => updateStatus({ id: lead.id, status })}
          />
        </div>
      </div>
    </motion.div>
  );
}
