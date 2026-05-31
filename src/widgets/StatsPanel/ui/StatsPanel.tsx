'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Lead, LeadStatus } from '@/entities/Lead';
import type { Seller } from '@/entities/Seller';

export type LeadFilter = LeadStatus | 'все';

interface StatsPanelProps {
  leads: Lead[];
  sellers?: Seller[];
  activeStatus?: LeadFilter;
  onStatusClick?: (s: LeadFilter) => void;
  onSellersClick?: () => void;
  onGroupsClick?: () => void;
}

const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string; ring: string; soft: string }> = {
  'новый':      { label: 'Новые',       bg: 'bg-blue-500',   text: 'text-blue-400',   ring: 'ring-blue-500/40',   soft: 'bg-blue-500/10' },
  'отправлено': { label: 'Отправлено',  bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/40', soft: 'bg-yellow-500/10' },
  'ответил':    { label: 'Ответили',    bg: 'bg-green-500',  text: 'text-green-400',  ring: 'ring-green-500/40',  soft: 'bg-green-500/10' },
  'не ответил': { label: 'Не ответили', bg: 'bg-red-500',    text: 'text-red-400',    ring: 'ring-red-500/40',    soft: 'bg-red-500/10' },
};
const STATUS_ORDER: LeadStatus[] = ['новый', 'отправлено', 'ответил', 'не ответил'];

function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    prev.current = to;
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}

export function StatsPanel({ leads, sellers, activeStatus = 'все', onStatusClick, onSellersClick, onGroupsClick }: StatsPanelProps) {
  const total = leads.length;
  const byStatus = STATUS_ORDER.map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
  }));
  const groups = new Set(leads.map(l => l.group).filter(Boolean)).size;
  const wholesale = sellers?.filter(s => s.wholesale).length ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* HERO: total + stacked status bar + clickable status chips */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="relative lg:col-span-2 rounded-2xl border border-white/[0.07] overflow-hidden
                   bg-gradient-to-br from-[#1c1c1c] via-[#181818] to-[#141414]"
      >
        {/* decorative gradient blobs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-500/[0.12] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-48 h-48 rounded-full bg-purple-500/[0.08] blur-3xl pointer-events-none" />

        <div className="relative p-5 lg:p-6">
          {/* clickable label+number area */}
          <button
            type="button"
            onClick={() => onStatusClick?.('все')}
            className="group text-left -m-2 p-2 rounded-xl hover:bg-white/[0.02] transition-colors min-w-0 mb-5"
          >
            <div className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-medium
                            group-hover:text-gray-400 transition-colors mb-2.5">
              Всего лидов
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <span className="text-[56px] leading-none font-bold tabular-nums tracking-tight text-white">
                <CountUp value={total} />
              </span>
              {total > 0 && (
                <span className="text-xs text-gray-500 pb-2">
                  {groups} {groups === 1 ? 'группа' : groups < 5 ? 'группы' : 'групп'}
                </span>
              )}
            </div>
          </button>

          {/* stacked status bar */}
          <div className="mb-3.5">
            <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
              {total === 0 && <div className="h-full w-full bg-white/[0.04]" />}
              {byStatus.map(({ status, count }, i) => {
                const pct = total === 0 ? 0 : (count / total) * 100;
                if (pct === 0) return null;
                return (
                  <motion.div
                    key={status}
                    className={STATUS_META[status].bg}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                  />
                );
              })}
            </div>
          </div>

          {/* status chips (clickable filters) */}
          <div className="flex flex-wrap gap-1.5">
            {byStatus.map(({ status, count }) => {
              const meta = STATUS_META[status];
              const active = activeStatus === status;
              const pct = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusClick?.(status)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs transition-all
                              ${active
                                ? `${meta.soft} ${meta.text} ring-1 ${meta.ring}`
                                : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 border border-transparent'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.bg}`} />
                  <span className="font-medium">{meta.label}</span>
                  <span className={`tabular-nums font-semibold ${active ? meta.text : 'text-gray-500'}`}>
                    {count}
                  </span>
                  {pct > 0 && pct < 100 && (
                    <span className="tabular-nums text-[10px] text-gray-600">{pct}%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Sellers + Groups (stretches to hero height) */}
      <div className="flex flex-col gap-3 h-full">
        {sellers !== undefined && (
          <motion.button
            type="button"
            onClick={() => onSellersClick?.()}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex-1 text-left rounded-2xl p-4 bg-[#161616] border border-white/[0.07]
                       hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500/[0.08] blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium">Продавцов</span>
                </div>
                <span className="text-[10px] text-gray-700 group-hover:text-orange-400/70 transition-colors">→</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums text-orange-400 leading-none">
                  <CountUp value={sellers.length} />
                </span>
                {wholesale > 0 && (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    оптовиков
                    <span className="tabular-nums text-purple-400 font-semibold">{wholesale}</span>
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        )}

        <motion.button
          type="button"
          onClick={() => onGroupsClick?.()}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex-1 text-left rounded-2xl p-4 bg-[#161616] border border-white/[0.07]
                     hover:border-purple-500/30 hover:bg-purple-500/[0.03] transition-all overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-500/[0.06] blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium">Групп</span>
              </div>
              <span className="text-[10px] text-gray-700 group-hover:text-purple-400/70 transition-colors">↓</span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-purple-400 leading-none">
              <CountUp value={groups} />
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
