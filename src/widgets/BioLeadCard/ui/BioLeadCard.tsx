'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { BioLead, BioLeadStatus } from '@/entities/BioLead';
import { useUpdateBioLeadStatusMutation } from '@/entities/BioLead';

const READINESS_CONFIG = {
  горячий: {
    label: '🔥 Горячий',
    bg: 'bg-red-500/15 border-red-500/30',
    text: 'text-red-400',
    glow: 'hover:shadow-[0_12px_40px_rgba(239,68,68,0.12)]',
    dot: 'bg-red-400',
    pulse: true,
  },
  тёплый: {
    label: '☀️ Тёплый',
    bg: 'bg-amber-500/15 border-amber-500/30',
    text: 'text-amber-400',
    glow: 'hover:shadow-[0_12px_40px_rgba(245,158,11,0.10)]',
    dot: 'bg-amber-400',
    pulse: false,
  },
  холодный: {
    label: '❄️ Холодный',
    bg: 'bg-blue-500/15 border-blue-500/30',
    text: 'text-blue-400',
    glow: '',
    dot: 'bg-blue-400',
    pulse: false,
  },
} as const;

const REQUEST_ICONS: Record<string, string> = {
  'найти специалиста':    '🎯',
  'расшифровка анализов': '🧪',
  'программа питания':    '🥗',
  'витамины и БАДы':      '💊',
  'просто совет':         '💬',
};

