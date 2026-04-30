'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Seller, SellerStatus } from '@/entities/Seller';
import { useUpdateSellerStatusMutation } from '@/entities/Seller';
import { SellerStatusSelect } from './SellerStatusSelect';

type FilterType = 'все' | 'новый' | 'оптовики';
const FILTERS: FilterType[] = ['все', 'новый', 'оптовики'];
const LONG_TEXT = 120;
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

function SellerCard({ seller, index = 0 }: { seller: Seller; index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [updateStatus] = useUpdateSellerStatusMutation();
  const isLong = (seller.text?.length ?? 0) > LONG_TEXT;

  const dateStr = seller.date
    ? new Date(seller.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className="bg-[#161616] border border-white/[0.07] rounded-2xl p-4 space-y-3
                 hover:border-white/[0.13] hover:bg-[#1a1a1a] transition-colors duration-200"
    >
      {/* Top: wholesale badge + date */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {seller.wholesale ? (
            <WholesaleBadge wholesale={seller.wholesale} />
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full
                             bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
              🏪 Продавец
            </span>
          )}
        </div>
        {dateStr && <span className="text-[11px] text-gray-600 shrink-0">{dateStr}</span>}
      </div>

      {/* Text with expand */}
      <div>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.p key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="text-sm text-gray-200 leading-relaxed">
              {seller.text || '—'}
            </motion.p>
          ) : (
            <motion.p key="short" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="text-sm text-gray-200 leading-relaxed line-clamp-2">
              {seller.text || '—'}
            </motion.p>
          )}
        </AnimatePresence>
        {isLong && (
          <button onClick={() => setExpanded(v => !v)}
            className="mt-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            {expanded ? '↑ свернуть' : '↓ читать полностью'}
          </button>
        )}
      </div>

      {/* AI comment */}
      {seller.comment && (
        <div className="flex gap-2 bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.04]">
          <span className="text-xs shrink-0 mt-px">🤖</span>
          <p className="text-[11px] text-gray-400 leading-relaxed">{seller.comment}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-1 border-t border-white/[0.05] flex flex-wrap items-center gap-x-3 gap-y-2">
        {seller.author && (
          <a href={seller.author} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            {seller.author.replace('https://t.me/', '@')}
          </a>
        )}
        {seller.group && (
          <span className="text-[11px] text-gray-600 truncate max-w-[160px]">{seller.group}</span>
        )}
        {seller.link && (
          <a href={seller.link} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors whitespace-nowrap">
            → сообщение
          </a>
        )}
        <div className="ml-auto">
          <SellerStatusSelect
            value={seller.status}
            onChange={(status) => updateStatus({ id: seller.id, status })}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function SellersTable({ sellers }: { sellers: Seller[] }) {
  const [filter, setFilter] = useState<FilterType>('все');
  const [sort, setSort] = useState<SortDir>('desc');
  const [updateStatus] = useUpdateSellerStatusMutation();

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

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">Продавцов не найдено</div>
        ) : (
          filtered.map((seller, i) => <SellerCard key={seller.id} seller={seller} index={i} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-[#161616] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-gray-600 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Текст</th>
                <th className="text-left px-4 py-3 font-medium">Оптовик</th>
                <th className="text-left px-4 py-3 font-medium">Группа</th>
                <th className="text-left px-4 py-3 font-medium">Автор</th>
                <th className="px-4 py-3 font-medium">
                  <button onClick={() => setSort(v => v === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                    Дата
                    <motion.span animate={{ rotate: sort === 'asc' ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-block">↓</motion.span>
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Комментарий AI</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">Продавцов не найдено</td>
                </tr>
              )}
              {filtered.map((seller) => (
                <tr key={seller.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-gray-300 line-clamp-2 text-xs leading-relaxed">{seller.text || '—'}</div>
                    {seller.link && (
                      <a href={seller.link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-xs mt-1 inline-block">→ сообщение</a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {seller.wholesale ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                       bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        🏭 Да
                      </span>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-xs">{seller.group || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {seller.author ? (
                      <a href={seller.author} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs">
                        {seller.author.replace('https://t.me/', '@')}
                      </a>
                    ) : <span className="text-gray-700 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-600 text-xs">
                      {seller.date ? new Date(seller.date).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-gray-500 text-xs line-clamp-2">{seller.comment || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <SellerStatusSelect
                      value={seller.status}
                      onChange={(status) => updateStatus({ id: seller.id, status })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
