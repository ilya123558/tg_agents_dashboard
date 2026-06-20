'use client';

import {
  useRef, useLayoutEffect, useEffect,
  useState, useMemo, useCallback,
} from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import type { Lead } from '@/entities/Lead';
import type { Seller } from '@/entities/Seller';
import { CATS, resolveCategory, avatarGradient } from '@/shared/lib/classify';

/* ─── Types ─────────────────────────────────────────────── */

interface Props { leads: Lead[]; sellers: Seller[] }

interface Row {
  def: (typeof CATS)[number];
  sellerItems: Seller[];
  leadItems:   Lead[];
}

interface Thread {
  d:       string;
  color:   string;
  opacity: number;
  delay:   number;
  sx: number; sy: number;
  ex: number; ey: number;
}

type Mode = 'wholesale' | 'retail';

const MAX_DESKTOP = 6;
const MAX_MOBILE  = 6;

function uname(url: string | null) {
  return url?.replace('https://t.me/', '') ?? '?';
}

function buildRows(pool: Seller[], leads: Lead[]): Row[] {
  const map = new Map<string, Row>();
  for (const def of CATS) map.set(def.name, { def, sellerItems: [], leadItems: [] });
  for (const s of pool)  map.get(resolveCategory(s.category, s.text, s.comment))!.sellerItems.push(s);
  for (const l of leads) map.get(resolveCategory(l.category, l.text, l.comment))!.leadItems.push(l);
  return [...map.values()]
    .filter(r => r.sellerItems.length > 0 || r.leadItems.length > 0)
    .sort((a, b) => {
      const am = +(a.sellerItems.length > 0 && a.leadItems.length > 0);
      const bm = +(b.sellerItems.length > 0 && b.leadItems.length > 0);
      return bm - am || (b.sellerItems.length + b.leadItems.length) - (a.sellerItems.length + a.leadItems.length);
    });
}

/* ─── Desktop node button ────────────────────────────────── */

function NodeButton({ href, author, type, isW }: {
  href: string; author: string | null; type: 'seller' | 'lead'; isW?: boolean;
}) {
  const un   = uname(author);
  const grad = avatarGradient(un);
  const colors =
    type === 'lead' ? 'border-blue-500/20 bg-blue-500/[0.07] hover:border-blue-400/50 hover:bg-blue-500/[0.15] text-blue-400'
    : isW           ? 'border-purple-500/20 bg-purple-500/[0.07] hover:border-purple-400/50 hover:bg-purple-500/[0.15] text-purple-400'
    :                 'border-orange-500/20 bg-orange-500/[0.07] hover:border-orange-400/50 hover:bg-orange-500/[0.15] text-orange-400';
  const glowColor = type === 'lead' ? 'rgba(59,130,246,0.25)' : isW ? 'rgba(168,85,247,0.25)' : 'rgba(249,115,22,0.25)';
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.07, x: type === 'seller' ? 4 : -4, boxShadow: `0 0 14px 2px ${glowColor}` }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border cursor-pointer group transition-colors ${colors}`}
      >
        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
          {un[0]?.toUpperCase()}
        </div>
        <span className="text-[11px] font-medium leading-none">@{un}</span>
        <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150 leading-none">
          {type === 'seller' ? '→' : '←'}
        </span>
      </motion.div>
    </Link>
  );
}

/* ─── Mobile node chip ───────────────────────────────────── */

function MobileChip({ href, author, type, isW, animDelay, inView }: {
  href: string; author: string | null; type: 'seller' | 'lead';
  isW: boolean; animDelay: number; inView: boolean;
}) {
  const un   = uname(author);
  const grad = avatarGradient(un);

  const borderBg =
    type === 'lead' ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/[0.13] to-blue-600/[0.05]'
    : isW           ? 'border-purple-500/40 bg-gradient-to-br from-purple-500/[0.13] to-purple-600/[0.05]'
    :                 'border-orange-500/40 bg-gradient-to-br from-orange-500/[0.13] to-orange-600/[0.05]';

  const text   = type === 'lead' ? 'text-blue-200' : isW ? 'text-purple-200' : 'text-orange-200';
  const glowC  = type === 'lead' ? 'rgba(59,130,246,0.45)' : isW ? 'rgba(168,85,247,0.45)' : 'rgba(249,115,22,0.45)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: type === 'seller' ? -12 : 12 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay: animDelay, type: 'spring', stiffness: 440, damping: 24 }}
    >
      <Link href={href}>
        <motion.div
          whileTap={{ scale: 0.85, opacity: 0.75 }}
          whileHover={{ boxShadow: `0 0 22px 4px ${glowC}` }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
          className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 cursor-pointer select-none ${borderBg}`}
        >
          <div className={`w-[22px] h-[22px] rounded-full bg-gradient-to-br ${grad}
                          flex items-center justify-center text-[9px] font-bold text-white shrink-0
                          ring-1 ring-white/15 shadow-inner`}>
            {un[0]?.toUpperCase()}
          </div>
          <span className={`text-[11px] font-semibold leading-none max-w-[78px] truncate ${text}`}>
            @{un}
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Desktop center node ────────────────────────────────── */

