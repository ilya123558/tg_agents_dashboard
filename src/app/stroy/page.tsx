'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetStroyLeadsQuery } from '@/entities/Lead';
import { StatsPanel, type LeadFilter } from '@/widgets/StatsPanel';
import { LeadsTable } from '@/widgets/LeadsTable';
import { GroupsStats } from '@/widgets/GroupsStats';
import { useAssignees } from '@/shared/lib/useAssignees';
import { ScrollToTop } from '@/features/ScrollToTop';
import type { Lead } from '@/entities/Lead';

type DateRange = '1d' | '3d' | '7d';

const DATE_RANGES: { value: DateRange; label: string; days: number }[] = [
  { value: '1d', label: 'Сутки',  days: 1 },
  { value: '3d', label: '3 дня',  days: 3 },
  { value: '7d', label: 'Неделя', days: 7 },
];

const SCROLL_STORAGE_KEY = 'stroy:scrollY';
const VALID_RANGES: DateRange[] = ['1d', '3d', '7d'];
const VALID_FILTERS: LeadFilter[] = ['все', 'новый', 'отправлено', 'ответил', 'не ответил'];

function readParam<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const v = new URLSearchParams(window.location.search).get(key);
  return valid.includes(v as T) ? (v as T) : fallback;
}

function writeParam(key: string, value: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url.toString());
}

export default function StroyPage() {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => readParam('period', VALID_RANGES, '1d'));
  const [leadStatusFilter, setLeadStatusFilterState] = useState<LeadFilter>(() => readParam('status', VALID_FILTERS, 'все'));
  const groupsRef = useRef<HTMLDivElement | null>(null);

  const setDateRange = useCallback((r: DateRange) => { setDateRangeState(r); writeParam('period', r); }, []);
  const setLeadStatusFilter = useCallback((s: LeadFilter) => { setLeadStatusFilterState(s); writeParam('status', s); }, []);

  const { data: leadsData, isLoading, isError } = useGetStroyLeadsQuery(undefined, { pollingInterval: 60_000 });

  const cutoff = useMemo(() => {
    const days = DATE_RANGES.find(r => r.value === dateRange)?.days ?? 1;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [dateRange]);

  const filteredLeads = useMemo(
    () => (leadsData?.leads ?? []).filter(l => l.date && new Date(l.date).getTime() >= cutoff),
    [leadsData, cutoff],
  );

  const router = useRouter();
  const { countBy, managers } = useAssignees();
  const counts = useMemo(() => countBy(filteredLeads), [filteredLeads, countBy]);

  const openLeadChat = useCallback((lead: Lead) => {
    router.push(`/stroy/messages?chat=${lead.id}`);
  }, [router]);

  function handleStatusClick(s: LeadFilter) {
    setLeadStatusFilter(s);
  }

  function handleGroupsClick() {
    groupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try { sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY)); } catch {}
      }, 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (isLoading) return;
    if (!leadsData) return;
    const saved = (() => {
      try { return sessionStorage.getItem(SCROLL_STORAGE_KEY); } catch { return null; }
    })();
    if (!saved) { restoredRef.current = true; return; }
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y) || y <= 0) { restoredRef.current = true; return; }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        restoredRef.current = true;
      });
    });
  }, [isLoading, leadsData]);

  return (
    <>
      <header className="border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center gap-3 sticky top-0
                         bg-[#0f0f0f]/90 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">🏗</span>
          <span className="font-medium text-white text-sm">Стройка</span>
        </div>

        <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.06] rounded-full p-0.5 ml-3">
          {DATE_RANGES.map((r) => {
            const active = dateRange === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={`relative px-3 py-1 text-[11px] font-medium rounded-full transition-colors ${
                  active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="period-pill-stroy"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                  />
                )}
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto hidden md:flex items-center gap-2">
          {managers.map((m) => {
            const count = counts[m.id] ?? 0;
            return (
              <div
                key={m.id}
                title={`${m.name}: ${count}`}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-white/[0.06] ${m.meta.soft}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${m.meta.bg}`}>
                  {m.initials}
                </span>
                <span className="text-[11px] text-gray-400">{m.name}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${m.meta.text}`}>{count}</span>
              </div>
            );
          })}
        </div>

        <Link
          href="/stroy/analytics"
          className="md:ml-3 ml-auto flex items-center gap-1.5 text-xs text-gray-300 hover:text-white
                     transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
          title="Аналитика"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden sm:inline font-medium">Аналитика</span>
        </Link>

        <Link
          href="/stroy/messages"
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white
                     transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
          title="Открыть сообщения"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline font-medium">Сообщения</span>
        </Link>
      </header>

      <div className="md:hidden px-4 pt-3 flex flex-wrap items-center justify-center gap-2">
        {managers.map((m) => {
          const count = counts[m.id] ?? 0;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-white/[0.06] ${m.meta.soft}`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${m.meta.bg}`}>
                {m.initials}
              </span>
              <span className="text-[11px] text-gray-400">{m.name}</span>
              <span className={`text-[11px] font-semibold tabular-nums ${m.meta.text}`}>{count}</span>
            </div>
          );
        })}
      </div>

      <div className="sm:hidden px-4 pt-3">
        <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-full p-0.5">
          {DATE_RANGES.map((r) => {
            const active = dateRange === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={`relative flex-1 px-2 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
                  active ? 'text-white' : 'text-gray-500'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="period-pill-stroy-mobile"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                  />
                )}
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto w-full">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Загрузка...
          </div>
        )}
        {isError && <div className="text-center py-20 text-red-500 text-sm">Ошибка загрузки</div>}

        {leadsData && (
          <>
            <StatsPanel
              leads={filteredLeads}
              activeStatus={leadStatusFilter}
              onStatusClick={handleStatusClick}
              onGroupsClick={handleGroupsClick}
            />

            <LeadsTable leads={filteredLeads} statusFilter={leadStatusFilter} onOpenChat={openLeadChat} />

            <div ref={groupsRef} className="scroll-mt-20">
              <GroupsStats leads={filteredLeads} label="лидов" />
            </div>
          </>
        )}
      </main>

      <ScrollToTop />
    </>
  );
}
