'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Seller } from '@/entities/Seller';
import { useUpdateSellerStatusMutation } from '@/entities/Seller';
import { SellerStatusSelect } from './SellerStatusSelect';
import { AssigneePicker } from '@/features/AssigneeMarker';

type FilterType = 'все' | 'новый' | 'оптовики';
const FILTERS: FilterType[] = ['все', 'новый', 'оптовики'];
type SortDir = 'desc' | 'asc';

function sortByDate(items: Seller[], dir: SortDir) {
  return [...items].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return dir === 'desc' ? tb - ta : ta - tb;
  });
}

function WholesaleBadge({ wholesale }: { wholesale: boolean }) {
  if (!wholesale) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full
                     bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
      🏭 Оптовик
    </span>
  );
}

function SellerCard({ seller, index = 0, onOpenChat }: { seller: Seller; index?: number; onOpenChat?: (s: Seller) => void }) {
  const [updateStatus] = useUpdateSellerStatusMutation();
  const username = seller.author ? seller.author.replace(/^https?:\/\/t\.me\//i, '@').replace(/^@?/, '@') : null;
  const dateStr = seller.date
    ? new Date(seller.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      onClick={() => onOpenChat?.(seller)}
      className={`group relative flex flex-col h-[300px] overflow-hidden rounded-2xl border border-white/[0.07]
                  bg-[#161616] transition-all duration-200 hover:border-white/20 hover:bg-[#1a1a1a]
                  hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${onOpenChat ? 'cursor-pointer' : ''}`}
    >
      {/* Header: менеджер + статус + опт/продавец + дата */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5" onClick={(e) => e.stopPropagation()}>
        <AssigneePicker author={seller.author} size="md" />
        <SellerStatusSelect value={seller.status} onChange={(status) => updateStatus({ id: seller.id, status })} />
        {seller.wholesale ? (
          <WholesaleBadge wholesale={seller.wholesale} />
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full
                           bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            🏪 Продавец
          </span>
        )}
        {dateStr && <span className="ml-auto text-[11px] text-gray-600 shrink-0 tabular-nums">{dateStr}</span>}
      </div>

      {/* Автор */}
      <div className="px-4 pb-2 min-w-0">
        {username ? (
          <a
            href={seller.author ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-white hover:text-blue-300 transition-colors truncate block"
          >
            {username}
          </a>
        ) : (
          <span className="text-sm font-semibold text-gray-500">без автора</span>
        )}
      </div>

      {/* Тело: текст + AI-комментарий */}
      <div className="flex-1 min-h-0 overflow-hidden px-4">
        <p className="text-[13px] text-gray-200 leading-relaxed line-clamp-3">{seller.text || '—'}</p>
        {seller.comment && (
          <div className="mt-2.5 flex gap-2 rounded-xl border border-white/[0.05] bg-white/[0.035] px-3 py-2">
            <span className="shrink-0 text-xs mt-px">🤖</span>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{seller.comment}</p>
          </div>
        )}
      </div>

      {/* Footer: группа + CTA */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[11px] text-gray-500">{seller.group || '—'}</span>
        {onOpenChat ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors group-hover:text-blue-300">
            Открыть чат
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        ) : seller.link ? (
          <a
            href={seller.link}
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

export function SellersTable({ sellers, onOpenChat }: { sellers: Seller[]; onOpenChat?: (s: Seller) => void }) {
  const [filter, setFilter] = useState<FilterType>('все');
  const [sort, setSort] = useState<SortDir>('desc');

  function filterCount(f: FilterType): number {
    if (f === 'все') return sellers.length;
    if (f === 'оптовики') return sellers.filter(s => s.wholesale).length;
    return sellers.filter(s => s.status === f).length;
  }

  const filtered = sortByDate(
    filter === 'все' ? sellers
    : filter === 'оптовики' ? sellers.filter(s => s.wholesale)
    : sellers.filter(s => s.status === filter),
    sort,
  );

  return (
    <div className="space-y-3">
      {/* Filter + sort row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              {f === 'оптовики' ? '🏭 Оптовики' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-gray-600">{filterCount(f)}</span>
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSort(v => v === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]
                     border border-white/[0.06] transition-colors shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={sort}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}>
              {sort === 'desc' ? '↓ Сначала новые' : '↑ Сначала старые'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Карточки — адаптивная сетка (1 / 2 / 3 колонки) на всех экранах */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">Продавцов не найдено</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {filtered.map((seller, i) => (
            <SellerCard key={seller.id} seller={seller} index={Math.min(i, 10)} onOpenChat={onOpenChat} />
          ))}
        </div>
      )}
    </div>
  );
}
