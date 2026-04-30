'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGetSellersQuery, useUpdateSellerStatusMutation } from '@/entities/Seller';
import { useGetLeadsQuery } from '@/entities/Lead';
import { resolveCategory, getCatDef, avatarGradient } from '@/shared/lib/classify';
import type { Lead } from '@/entities/Lead';

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

/* ── Related lead mini-card ── */
function LeadMini({ lead, index }: { lead: Lead; index: number }) {
  const un = uname(lead.author);
  const grad = avatarGradient(un);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.22 + index * 0.04, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link href={`/electronics/lead/${lead.id}`}
        className="flex flex-col gap-2 rounded-xl border border-blue-500/15 bg-blue-500/[0.04]
                   hover:bg-blue-500/[0.08] hover:border-blue-500/25 transition-all duration-200 p-3 block">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center
                          text-[11px] font-bold text-white shrink-0`}>
            {un[0]?.toUpperCase()}
          </div>
          <span className="text-[12px] font-medium text-blue-400 truncate">@{un}</span>
        </div>
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{lead.text || '—'}</p>
        {lead.date && <span className="text-[10px] text-gray-700">{shortDate(lead.date)}</span>}
      </Link>
    </motion.div>
  );
}

/* ── Page ── */
export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sellersData, isLoading } = useGetSellersQuery();
  const { data: leadsData }              = useGetLeadsQuery();
  const [updateStatus]                   = useUpdateSellerStatusMutation();

  const seller      = sellersData?.sellers.find((s) => s.id === id);
  const allLeads    = leadsData?.leads ?? [];
  const category    = seller ? resolveCategory(seller.category, seller.text, seller.comment) : '';
  const catDef      = getCatDef(category);
  const related     = allLeads.filter((l) => resolveCategory(l.category, l.text, l.comment) === category);
  const un          = uname(seller?.author ?? null);
  const grad        = avatarGradient(un);

  /* Loading */
  if (isLoading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full" />
    </div>
  );

  /* Not found */
  if (!seller) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4 text-sm text-gray-600">
      Продавец не найден
      <Link href="/electronics" className="text-xs text-blue-400 hover:text-blue-300">← Назад</Link>
    </div>
  );

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
        <span className="text-sm font-medium text-white truncate">
          {seller.wholesale ? '🏭 Оптовик' : '🏪 Продавец'} · @{un}
        </span>
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
            <a href={seller.author ?? '#'} target="_blank" rel="noopener noreferrer"
              className="text-lg font-semibold text-white hover:text-blue-300 transition-colors">
              @{un}
            </a>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {seller.wholesale ? (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full
                                 bg-purple-500/15 text-purple-400 border border-purple-500/25">🏭 Оптовик</span>
              ) : (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full
                                 bg-orange-500/15 text-orange-400 border border-orange-500/25">🏪 Продавец</span>
              )}
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                seller.status === 'новый'    ? 'bg-blue-500/10   text-blue-400   border-blue-500/20'   :
                seller.status === 'в работе' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                               'bg-green-500/10  text-green-400  border-green-500/20'
              }`}>{seller.status}</span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {catDef.icon} {category}
              </span>
            </div>
            {seller.date && (
              <div className="text-xs text-gray-600 mt-2">{formatDate(seller.date)}</div>
            )}
          </div>
        </motion.div>

        {/* ── Message ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Сообщение</div>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{seller.text || '—'}</p>
        </motion.div>

        {/* ── AI comment ── */}
        {seller.comment && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4">
            <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">AI Анализ</div>
            <div className="flex gap-3">
              <span className="text-xl shrink-0 mt-0.5">🤖</span>
              <p className="text-sm text-gray-300 leading-relaxed">{seller.comment}</p>
            </div>
          </motion.div>
        )}

        {/* ── Details ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-[#161616] p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Детали</div>
          {seller.group && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">📍</span>
              <span className="text-gray-400">{seller.group}</span>
            </div>
          )}
          {seller.link && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">💬</span>
              <a href={seller.link} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors">
                Исходное сообщение →
              </a>
            </div>
          )}
          {seller.author && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-base">✈️</span>
              <a href={seller.author} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors">
                Написать в Telegram →
              </a>
            </div>
          )}
        </motion.div>

        {/* ── Related leads ── */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-[10px] uppercase tracking-widest text-gray-700">
                Похожие лиды
              </div>
              <span className="text-[11px] text-blue-500 font-medium">{related.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {related.map((l, i) => <LeadMini key={l.id} lead={l} index={i} />)}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
