'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { managersForVertical } from '@/shared/lib/assignees';

interface Totals {
  sent_today: number;
  sent_week: number;
  sent_month: number;
  sent_all: number;
  replies_all: number;
  reply_rate: number;
  conversations: number;
  assigned: number;
}

interface PerManager { id: string; sent: number; replied: number; assigned: number }
interface Day { date: string; sent: number; replied: number }
interface TopResponder {
  author_username: string;
  in_count: number;
  out_count: number;
  last_at: string;
  assignee: string | null;
}

interface AnalyticsData {
  totals: Totals;
  per_manager: PerManager[];
  timeseries: Day[];
  top_responders: TopResponder[];
}

const POLL_MS = 30_000;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch('/api/analytics?vertical=electronics', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as AnalyticsData;
        if (!cancelled) {
          setData(j);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const maxDay = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.timeseries.flatMap((d) => [d.sent, d.replied]));
  }, [data]);

  const managers = useMemo(() => managersForVertical('electronics'), []);

  return (
    <>
      <header className="border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center gap-3 sticky top-0
                         bg-[#0f0f0f]/90 backdrop-blur-sm z-30">
        <button
          type="button"
          onClick={() => router.push('/electronics')}
          className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          title="К разделу"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">📊</span>
          <span className="font-medium text-white text-sm">Аналитика · Электроника</span>
        </div>

        <Link
          href="/electronics/messages"
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-300 hover:text-white
                     transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
        >
          <span className="hidden sm:inline">Сообщения</span>
          <span className="sm:hidden">💬</span>
        </Link>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto w-full">
        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Загрузка...
          </div>
        )}
        {error && !data && (
          <div className="text-center py-20 text-red-500 text-sm">Ошибка: {error}</div>
        )}

        {data && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Отправлено сегодня" value={data.totals.sent_today} accent="blue" delay={0} />
              <KpiCard label="За неделю"          value={data.totals.sent_week}  accent="violet" delay={0.05} />
              <KpiCard label="Ответили"           value={data.totals.replies_all} accent="emerald" delay={0.1} suffix={`из ${data.totals.sent_all}`} />
              <KpiCard label="Конверсия"          value={Math.round(data.totals.reply_rate * 100)} accent="amber" delay={0.15} suffix="%" />
            </div>

            {/* Timeseries chart */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-white">Отправки и ответы</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">последние 14 дней</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500" /> отправлено</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> ответили</span>
                </div>
              </div>
              <TimeseriesChart data={data.timeseries} max={maxDay} />
            </motion.div>

            {/* Per-manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {managers.map((m, i) => {
                const stat = data.per_manager.find((p) => p.id === m.id) ?? { sent: 0, replied: 0, assigned: 0 };
                const conv = stat.sent > 0 ? Math.round((stat.replied / stat.sent) * 100) : 0;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5 overflow-hidden relative"
                  >
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${m.meta.bg} opacity-10`} />
                    <div className="relative flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${m.meta.bg}`}>
                          {m.initials}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-white">{m.name}</div>
                          <div className="text-[11px] text-gray-600">{stat.assigned} лидов закреплено</div>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold tabular-nums ${m.meta.text}`}>{conv}%</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Отправил</div>
                        <div className="text-2xl font-bold tabular-nums text-white">{stat.sent}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Ответили</div>
                        <div className={`text-2xl font-bold tabular-nums ${m.meta.text}`}>{stat.replied}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Top responders */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-white">Самые активные диалоги</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">больше всего входящих от лида</p>
                </div>
                <span className="text-[10px] text-gray-600 tabular-nums">{data.top_responders.length}</span>
              </div>
              {data.top_responders.length === 0 ? (
                <div className="text-center text-xs text-gray-600 py-8">Пока никто не ответил</div>
              ) : (
                <div className="space-y-1.5">
                  {data.top_responders.map((r, i) => {
                    const mgr = r.assignee ? managers.find((m) => m.id === r.assignee) : null;
                    return (
                      <Link
                        key={r.author_username}
                        href={`/electronics/messages?chat=${encodeURIComponent(r.author_username)}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors"
                      >
                        <span className="text-[10px] text-gray-600 tabular-nums w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-200 flex-1 truncate">@{r.author_username}</span>
                        {mgr && (
                          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${mgr.meta.soft} ${mgr.meta.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${mgr.meta.bg}`} />
                            {mgr.name}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-600 tabular-nums">
                          <span className="text-emerald-400">{r.in_count} ↓</span>
                          <span className="text-gray-700 mx-1">·</span>
                          <span className="text-blue-400">{r.out_count} ↑</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, accent, delay = 0, suffix,
}: { label: string; value: number; accent: 'blue' | 'violet' | 'emerald' | 'amber'; delay?: number; suffix?: string }) {
  const ACCENT: Record<typeof accent, { dot: string; text: string; blur: string }> = {
    blue:    { dot: 'bg-blue-500',    text: 'text-blue-400',    blur: 'bg-blue-500/[0.1]' },
    violet:  { dot: 'bg-violet-500',  text: 'text-violet-400',  blur: 'bg-violet-500/[0.1]' },
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-400', blur: 'bg-emerald-500/[0.1]' },
    amber:   { dot: 'bg-amber-500',   text: 'text-amber-400',   blur: 'bg-amber-500/[0.1]' },
  };
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl border border-white/[0.07] bg-[#161616] p-4 overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${a.blur}`} />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold tabular-nums ${a.text} leading-none`}>{value}</span>
          {suffix && <span className="text-[11px] text-gray-600">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SVG Timeseries Chart ────────────────────────────────────────────────────

function TimeseriesChart({ data, max }: { data: Day[]; max: number }) {
  const H = 140;
  const PAD = 8;
  const innerH = H - PAD * 2;
  const barGroupW = 100 / data.length; // %
  const barW = (barGroupW - 2) / 2;    // две колонки + чуть зазора

  return (
    <div className="relative w-full">
      <div className="relative" style={{ height: H }}>
        {/* horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-white/[0.04]" />
          ))}
        </div>

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`}>
          {data.map((d, i) => {
            const x0 = i * barGroupW + 1;
            const sentH = max > 0 ? (d.sent / max) * innerH : 0;
            const repliedH = max > 0 ? (d.replied / max) * innerH : 0;
            return (
              <g key={d.date}>
                <rect
                  x={x0}
                  y={PAD + (innerH - sentH)}
                  width={barW}
                  height={sentH}
                  rx={0.6}
                  className="fill-blue-500"
                  opacity={0.8}
                />
                <rect
                  x={x0 + barW + 0.5}
                  y={PAD + (innerH - repliedH)}
                  width={barW}
                  height={repliedH}
                  rx={0.6}
                  className="fill-emerald-500"
                  opacity={0.85}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* X axis labels */}
      <div className="grid gap-0 mt-1.5" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d, i) => {
          const dt = new Date(d.date);
          const show = i === 0 || i === data.length - 1 || i % 3 === 0;
          return (
            <div key={d.date} className="text-center text-[9px] tabular-nums text-gray-700">
              {show ? `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, '0')}` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
