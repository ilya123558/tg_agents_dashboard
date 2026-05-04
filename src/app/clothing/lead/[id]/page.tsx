'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGetClothingLeadsQuery, useUpdateClothingLeadStatusMutation } from '@/entities/Lead';
import { resolveClothingCategory, getClothingCatDef, avatarGradient } from '@/shared/lib/classifyClothing';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function uname(url: string | null) {
  return url?.replace('https://t.me/', '') ?? '?';
}

export default function ClothingLeadDetailPage() {
  const { id }           = useParams<{ id: string }>();
  const { data, isLoading } = useGetClothingLeadsQuery();
  const [updateStatus]   = useUpdateClothingLeadStatusMutation();

  const lead    = data?.leads.find((l) => l.id === id);
  const category = lead ? resolveClothingCategory(lead.category, lead.text, lead.comment) : '';
  const catDef  = getClothingCatDef(category);
  const un      = uname(lead?.author ?? null);
  const grad    = avatarGradient(un);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full" />
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4 text-sm text-gray-600">
      Лид не найден
      <Link href="/clothing" className="text-xs text-blue-400 hover:text-blue-300">← Назад</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-10">
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-white/5
                      px-4 py-3 flex items-center gap-3">
        <Link href="/clothing"
          className="text-gray-500 hover:text-white transition-colors p-1 -ml-1 rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-white truncate">🛒 Лид · @{un}</span>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5 flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center
                          text-2xl font-bold text-white shadow-lg shrink-0`}>
            {un[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <a href={lead.author ?? '#'} target="_blank" rel="noopener noreferrer"
              className="text-lg font-semibold text-white hover:text-blue-300 transition-colors">
              @{un}
            </a>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full
                               bg-blue-500/15 text-blue-400 border border-blue-500/25">🛒 Покупатель</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                lead.status === 'новый'       ? 'bg-blue-500/10   text-blue-400   border-blue-500/20'   :
                lead.status === 'отправлено'  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                lead.status === 'ответил'     ? 'bg-green-500/10  text-green-400  border-green-500/20'  :
                                                'bg-red-500/10    text-red-400    border-red-500/20'
              }`}>{lead.status}</span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {catDef.icon} {category}
              </span>
            </div>
            {lead.date && <div className="text-xs text-gray-600 mt-2">{formatDate(lead.date)}</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Запрос</div>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{lead.text || '—'}</p>
        </motion.div>

        {lead.comment && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4">
            <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">AI Анализ</div>
            <div className="flex gap-3">
              <span className="text-xl shrink-0 mt-0.5">🤖</span>
              <p className="text-sm text-gray-300 leading-relaxed">{lead.comment}</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Детали</div>
          {lead.group && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">📍</span>
              <span className="text-gray-400">{lead.group}</span>
            </div>
          )}
          {lead.link && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">💬</span>
              <a href={lead.link} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors">
                Исходное сообщение →
              </a>
            </div>
          )}
          {lead.author && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">✈️</span>
              <a href={lead.author} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors">
                Написать в Telegram →
              </a>
            </div>
          )}
        </motion.div>

        <div className="flex gap-2 flex-wrap">
          {(['новый', 'отправлено', 'ответил', 'не ответил'] as const).map((s) => (
            <button key={s} onClick={() => updateStatus({ id: lead.id, status: s })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                lead.status === s
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'border-white/5 text-gray-600 hover:text-gray-300 hover:border-white/10'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
