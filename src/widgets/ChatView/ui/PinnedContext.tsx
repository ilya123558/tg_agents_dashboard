'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead } from '@/entities/Lead';
import { isPinnedHidden, setPinnedHidden } from '@/shared/lib/conversations';

interface PinnedContextProps {
  lead: Lead;
}

/**
 * Закреплённый блок: исходное сообщение лида из группы. Можно скрыть.
 * Визуально отличается от обычных bubble — фон тёплый янтарный, иконка булавки.
 */
export function PinnedContext({ lead }: PinnedContextProps) {
  const [hidden, setHidden] = useState<boolean>(() => isPinnedHidden(lead.id));
  const [expanded, setExpanded] = useState(false);

  if (hidden) {
    return (
      <motion.button
        type="button"
        onClick={() => { setHidden(false); setPinnedHidden(lead.id, false); }}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-3 text-[10px] text-gray-600 hover:text-gray-400 transition-colors
                   bg-white/[0.03] hover:bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.05]"
      >
        📌 Показать исходное сообщение
      </motion.button>
    );
  }

  const dateStr = lead.date
    ? new Date(lead.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  const isLong = (lead.text?.length ?? 0) > 180;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="mx-3 mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-amber-500/10 bg-amber-500/[0.03]">
        <span className="text-amber-400 text-xs">📌</span>
        <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-medium flex-1">
          Из чата группы
        </div>
        <button
          type="button"
          onClick={() => { setHidden(true); setPinnedHidden(lead.id, true); }}
          className="text-[10px] text-amber-400/60 hover:text-amber-300 transition-colors px-1.5 py-0.5 rounded
                     hover:bg-amber-500/10"
          title="Скрыть"
        >
          скрыть
        </button>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3">
        <AnimatePresence initial={false}>
          {expanded || !isLong ? (
            <motion.p
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
            >
              {lead.text || '—'}
            </motion.p>
          ) : (
            <motion.p
              key="short"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-200 leading-relaxed line-clamp-3"
            >
              {lead.text || '—'}
            </motion.p>
          )}
        </AnimatePresence>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] text-amber-400/70 hover:text-amber-300 mt-1.5 transition-colors"
          >
            {expanded ? '↑ свернуть' : '↓ читать полностью'}
          </button>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-amber-500/10">
          {lead.group && (
            <span className="text-[10px] text-gray-500">📍 {lead.group}</span>
          )}
          {dateStr && (
            <span className="text-[10px] text-gray-600 tabular-nums">{dateStr}</span>
          )}
          {lead.link && (
            <a href={lead.link} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 ml-auto transition-colors">
              → к сообщению в группе
            </a>
          )}
        </div>

        {/* AI comment */}
        {lead.comment && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-500/10 flex gap-2">
            <span className="text-xs shrink-0 mt-0.5">🤖</span>
            <p className="text-[11px] text-gray-400 leading-relaxed">{lead.comment}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
