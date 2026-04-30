'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGetLeadsQuery, useUpdateLeadStatusMutation } from '@/entities/Lead';
import { useGetSellersQuery } from '@/entities/Seller';
import { classify, getCatDef, avatarGradient } from '@/shared/lib/classify';
import type { Seller } from '@/entities/Seller';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function shortDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function uname(url: string | null) {
  return url?.replace('https://t.me/', '') ?? '?';
}

/* ── Related seller mini-card ── */
function SellerMini({ seller, index }: { seller: Seller; index: number }) {
  const un   = uname(seller.author);
  const grad = avatarGradient(un);
  const isW  = seller.wholesale;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.22 + index * 0.04, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link href={`/electronics/seller/${seller.id}`}
        className={`flex flex-col gap-2 rounded-xl border transition-all duration-200 p-3 block ${
          isW ? 'border-purple-500/15 bg-purple-500/[0.04] hover:bg-purple-500/[0.08] hover:border-purple-500/25'
              : 'border-orange-500/15 bg-orange-500/[0.04] hover:bg-orange-500/[0.08] hover:border-orange-500/25'
        }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center
                          text-[11px] font-bold text-white shrink-0`}>
            {un[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-[12px] font-medium truncate block ${isW ? 'text-purple-400' : 'text-orange-400'}`}>
              @{un}
            </span>
          </div>
          {isW && (
            <span className="text-[9px] text-purple-600 font-bold shrink-0">ОПТ</span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{seller.text || '—'}</p>
        {seller.date && <span className="text-[10px] text-gray-700">{shortDate(seller.date)}</span>}
      </Link>
    </motion.div>
  );
}

/* ── Page ── */
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: leadsData,   isLoading } = useGetLeadsQuery();
  const { data: sellersData }            = useGetSellersQuery();
  const [updateStatus]                   = useUpdateLeadStatusMutation();

  const lead        = leadsData?.leads.find((l) => l.id === id);
  const allSellers  = sellersData?.sellers ?? [];
  const category    = lead ? classify(lead.text, lead.comment) : '';
  const catDef      = getCatDef(category);
  const related     = allSellers.filter((s) => classify(s.text, s.comment) === category);
  const un          = uname(lead?.author ?? null);
  const grad        = avatarGradient(un);

  /* Loading */
  if (isLoading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full" />
    </div>
  );

  /* Not found */
  if (!lead) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4 text-sm text-gray-600">
      Лид не найден
      <Link href="/electronics" className="text-xs text-blue-400 hover:text-blue-300">← Назад</Link>
    </div>
  );

  const wholsaleMatches = related.filter((s) => s.wholesale).length;
  const retailMatches   = related.filter((s) => !s.wholesale).length;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-white/5
                      px-4 py-3 flex items-center gap-3">
        <Link href="/electronics"
          className="text-gray-500 hover:text-white transition-colors p-1 -ml-1 rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-white truncate">🛒 Лид · @{un}</span>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5 flex items-start gap-4">
          {/* Avatar */}
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
            {lead.date && (
              <div className="text-xs text-gray-600 mt-2">{formatDate(lead.date)}</div>
            )}
          </div>
        </motion.div>

        {/* ── Match summary ── */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-3 text-center">
              <div className="text-xl font-bold text-purple-400">{wholsaleMatches}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wide">Оптовиков</div>
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-3 text-center">
              <div className="text-xl font-bold text-orange-400">{retailMatches}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wide">Продавцов</div>
            </div>
          </motion.div>
        )}

        {/* ── Message ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Запрос</div>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{lead.text || '—'}</p>
        </motion.div>

        {/* ── AI comment ── */}
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

        {/* ── Details ── */}
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

        {/* ── Related sellers ── */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-[10px] uppercase tracking-widest text-gray-700">
                Похожие продавцы
              </div>
              <span className="text-[11px] text-orange-500 font-medium">{related.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {related.map((s, i) => <SellerMini key={s.id} seller={s} index={i} />)}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
