'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetStroyLeadsQuery } from '@/entities/Lead';
import { managersForVertical, normalizeUsername } from '@/shared/lib/assignees';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useConversations } from '@/shared/lib/useConversations';
import type { LeadStatus } from '@/entities/Lead';

// Простая аналитика по одежде: считаем сами из Notion-лидов + assignees из Supabase.
// Никакого отдельного бекенд-эндпоинта — данные те же что и на главной странице.

interface Day { date: string; new: number; replied: number }

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function StroyAnalyticsPage() {
  const { data, isLoading, isError } = useGetStroyLeadsQuery(undefined, { pollingInterval: 60_000 });
  const { map: assigneeMap } = useAssignees();
  const { hasReplied } = useConversations();
  const router = useRouter();

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const managers = useMemo(() => managersForVertical('stroy'), []);

  // KPI
  const today = startOfDay(new Date()).getTime();
  const weekAgo = today - 6 * 24 * 60 * 60 * 1000;
  const monthAgo = today - 29 * 24 * 60 * 60 * 1000;

  const newToday = useMemo(
    () => leads.filter((l) => l.date && new Date(l.date).getTime() >= today).length,
    [leads, today],
  );
  const newWeek = useMemo(
    () => leads.filter((l) => l.date && new Date(l.date).getTime() >= weekAgo).length,
    [leads, weekAgo],
  );

  const statusCount = useMemo(() => {
    const c: Record<LeadStatus | 'all', number> = {
      'all': leads.length, 'новый': 0, 'отправлено': 0, 'ответил': 0, 'не ответил': 0,
    };
    for (const l of leads) {
      if (l.status in c) (c as Record<string, number>)[l.status] += 1;
    }
    return c;
  }, [leads]);

  const replyRate = useMemo(() => {
    const sent = statusCount['отправлено'] + statusCount['ответил'] + statusCount['не ответил'];
    if (sent === 0) return 0;
    return statusCount['ответил'] / sent;
  }, [statusCount]);

  // Per-manager
  const perManager = useMemo(() => {
    return managers.map((m) => {
      const assignedAuthors = Object.entries(assigneeMap)
        .filter(([, id]) => id === m.id)
        .map(([author]) => author);
      const assignedLeads = leads.filter((l) => {
        const key = normalizeUsername(l.author ?? '');
        return key && assignedAuthors.includes(key);
      });
      const replied = assignedLeads.filter((l) => l.status === 'ответил' || hasReplied(l.author)).length;
      const sent = assignedLeads.filter((l) => l.status !== 'новый').length;
      return {
        ...m,
        assigned: assignedLeads.length,
        sent,
        replied,
      };
    });
  }, [managers, leads, assigneeMap, hasReplied]);

  // Timeseries — 14 дней
  const timeseries = useMemo<Day[]>(() => {
    const days: Day[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
      days.push({ date: isoDay(d), new: 0, replied: 0 });
    }
    const idx: Record<string, number> = {};
    days.forEach((d, i) => { idx[d.date] = i; });
    for (const l of leads) {
      if (!l.date) continue;
      const k = new Date(l.date).toISOString().slice(0, 10);
      const i = idx[k];
      if (i !== undefined) {
        days[i].new += 1;
        if (l.status === 'ответил') days[i].replied += 1;
      }
    }
    return days;
  }, [leads]);

  const maxDay = useMemo(() => Math.max(1, ...timeseries.flatMap((d) => [d.new, d.replied])), [timeseries]);

  // Top groups
  const topGroups = useMemo(() => {
    const byGroup = new Map<string, { total: number; replied: number }>();
    for (const l of leads) {
      const g = l.group || '—';
      const v = byGroup.get(g) ?? { total: 0, replied: 0 };
      v.total += 1;
      if (l.status === 'ответил') v.replied += 1;
      byGroup.set(g, v);
    }
    return [...byGroup.entries()]
      .map(([group, v]) => ({ group, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

  return (
    <>
      <header className="border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center gap-3 sticky top-0
                         bg-[#0f0f0f]/90 backdrop-blur-sm z-30">
        <button
          type="button"
          onClick={() => router.push('/stroy')}
          className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          title="К разделу"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">📊</span>
          <span className="font-medium text-white text-sm">Аналитика · Стройка</span>
        </div>

        <Link
          href="/stroy/messages"
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-300 hover:text-white
                     transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
        >
          <span className="hidden sm:inline">Сообщения</span>
          <span className="sm:hidden">💬</span>
        </Link>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto w-full">
        {isLoading && !data && (
          <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Загрузка...
          </div>
        )}
        {isError && <div className="text-center py-20 text-red-500 text-sm">Ошибка загрузки</div>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Новые сегодня" value={newToday} accent="blue" delay={0} />
              <KpiCard label="За неделю"     value={newWeek}  accent="violet" delay={0.05} />
              <KpiCard label="Ответили"      value={statusCount['ответил']} accent="emerald" delay={0.1} suffix={`из ${statusCount['отправлено'] + statusCount['ответил'] + statusCount['не ответил']}`} />
              <KpiCard label="Конверсия"     value={Math.round(replyRate * 100)} accent="amber" delay={0.15} suffix="%" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-white">Новые лиды и ответы</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">последние 14 дней</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500" /> новые</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> ответили</span>
                </div>
              </div>
              <TimeseriesChart data={timeseries} max={maxDay} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {perManager.map((m, i) => {
                const conv = m.sent > 0 ? Math.round((m.replied / m.sent) * 100) : 0;
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
                          <div className="text-[11px] text-gray-600">{m.assigned} лидов закреплено</div>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold tabular-nums ${m.meta.text}`}>{conv}%</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Отправлено</div>
                        <div className="text-2xl font-bold tabular-nums text-white">{m.sent}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Ответили</div>
                        <div className={`text-2xl font-bold tabular-nums ${m.meta.text}`}>{m.replied}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-white">Топ групп по лидам</h2>
                  <p className="text-[11px] text-gray-600 mt-0.5">где чаще всего находим запросы</p>
                </div>
                <span className="text-[10px] text-gray-600 tabular-nums">{topGroups.length}</span>
              </div>
              {topGroups.length === 0 ? (
                <div className="text-center text-xs text-gray-600 py-8">Лидов ещё нет</div>
              ) : (
                <div className="space-y-1.5">
                  {topGroups.map((g, i) => {
                    const conv = g.total > 0 ? Math.round((g.replied / g.total) * 100) : 0;
                    return (
                      <div
                        key={g.group}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <span className="text-[10px] text-gray-600 tabular-nums w-5">{i + 1}</span>
                        <span className="text-sm text-gray-200 flex-1 truncate">{g.group}</span>
                        <span className="text-[11px] text-gray-600 tabular-nums">
                          <span className="text-blue-400">{g.total}</span>
                          <span className="text-gray-700 mx-1">·</span>
                          <span className="text-emerald-400">{g.replied} отв</span>
                          {g.replied > 0 && (
                            <>
                              <span className="text-gray-700 mx-1">·</span>
                              <span className="text-amber-400">{conv}%</span>
                            </>
                          )}
                        </span>
                      </div>
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

// ─── Chart ─────────────────────────────────────────────────────────────────

function TimeseriesChart({ data, max }: { data: Day[]; max: number }) {
  const H = 140;
  const PAD = 8;
  const innerH = H - PAD * 2;
  const barGroupW = 100 / data.length;
  const barW = (barGroupW - 2) / 2;

  return (
    <div className="relative w-full">
      <div className="relative" style={{ height: H }}>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-white/[0.04]" />
          ))}
        </div>

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`}>
          {data.map((d, i) => {
            const x0 = i * barGroupW + 1;
            const newH = max > 0 ? (d.new / max) * innerH : 0;
            const repliedH = max > 0 ? (d.replied / max) * innerH : 0;
            return (
              <g key={d.date}>
                <rect
                  x={x0}
                  y={PAD + (innerH - newH)}
                  width={barW}
                  height={newH}
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