const PERSONALITY_STYLES: Record<string, string> = {
  аналитик:     'text-violet-400 bg-violet-500/10 border-violet-500/25',
  эмоциональный:'text-pink-400   bg-pink-500/10   border-pink-500/25',
  прагматик:    'text-cyan-400   bg-cyan-500/10   border-cyan-500/25',
  тревожный:    'text-orange-400 bg-orange-500/10 border-orange-500/25',
  открытый:     'text-green-400  bg-green-500/10  border-green-500/25',
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'новый':      { label: 'Новый',      dot: 'bg-blue-400',   text: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  'отправлено': { label: 'Отправлено', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'ответил':    { label: 'Ответил',    dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  'не ответил': { label: 'Не ответил', dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  'архив':      { label: 'Архив',      dot: 'bg-gray-500',  text: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
};

const STATUS_OPTIONS: { value: BioLeadStatus; label: string; color: string }[] = [
  { value: 'новый',      label: 'Новый',      color: 'text-blue-400' },
  { value: 'отправлено', label: 'Отправлено', color: 'text-yellow-400' },
  { value: 'ответил',    label: 'Ответил',    color: 'text-green-400' },
  { value: 'не ответил', label: 'Не ответил', color: 'text-red-400' },
  { value: 'архив',      label: 'Архив',      color: 'text-gray-400' },
];

function BioStatusSelect({ value, onChange }: { value: BioLeadStatus; onChange: (v: BioLeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-[#0a1510] border border-emerald-900/40 rounded-lg px-2.5 py-1.5 text-xs hover:border-emerald-700/50 transition-colors focus:outline-none"
      >
        <span className={current.color}>{current.label}</span>
        <svg className={`w-3 h-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 bottom-full mb-1 z-50 bg-[#0e1a12] border border-emerald-900/40 rounded-xl shadow-xl overflow-hidden min-w-[130px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-emerald-900/20 transition-colors flex items-center gap-2 ${opt.value === value ? 'bg-emerald-900/20' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  opt.value === 'новый' ? 'bg-blue-400' :
                  opt.value === 'отправлено' ? 'bg-yellow-400' :
                  opt.value === 'ответил' ? 'bg-green-400' :
                  opt.value === 'архив' ? 'bg-gray-500' : 'bg-red-400'
                }`} />
                <span className={opt.color}>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BioLeadCard({ lead, index = 0 }: { lead: BioLead; index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [updateStatus] = useUpdateBioLeadStatusMutation();
  const router = useRouter();

  const readiness   = lead.readiness ? READINESS_CONFIG[lead.readiness] : null;
  const statusBadge = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG['новый'];

  const dateStr = lead.date
    ? new Date(lead.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  const markersList = lead.markers
    ? lead.markers.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  const personalityType = lead.personality?.split(/[—–-]/)[0]?.trim().toLowerCase() ?? '';
  const personalityStyle = PERSONALITY_STYLES[personalityType] ?? 'text-gray-400 bg-white/5 border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, delay: 0 } }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => {
        if (typeof window !== 'undefined') sessionStorage.setItem('bio-scroll', String(window.scrollY));
        router.push(`/bio/lead/${lead.id}`);
      }}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer
        bg-[#0c1810] border-emerald-900/25
        hover:border-emerald-700/45 hover:bg-[#0e1f13]
        hover:shadow-[0_12px_40px_rgba(16,185,129,0.07)]
        ${readiness?.glow ?? ''}
      `}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

      <div className="p-4 space-y-3">

        {/* ROW 1: readiness + status badge + meta */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {readiness && (
              <motion.span
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.04 + 0.08, type: 'spring', stiffness: 450, damping: 16 }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${readiness.bg} ${readiness.text}`}
              >
                <motion.span
                  className={`w-1.5 h-1.5 rounded-full ${readiness.dot}`}
                  animate={readiness.pulse ? { opacity: [1, 0.25, 1], scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {readiness.label}
              </motion.span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
              {statusBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lead.gender && (
              <span className="text-sm opacity-70" title={lead.gender}>
                {lead.gender === 'мужской' ? '♂' : '♀'}
              </span>
            )}
            {lead.age && (
              <span className="text-[11px] text-emerald-500/70 font-medium tabular-nums">{lead.age}</span>
            )}
            {dateStr && <span className="text-[11px] text-gray-600">{dateStr}</span>}
          </div>
        </div>

        {/* ROW 2: PROBLEM — hero content */}
        {lead.problem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.04 + 0.12 }}
            className="relative pl-3"
          >
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/70 via-emerald-600/40 to-transparent" />
            <p className="text-sm text-gray-100 leading-relaxed">{lead.problem}</p>
          </motion.div>
        )}

        {/* ROW 3: MARKERS — medical chips */}
        {markersList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {markersList.slice(0, 8).map((marker, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 + i * 0.025 + 0.14 }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400/80 font-mono tracking-tight"
              >
                {marker}
              </motion.span>
            ))}
            {markersList.length > 8 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-600">
                +{markersList.length - 8}
              </span>
            )}
          </div>
        )}

        {/* ROW 4: INSIGHTS chips */}
        {(lead.requestType || personalityType || lead.expertise || lead.location) && (
          <div className="flex flex-wrap gap-1.5">
            {lead.requestType && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-gray-300">
                <span>{REQUEST_ICONS[lead.requestType] ?? '•'}</span>
                <span>{lead.requestType}</span>
              </span>
            )}
            {personalityType && (
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${personalityStyle}`}>
                <span>🧠</span>
                <span>{personalityType}</span>
              </span>
            )}
            {lead.expertise && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                lead.expertise === 'разбирается'
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  : 'bg-gray-500/10 border-gray-600/20 text-gray-400'
              }`}>
                {lead.expertise === 'разбирается' ? '⚗️ эксперт' : '🌱 новичок'}
              </span>
            )}
            {lead.location && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-gray-500">
                📍 {lead.location}
              </span>
            )}
          </div>
        )}

        {/* ROW 5: personality description */}
        {lead.personality && personalityType && (
          <div className="bg-black/20 rounded-xl px-3 py-2 border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 leading-relaxed">{lead.personality}</p>
          </div>
        )}

        {/* ROW 6: AI comment */}
        {lead.comment && (
          <div className="flex gap-2 bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-900/20">
            <span className="text-xs shrink-0 mt-px">🤖</span>
            <p className="text-[11px] text-gray-400 leading-relaxed">{lead.comment}</p>
          </div>
        )}

        {/* ROW 7: original text — collapsible */}
        {lead.text && (lead.text?.length ?? 0) > 80 && (
          <div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-gray-500 leading-relaxed bg-black/25 rounded-lg px-3 py-2.5 mb-1 italic">
                    {lead.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              whileTap={{ scale: 0.94 }}
              className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors"
            >
              {expanded ? '↑ скрыть оригинал' : '↓ оригинал'}
            </motion.button>
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-2 border-t border-emerald-900/15 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {lead.phone && (
            <span className="text-xs text-emerald-400 font-medium tracking-wide">{lead.phone}</span>
          )}
          {lead.author && (
            <a href={lead.author} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              {lead.author.replace('https://t.me/', '@')}
            </a>
          )}
          {lead.group && (
            <span className="text-[11px] text-gray-700 truncate max-w-[150px]">{lead.group}</span>
          )}
          {lead.link && (
            <a href={lead.link} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors whitespace-nowrap">
              → сообщение
            </a>
          )}
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <BioStatusSelect
              value={lead.status}
              onChange={(status) => updateStatus({ id: lead.id, status })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