function CatNode({ def, isMatch }: { def: (typeof CATS)[number]; isMatch: boolean }) {
  return (
    <motion.div
      animate={isMatch ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      className="relative"
    >
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-medium text-sm whitespace-nowrap ${
        isMatch
          ? 'border-green-500/30 bg-[#0f1f14] text-green-300 shadow-[0_0_22px_rgba(34,197,94,0.12)]'
          : 'border-white/[0.07] bg-[#181818] text-gray-400'
      }`}>
        <span className="text-base">{def.icon}</span>
        <span>{def.name}</span>
        {isMatch && (
          <motion.span
            animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.4, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6 }}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_4px_rgba(34,197,94,0.45)]"
          />
        )}
      </div>
    </motion.div>
  );
}

/* ─── Mobile center node (larger, more dramatic) ─────────── */

function CatNodeLarge({ def, isMatch, inView }: {
  def: (typeof CATS)[number]; isMatch: boolean; inView: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">

      {/* Pulsing outer ring */}
      {isMatch && (
        <>
          <motion.div
            className="absolute rounded-[28px] border border-green-500/20 pointer-events-none"
            style={{ inset: '-14px' }}
            animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-[24px] border border-green-500/35 pointer-events-none"
            style={{ inset: '-7px' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.08, 0.55] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.38 }}
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.65 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 22 }}
        className={`relative flex items-center gap-3 px-5 py-3 rounded-[22px] border ${
          isMatch
            ? 'border-green-500/45 bg-[#0b1d0c] text-green-200 shadow-[0_0_48px_rgba(34,197,94,0.18),0_0_16px_rgba(34,197,94,0.1),inset_0_1px_0_rgba(34,197,94,0.1)]'
            : 'border-white/[0.1] bg-[#161616] text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        }`}
      >
        <motion.span
          className="text-[26px] leading-none"
          animate={isMatch ? {
            filter: [
              'drop-shadow(0 0 0px transparent)',
              'drop-shadow(0 0 14px rgba(34,197,94,0.95))',
              'drop-shadow(0 0 0px transparent)',
            ],
          } : {}}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5 }}
        >
          {def.icon}
        </motion.span>
        <span className="font-bold text-[15px] whitespace-nowrap">{def.name}</span>

        {isMatch && (
          <motion.div
            animate={{ scale: [1, 2.0, 1], opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-green-400"
            style={{ boxShadow: '0 0 14px 5px rgba(34,197,94,0.6)' }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ─── Desktop: horizontal web row ─────────────────────────── */

function WebRow({ row, index, sc }: { row: Row; index: number; sc: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef    = useRef<HTMLDivElement>(null);
  const sellerRefs   = useRef<(HTMLElement | null)[]>([]);
  const leadRefs     = useRef<(HTMLElement | null)[]>([]);
  const [threads, setThreads]   = useState<Thread[]>([]);
  const [expanded, setExpanded] = useState(false);

  const isMatch = row.sellerItems.length > 0 && row.leadItems.length > 0;
  const isW     = sc === 'purple';
  const sColor  = isW ? '#a855f7' : '#f97316';
  const lColor  = '#3b82f6';
  const shownS  = Math.min(row.sellerItems.length, MAX_DESKTOP);
  const shownL  = Math.min(row.leadItems.length,   MAX_DESKTOP);

  const compute = useCallback(() => {
    const ctnr = containerRef.current;
    const ctr  = centerRef.current;
    if (!ctnr || !ctr) return;
    const base = ctnr.getBoundingClientRect();
    const cr   = ctr.getBoundingClientRect();
    const cx   = cr.left + cr.width  / 2 - base.left;
    const cy   = cr.top  + cr.height / 2 - base.top;
    const hw   = cr.width / 2;
    const next: Thread[] = [];

    sellerRefs.current.slice(0, shownS).forEach((el, i) => {
      if (!el) return;
      const r  = el.getBoundingClientRect();
      const sx = r.right - base.left;
      const sy = r.top + r.height / 2 - base.top;
      const mx = sx + (cx - hw - sx) * 0.55;
      next.push({ d: `M ${sx},${sy} C ${mx},${sy} ${cx - hw - 10},${cy} ${cx - hw},${cy}`, color: sColor, opacity: isMatch ? 0.55 : 0.22, delay: index * 0.08 + i * 0.06, sx, sy, ex: cx - hw, ey: cy });
    });
    leadRefs.current.slice(0, shownL).forEach((el, i) => {
      if (!el) return;
      const r  = el.getBoundingClientRect();
      const lx = r.left - base.left;
      const ly = r.top + r.height / 2 - base.top;
      const mx = cx + hw + (lx - (cx + hw)) * 0.55;
      next.push({ d: `M ${cx + hw},${cy} C ${cx + hw + 10},${cy} ${mx},${ly} ${lx},${ly}`, color: lColor, opacity: isMatch ? 0.55 : 0.22, delay: index * 0.08 + 0.18 + i * 0.06, sx: cx + hw, sy: cy, ex: lx, ey: ly });
    });
    setThreads(next);
  }, [sColor, lColor, isMatch, index, shownS, shownL]);

  useLayoutEffect(() => { compute(); }, [compute]);
  useEffect(() => {
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [compute]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl border py-6 overflow-visible transition-colors ${
        isMatch ? 'border-green-500/[0.15] bg-[#0e0e0e] hover:border-green-500/25' : 'border-white/[0.04] bg-[#0c0c0c]'
      }`}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }} aria-hidden>
        {threads.map((t, i) => (
          <g key={i}>
            <motion.path d={t.d} fill="none" stroke={t.color} strokeWidth="5"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.06 }}
              transition={{ duration: 0.9, delay: t.delay, ease: 'easeInOut' }} />
            <motion.path d={t.d} fill="none" stroke={t.color} strokeWidth="1.3"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: t.opacity }}
              transition={{ duration: 0.9, delay: t.delay, ease: 'easeInOut' }} />
          </g>
        ))}
      </svg>
      <div className="relative z-10 grid grid-cols-[2fr_auto_2fr] items-center gap-6 px-6">
        {/* Sellers */}
        <div className="flex flex-col items-end gap-2.5">
          {row.sellerItems.slice(0, MAX_DESKTOP).map((s, i) => (
            <div key={s.id} ref={(el) => { sellerRefs.current[i] = el; }}>
              <NodeButton href={`/electronics/seller/${s.id}`} author={s.author} type="seller" isW={isW} />
            </div>
          ))}
          {row.sellerItems.length > MAX_DESKTOP && (
            <span className={`text-[10px] font-medium pr-1 ${isW ? 'text-purple-800' : 'text-orange-800'}`}>
              +{row.sellerItems.length - MAX_DESKTOP} ещё
            </span>
          )}
          {row.sellerItems.length === 0 && <span className="text-[11px] text-gray-800 italic">нет продавцов</span>}
        </div>

        {/* Center */}
        <div className="flex flex-col items-center">
          <div ref={centerRef}>
            <CatNode def={row.def} isMatch={isMatch} />
          </div>
        </div>

        {/* Leads */}
        <div className="flex flex-col items-start gap-2.5">
          {row.leadItems.slice(0, MAX_DESKTOP).map((l, i) => (
            <div key={l.id} ref={(el) => { leadRefs.current[i] = el; }}>
              <NodeButton href={`/electronics/lead/${l.id}`} author={l.author} type="lead" />
            </div>
          ))}
          {row.leadItems.length > MAX_DESKTOP && (
            <span className="text-[10px] font-medium pl-1 text-blue-800">
              +{row.leadItems.length - MAX_DESKTOP} ещё
            </span>
          )}
          {row.leadItems.length === 0 && <span className="text-[11px] text-gray-800 italic">нет лидов</span>}
        </div>
      </div>

      {/* Expand button — bottom of card, not in center column */}
      {(row.sellerItems.length > MAX_DESKTOP || row.leadItems.length > MAX_DESKTOP) && (
        <div className="relative z-10 flex justify-end px-6 mt-2 mb-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setExpanded(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold transition-colors ${
              expanded
                ? 'border-white/20 bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]'
                : isMatch
                ? 'border-green-500/25 bg-green-500/[0.08] text-green-400 hover:bg-green-500/[0.14]'
                : 'border-white/10 bg-white/[0.04] text-gray-500 hover:bg-white/[0.08]'
            }`}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              className="leading-none"
            >
              ↓
            </motion.span>
            {expanded ? 'свернуть' : 'все'}
          </motion.button>
        </div>
      )}

      {/* Expandable full list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className={`mx-4 mt-3 rounded-xl border p-4 ${
              isMatch ? 'border-green-500/10 bg-green-500/[0.03]' : 'border-white/[0.05] bg-white/[0.02]'
            }`}>
              <div className="grid grid-cols-2 gap-6">

                {/* All sellers */}
                <div>
                  <div className={`text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5 ${isW ? 'text-purple-600' : 'text-orange-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isW ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    {isW ? 'Оптовики' : 'Продавцы'} · {row.sellerItems.length}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.sellerItems.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.8, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.018, type: 'spring', stiffness: 420, damping: 26 }}
                      >
                        <NodeButton href={`/electronics/seller/${s.id}`} author={s.author} type="seller" isW={isW} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* All leads */}
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Лиды · {row.leadItems.length}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.leadItems.map((l, i) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, scale: 0.8, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.018, type: 'spring', stiffness: 420, damping: 26 }}
                      >
                        <NodeButton href={`/electronics/lead/${l.id}`} author={l.author} type="lead" />
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Mobile: vertical web row ───────────────────────────── */

function WebRowMobile({ row, index, sc }: { row: Row; index: number; sc: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef    = useRef<HTMLDivElement>(null);
  const sellerRefs   = useRef<(HTMLElement | null)[]>([]);
  const leadRefs     = useRef<(HTMLElement | null)[]>([]);
  const [threads, setThreads]   = useState<Thread[]>([]);
  const [expanded, setExpanded] = useState(false);
  const inView = useInView(containerRef, { once: true, margin: '-30px' });

  const isMatch = row.sellerItems.length > 0 && row.leadItems.length > 0;
  const isW     = sc === 'purple';
  const sColor  = isW ? '#a855f7' : '#f97316';
  const lColor  = '#3b82f6';
  const shownS  = Math.min(row.sellerItems.length, MAX_MOBILE);
  const shownL  = Math.min(row.leadItems.length,   MAX_MOBILE);

  const compute = useCallback(() => {
    const ctnr = containerRef.current;
    const ctr  = centerRef.current;
    if (!ctnr || !ctr) return;
    const base = ctnr.getBoundingClientRect();
    const cr   = ctr.getBoundingClientRect();
    const cx   = cr.left + cr.width  / 2 - base.left;
    const ctop = cr.top    - base.top;
    const cbot = cr.bottom - base.top;
    const next: Thread[] = [];

    sellerRefs.current.slice(0, shownS).forEach((el, i) => {
      if (!el) return;
      const r   = el.getBoundingClientRect();
      const sx  = r.left + r.width / 2 - base.left;
      const sy  = r.bottom - base.top;
      const mid = (sy + ctop) / 2;
      next.push({ d: `M ${sx},${sy} C ${sx},${mid} ${cx},${mid} ${cx},${ctop}`, color: sColor, opacity: isMatch ? 0.65 : 0.28, delay: index * 0.06 + i * 0.05, sx, sy, ex: cx, ey: ctop });
    });

    leadRefs.current.slice(0, shownL).forEach((el, i) => {
      if (!el) return;
      const r   = el.getBoundingClientRect();
      const lx  = r.left + r.width / 2 - base.left;
      const ly  = r.top  - base.top;
      const mid = (cbot + ly) / 2;
      next.push({ d: `M ${cx},${cbot} C ${cx},${mid} ${lx},${mid} ${lx},${ly}`, color: lColor, opacity: isMatch ? 0.65 : 0.28, delay: index * 0.06 + 0.18 + i * 0.05, sx: cx, sy: cbot, ex: lx, ey: ly });
    });

    setThreads(next);
  }, [sColor, lColor, isMatch, index, shownS, shownL]);

  useLayoutEffect(() => { compute(); }, [compute]);
  useEffect(() => {
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [compute]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl border overflow-visible ${
        isMatch ? 'border-green-500/[0.20] bg-[#080d08]' : 'border-white/[0.07] bg-[#0b0b0b]'
      }`}
    >
      {/* Aurora glow on match */}
      {isMatch && (
        <>
          <motion.div
            className="absolute -inset-px rounded-[18px] pointer-events-none"
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.22), transparent 55%)' }}
          />
          <motion.div
            className="absolute -inset-px rounded-[18px] pointer-events-none"
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            style={{ background: `radial-gradient(ellipse at 50% 100%, ${sColor}18, transparent 55%)` }}
          />
        </>
      )}

      {/* SVG threads — rendered once in view */}
      {inView && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
          aria-hidden
        >
          <defs>
            <filter id={`glow-s-${index}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`glow-l-${index}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {threads.map((t, i) => (
            <g key={i}>
              {/* Outer diffuse glow */}
              <motion.path d={t.d} fill="none" stroke={t.color} strokeWidth="12"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.035 }}
                transition={{ duration: 1.1, delay: t.delay, ease: 'easeInOut' }}
              />
              {/* Mid glow */}
              <motion.path d={t.d} fill="none" stroke={t.color} strokeWidth="4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.14 }}
                transition={{ duration: 1.1, delay: t.delay, ease: 'easeInOut' }}
              />
              {/* Core thread */}
              <motion.path d={t.d} fill="none" stroke={t.color} strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: t.opacity }}
                transition={{ duration: 1.1, delay: t.delay, ease: 'easeInOut' }}
              />
              {/* Endpoint dot at node */}
              <motion.circle
                cx={t.sx} cy={t.sy} r="3"
                fill={t.color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.9, scale: 1 }}
                transition={{ delay: t.delay + 0.1, duration: 0.25, ease: 'backOut' }}
                style={{ filter: `drop-shadow(0 0 5px ${t.color})` }}
              />
              {/* Endpoint dot at center */}
              <motion.circle
                cx={t.ex} cy={t.ey} r="2.5"
                fill={t.color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ delay: t.delay + 1.0, duration: 0.2, ease: 'backOut' }}
                style={{ filter: `drop-shadow(0 0 4px ${t.color})` }}
              />
            </g>
          ))}
        </svg>
      )}

      {/* Content: sellers → center → leads */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 py-6">

        {/* Sellers */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {row.sellerItems.slice(0, shownS).map((s, i) => (
            <div key={s.id} ref={(el) => { sellerRefs.current[i] = el; }}>
              <MobileChip
                href={`/electronics/seller/${s.id}`}
                author={s.author}
                type="seller"
                isW={isW}
                animDelay={index * 0.05 + 0.06 + i * 0.038}
                inView={inView}
              />
            </div>
          ))}
          {row.sellerItems.length > MAX_MOBILE && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.05 + 0.32, type: 'spring' }}
              className={`self-center text-[10px] font-semibold px-2 py-1 rounded-xl border ${
                isW ? 'text-purple-600 border-purple-500/25 bg-purple-500/[0.07]'
                    : 'text-orange-600 border-orange-500/25 bg-orange-500/[0.07]'
              }`}
            >
              +{row.sellerItems.length - MAX_MOBILE}
            </motion.div>
          )}
          {row.sellerItems.length === 0 && (
            <span className="text-[11px] text-gray-800 italic">нет продавцов</span>
          )}
        </div>

        {/* Center node */}
        <div ref={centerRef}>
          <CatNodeLarge def={row.def} isMatch={isMatch} inView={inView} />
        </div>

        {/* Leads */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {row.leadItems.slice(0, shownL).map((l, i) => (
            <div key={l.id} ref={(el) => { leadRefs.current[i] = el; }}>
              <MobileChip
                href={`/electronics/lead/${l.id}`}
                author={l.author}
                type="lead"
                isW={false}
                animDelay={index * 0.05 + 0.22 + i * 0.038}
                inView={inView}
              />
            </div>
          ))}
          {row.leadItems.length > MAX_MOBILE && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.05 + 0.46, type: 'spring' }}
              className="self-center text-[10px] font-semibold px-2 py-1 rounded-xl border text-blue-600 border-blue-500/25 bg-blue-500/[0.07]"
            >
              +{row.leadItems.length - MAX_MOBILE}
            </motion.div>
          )}
          {row.leadItems.length === 0 && (
            <span className="text-[11px] text-gray-800 italic">нет лидов</span>
          )}
        </div>

        {/* Expand button — bottom, not in center */}
        {(row.sellerItems.length > MAX_MOBILE || row.leadItems.length > MAX_MOBILE) && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.05 + 0.5, type: 'spring', stiffness: 360 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setExpanded(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] font-semibold transition-colors self-end ${
              expanded
                ? 'border-white/20 bg-white/[0.06] text-gray-300'
                : isMatch
                ? 'border-green-500/25 bg-green-500/[0.08] text-green-400'
                : 'border-white/10 bg-white/[0.04] text-gray-500'
            }`}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              className="leading-none"
            >
              ↓
            </motion.span>
            {expanded ? 'свернуть' : 'все'}
          </motion.button>
        )}
      </div>

      {/* Mobile expandable full list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className={`mx-3 mb-4 rounded-xl border p-3 ${
              isMatch ? 'border-green-500/10 bg-green-500/[0.03]' : 'border-white/[0.05] bg-white/[0.02]'
            }`}>
              <div className="grid grid-cols-2 gap-4">

                {/* All sellers */}
                <div>
                  <div className={`text-[9px] uppercase tracking-widest font-bold mb-2.5 flex items-center gap-1.5 ${isW ? 'text-purple-600' : 'text-orange-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isW ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    {isW ? 'Оптовики' : 'Продавцы'} · {row.sellerItems.length}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {row.sellerItems.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025, type: 'spring', stiffness: 380, damping: 26 }}
                      >
                        <Link href={`/electronics/seller/${s.id}`}>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[11px] font-medium truncate ${
                            isW ? 'border-purple-500/20 bg-purple-500/[0.06] text-purple-300'
                                : 'border-orange-500/20 bg-orange-500/[0.06] text-orange-300'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${avatarGradient(uname(s.author))} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                              {uname(s.author)[0]?.toUpperCase()}
                            </div>
                            <span className="truncate">@{uname(s.author)}</span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* All leads */}
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-blue-600 mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Лиды · {row.leadItems.length}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {row.leadItems.map((l, i) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025, type: 'spring', stiffness: 380, damping: 26 }}
                      >
                        <Link href={`/electronics/lead/${l.id}`}>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] text-blue-300 text-[11px] font-medium truncate">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${avatarGradient(uname(l.author))} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                              {uname(l.author)[0]?.toUpperCase()}
                            </div>
                            <span className="truncate">@{uname(l.author)}</span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */

export function ConnectionSchema({ leads, sellers }: Props) {
  const [mode, setMode] = useState<Mode>('wholesale');
  const wholesale = useMemo(() => sellers.filter(s =>  s.wholesale), [sellers]);
  const retail    = useMemo(() => sellers.filter(s => !s.wholesale), [sellers]);
  const pool      = mode === 'wholesale' ? wholesale : retail;
  const rows      = useMemo(() => buildRows(pool, leads), [pool, leads]);
  const matchRows = rows.filter(r => r.sellerItems.length > 0 && r.leadItems.length > 0);
  const covered   = matchRows.reduce((s, r) => s + r.leadItems.length, 0);
  const isW       = mode === 'wholesale';
  const sc        = isW ? 'purple' : 'orange';

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Toggle */}
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 w-fit">
        {([
          { id: 'wholesale' as Mode, label: '🏭 Оптовики', n: wholesale.length },
          { id: 'retail'    as Mode, label: '🏪 Розница',  n: retail.length    },
        ]).map(({ id, label, n }) => (
          <button key={id} onClick={() => setMode(id)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {mode === id && (
              <motion.div layoutId="mode-bg"
                className={`absolute inset-0 rounded-xl ${id === 'wholesale' ? 'bg-purple-500/20' : 'bg-orange-500/20'}`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }} />
            )}
            <span className="relative">{label}</span>
            <span className="relative ml-1.5 text-xs text-gray-600">{n}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: isW ? 'Оптовиков' : 'Продавцов', v: pool.length,      c: sc      },
          { label: 'Совпадений',                     v: matchRows.length, c: 'green' },
          { label: 'Лидов охвачено',                 v: covered,          c: 'blue'  },
        ] as const).map(({ label, v, c }, i) => (
          <motion.div key={label + mode}
            initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 320 }}
            className={`rounded-2xl border p-3 md:p-5 text-center ${
              c === 'purple' ? 'bg-purple-500/[0.05] border-purple-500/20' :
              c === 'orange' ? 'bg-orange-500/[0.05] border-orange-500/20' :
              c === 'green'  ? 'bg-green-500/[0.05]  border-green-500/20'  :
                               'bg-blue-500/[0.05]   border-blue-500/20'
            }`}>
            <motion.div key={v}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className={`text-2xl md:text-3xl font-bold tabular-nums ${
                c === 'purple' ? 'text-purple-400' : c === 'orange' ? 'text-orange-400' :
                c === 'green'  ? 'text-green-400'  : 'text-blue-400'
              }`}>
              {v}
            </motion.div>
            <div className="text-[10px] text-gray-600 mt-1.5 uppercase tracking-wide">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-gray-600 flex-wrap px-1">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isW ? 'bg-purple-500' : 'bg-orange-500'}`} />
          {isW ? 'Оптовики' : 'Продавцы'} — кликабельны
        </span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Совпадение</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Лиды — кликабельны</span>
      </div>

      {/* Rows */}
      <AnimatePresence mode="wait">
        <motion.div key={mode}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.04] py-16 text-center text-gray-600 text-sm">
              Нет данных.
            </div>
          ) : (
            <>
              {/* Mobile: vertical web */}
              <div className="md:hidden space-y-4">
                {rows.map((row, i) => (
                  <WebRowMobile key={row.def.name + mode} row={row} index={i} sc={sc} />
                ))}
              </div>
              {/* Desktop: horizontal web */}
              <div className="hidden md:block space-y-3">
                {rows.map((row, i) => (
                  <WebRow key={row.def.name + mode} row={row} index={i} sc={sc} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
