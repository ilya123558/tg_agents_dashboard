'use client';

import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetEcoLeadsQuery, useUpdateEcoLeadStatusMutation } from '@/entities/EcoLead';
import type { EcoLeadStatus } from '@/entities/EcoLead';
import { BodyMap } from '@/widgets/BodyMap';
import { ThreadContext } from '@/widgets/EcoLeadCard/ui/ThreadContext';

const READINESS_CFG = {
  горячий:  { label: '🔥 Горячий',  cls: 'bg-red-500/15 border-red-500/30 text-red-400' },
  тёплый:   { label: '☀️ Тёплый',   cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  холодный: { label: '❄️ Холодный', cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
} as const;

const PERSONALITY_CLR: Record<string, string> = {
  аналитик:      'text-violet-400 bg-violet-500/10 border-violet-500/20',
  эмоциональный: 'text-pink-400   bg-pink-500/10   border-pink-500/20',
  прагматик:     'text-cyan-400   bg-cyan-500/10   border-cyan-500/20',
  тревожный:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  открытый:      'text-green-400  bg-green-500/10  border-green-500/20',
};

const STATUS_OPTIONS: { value: EcoLeadStatus; label: string; color: string; dot: string }[] = [
  { value: 'новый',      label: 'Новый',      color: 'text-blue-400',   dot: 'bg-blue-400' },
  { value: 'отправлено', label: 'Отправлено', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  { value: 'ответил',    label: 'Ответил',    color: 'text-green-400',  dot: 'bg-green-400' },
  { value: 'не ответил', label: 'Не ответил', color: 'text-red-400',    dot: 'bg-red-400' },
];

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[11px] text-gray-600 w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm leading-relaxed ${accent ?? 'text-gray-200'}`}>{value}</span>
    </div>
  );
}

export default function EcoLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useGetEcoLeadsQuery();
  const [updateStatus] = useUpdateEcoLeadStatusMutation();

  const lead = data?.leads.find(
    (l) => l.id === id || l.id.replace(/-/g, '') === id.replace(/-/g, ''),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (data && !lead) notFound();
  if (!lead) return null;

  const readiness    = lead.readiness ? READINESS_CFG[lead.readiness] : null;
  const personalityType = lead.personality?.split(/[—–-]/)[0]?.trim().toLowerCase() ?? '';
  const personalityColor = PERSONALITY_CLR[personalityType] ?? 'text-gray-400 bg-white/5 border-white/10';

  const markersList = lead.markers
    ? lead.markers.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  const dateStr = lead.date
    ? new Date(lead.date).toLocaleString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080f0a]/95 backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent" />
        <div className="px-4 md:px-6 h-14 flex items-center gap-3">

          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => router.back()}
            className="group shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-emerald-900/25 hover:border-emerald-700/40 transition-all duration-200"
          >
            <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          {/* Breadcrumb + lead title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[11px] text-gray-600 shrink-0 hidden sm:inline">Ecopulse</span>
            <svg className="w-3 h-3 text-gray-700 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {lead.author
                  ? lead.author.replace('https://t.me/', '@')
                  : lead.phone ?? 'Лид'}
              </p>
              {lead.problem && (
                <p className="text-[10px] text-gray-600 truncate leading-tight mt-0.5 max-w-[260px]">
                  {lead.problem}
                </p>
              )}
            </div>
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-2 shrink-0">
            {readiness && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 18 }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${readiness.cls}`}
              >
                {readiness.label}
              </motion.span>
            )}
            {dateStr && (
              <span className="text-[10px] text-gray-600 hidden md:block tabular-nums">{dateStr}</span>
            )}
          </div>

        </div>
      </header>

      <main className="px-4 md:px-6 py-6 max-w-[1300px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">

          {/* ── LEFT COLUMN: details — second on mobile ── */}
          <div className="flex-1 min-w-0 space-y-5 order-2 xl:order-1 w-full">

            {/* Author + group */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              {lead.author && (
                <a href={lead.author.startsWith('http') ? lead.author : `https://t.me/${lead.author.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  {lead.author.startsWith('https://t.me/') ? lead.author.replace('https://t.me/', '@') : lead.author}
                </a>
              )}
              {lead.phone && (
                <span className="text-sm text-emerald-400 font-medium tracking-wide">{lead.phone}</span>
              )}
              {lead.group && (
                <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  {lead.group}
                </span>
              )}
              {lead.link && (
                <a href={lead.link} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  → исходное сообщение
                </a>
              )}
            </motion.div>

            {/* PROBLEM — hero */}
            {lead.problem && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="relative bg-[#0c1a10] border border-emerald-800/30 rounded-2xl p-5"
              >
                <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 via-emerald-600/40 to-transparent ml-[-1px]" />
                <div className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-widest mb-2">Проблема</div>
                <p className="text-base text-gray-100 leading-relaxed">{lead.problem}</p>
              </motion.div>
            )}

            {/* Markers */}
            {markersList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-2">Маркеры</div>
                <div className="flex flex-wrap gap-2">
                  {markersList.map((m, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 + 0.12 }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400/90 font-mono"
                    >
                      {m}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Meta fields */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#0c1810] border border-emerald-900/20 rounded-2xl p-5 space-y-3"
            >
              <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-1">Информация</div>
              {lead.age    && <Row label="Возраст"    value={lead.age} />}
              {lead.gender && <Row label="Пол"        value={lead.gender} />}
              {lead.location && <Row label="Локализация" value={lead.location} accent="text-emerald-400/80" />}
              {lead.requestType && <Row label="Тип запроса"  value={lead.requestType} />}
              {lead.expertise   && <Row label="Уровень"      value={lead.expertise} />}
            </motion.div>

            {/* Personality */}
            {lead.personality && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0c1810] border border-emerald-900/20 rounded-2xl p-5"
              >
                <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-2">Тип личности</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${personalityColor}`}>
                    🧠 {personalityType || 'определён'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{lead.personality}</p>
              </motion.div>
            )}

            {/* AI comment */}
            {lead.comment && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex gap-3 bg-emerald-950/25 border border-emerald-900/15 rounded-2xl p-4"
              >
                <span className="text-base shrink-0">🤖</span>
                <div>
                  <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-1.5">Комментарий AI</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{lead.comment}</p>
                </div>
              </motion.div>
            )}

            {/* Thread context */}
            {lead.context && <ThreadContext context={lead.context} />}

            {/* Original text */}
            {lead.text && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-black/20 border border-white/[0.04] rounded-2xl p-4"
              >
                <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-2">Оригинальное сообщение</div>
                <p className="text-sm text-gray-500 leading-relaxed italic">{lead.text}</p>
              </motion.div>
            )}

            {/* Status changer */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-[#0c1810] border border-emerald-900/20 rounded-2xl p-5"
            >
              <div className="text-[11px] text-gray-600 uppercase tracking-widest mb-3">Статус</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => updateStatus({ id: lead.id, status: opt.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      lead.status === opt.value
                        ? `bg-white/10 border-white/20 ${opt.color}`
                        : 'border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/15'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── BODY MAP — first on mobile, right column on xl ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="order-1 xl:order-2 w-full xl:w-72 xl:shrink-0 xl:sticky xl:top-20"
          >
            <div className="w-full bg-[#080f0a] border border-emerald-900/25 rounded-2xl p-5 xl:p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 w-full justify-center">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
                <div className="text-[11px] text-emerald-700/80 uppercase tracking-widest font-medium">
                  Зона воздействия
                </div>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 1.1 }}
                />
              </div>
              <BodyMap
                location={lead.location}
                problem={lead.problem}
                markers={lead.markers}
                text={lead.text}
                gender={lead.gender}
                readiness={lead.readiness}
              />
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
