'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetLeadsQuery } from '@/entities/Lead';
import { useGetSellersQuery } from '@/entities/Seller';
import { StatsPanel, type LeadFilter } from '@/widgets/StatsPanel';
import { LeadsTable } from '@/widgets/LeadsTable';
import { SellersTable } from '@/widgets/SellersTable';
import { GroupsStats } from '@/widgets/GroupsStats';
import { ConnectionSchema } from '@/widgets/ConnectionSchema';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useManagerStats } from '@/shared/lib/useManagerStats';
import { ManagerInitials } from '@/shared/ui/managerInitials/ManagerInitials';
import { ScrollToTop } from '@/features/ScrollToTop';
import type { Lead } from '@/entities/Lead';
import type { Seller } from '@/entities/Seller';

type Tab = 'leads' | 'sellers' | 'schema';
type DateRange = '1d' | '3d' | '7d';

const DATE_RANGES: { value: DateRange; label: string; days: number }[] = [
  { value: '1d', label: 'Сутки',  days: 1 },
  { value: '3d', label: '3 дня',  days: 3 },
  { value: '7d', label: 'Неделя', days: 7 },
];

const TABS: { value: Tab; label: string; accent: string }[] = [
  { value: 'leads',   label: 'Лиды',     accent: 'border-blue-500'   },
  { value: 'sellers', label: 'Продавцы', accent: 'border-orange-500' },
  { value: 'schema',  label: 'Связи',    accent: 'border-purple-500' },
];

const SCROLL_STORAGE_KEY = 'electronics:scrollY';
const VALID_TABS: Tab[] = ['leads', 'sellers', 'schema'];
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

export default function ElectronicsPage() {
  const [tab, setTabState] = useState<Tab>(() => readParam('tab', VALID_TABS, 'leads'));
  const [dateRange, setDateRangeState] = useState<DateRange>(() => readParam('period', VALID_RANGES, '1d'));
  const [leadStatusFilter, setLeadStatusFilterState] = useState<LeadFilter>(() => readParam('status', VALID_FILTERS, 'все'));
  const groupsRef = useRef<HTMLDivElement | null>(null);

  const setTab = useCallback((t: Tab) => { setTabState(t); writeParam('tab', t); }, []);
  const setDateRange = useCallback((r: DateRange) => { setDateRangeState(r); writeParam('period', r); }, []);
  const setLeadStatusFilter = useCallback((s: LeadFilter) => { setLeadStatusFilterState(s); writeParam('status', s); }, []);

  const { data: leadsData, isLoading: leadsLoading, isError: leadsError } = useGetLeadsQuery(undefined, { pollingInterval: 60_000 });
  const { data: sellersData, isLoading: sellersLoading, isError: sellersError } = useGetSellersQuery(undefined, { pollingInterval: 60_000 });

  const isLoading = leadsLoading || sellersLoading;
  const isError = leadsError || sellersError;

  const cutoff = useMemo(() => {
    const days = DATE_RANGES.find(r => r.value === dateRange)?.days ?? 1;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [dateRange]);

  const filteredLeads = useMemo(
    () => (leadsData?.leads ?? []).filter(l => l.date && new Date(l.date).getTime() >= cutoff),
    [leadsData, cutoff],
  );
  const filteredSellers = useMemo(
    () => (sellersData?.sellers ?? []).filter(s => s.date && new Date(s.date).getTime() >= cutoff),
    [sellersData, cutoff],
  );

  // Chat navigation + assignee counts
  const router = useRouter();
  const { managers } = useAssignees();

  const visibleForCounts = useMemo<(Lead | Seller)[]>(
    () => (tab === 'sellers' ? filteredSellers : filteredLeads),
    [tab, filteredSellers, filteredLeads],
  );
  const { counts, unread } = useManagerStats(visibleForCounts, 'electronics');

  const openLeadChat = useCallback((lead: Lead) => {
    router.push(`/electronics/messages?chat=${lead.id}`);
  }, [router]);

  const openSellerChat = useCallback((seller: Seller) => {
    router.push(`/electronics/messages?chat=${seller.id}`);
  }, [router]);

  function handleStatusClick(s: LeadFilter) {
    setLeadStatusFilter(s);
    setTab('leads');
  }

  function handleGroupsClick() {
    groupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Continuously save scroll position (debounced) so navigation away has fresh value
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

  // After data + content rendered, restore scroll once
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (isLoading) return;
    if (!leadsData && !sellersData) return;
    const saved = (() => {
      try { return sessionStorage.getItem(SCROLL_STORAGE_KEY); } catch { return null; }
    })();
    if (!saved) { restoredRef.current = true; return; }
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y) || y <= 0) { restoredRef.current = true; return; }
    // Wait two frames so layout settles (animations, lazy bars, etc.)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        restoredRef.current = true;
      });
    });
  }, [isLoading, leadsData, sellersData]);

  return (
    <>
      <header className="border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center gap-3 sticky top-0
                         bg-[#0f0f0f]/90 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">📱</span>
          <span className="font-medium text-white text-sm">Электроника</span>
        </div>

        {/* Period segmented control */}
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
                    layoutId="period-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                  />
                )}
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Assignee counter — динамически из конфига менеджеров */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          {managers.map((m) => {
            const count = counts[m.id] ?? 0;
            return (
              <div
                key={m.id}
                title={`${m.name}: ${count}`}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-white/[0.06] ${m.meta.soft}`}
              >
                <ManagerInitials manager={m} unread={unread[m.id]} />
                <span className="text-[11px] text-gray-400">{m.name}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${m.meta.text}`}>{count}</span>
              </div>
            );
          })}
        </div>

        <Link
          href="/electronics/analytics"
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
          href="/electronics/messages"
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

      {/* Mobile assignee counter */}
      <div className="md:hidden px-4 pt-3 flex flex-wrap items-center justify-center gap-2">
        {managers.map((m) => {
          const count = counts[m.id] ?? 0;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-white/[0.06] ${m.meta.soft}`}
            >
              <ManagerInitials manager={m} unread={unread[m.id]} />
              <span className="text-[11px] text-gray-400">{m.name}</span>
              <span className={`text-[11px] font-semibold tabular-nums ${m.meta.text}`}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Mobile period selector (under header) */}
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
                    layoutId="period-pill-mobile"
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

        {(leadsData || sellersData) && (
          <>
            <StatsPanel
              leads={filteredLeads}
              sellers={filteredSellers}
              activeStatus={tab === 'leads' ? leadStatusFilter : 'все'}
              onStatusClick={handleStatusClick}
              onSellersClick={() => setTab('sellers')}
              onGroupsClick={handleGroupsClick}
            />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/5">
              {TABS.map((t) => {
                const active = tab === t.value;
                const count =
                  t.value === 'leads' ? filteredLeads.length :
                  t.value === 'sellers' ? filteredSellers.length :
                  null;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                                ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {t.label}
                    {count !== null && (
                      <span className={`ml-1.5 text-xs tabular-nums ${active ? 'text-gray-400' : 'text-gray-600'}`}>
                        {count}
                      </span>
                    )}
                    {active && (
                      <motion.span
                        layoutId="tab-underline"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className={`absolute -bottom-px left-0 right-0 h-0.5 ${t.accent.replace('border-', 'bg-')}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'leads' && leadsData && (
                <motion.div
                  key="leads"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <LeadsTable leads={filteredLeads} statusFilter={leadStatusFilter} onOpenChat={openLeadChat} />
                </motion.div>
              )}

              {tab === 'sellers' && sellersData && (
                <motion.div
                  key="sellers"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <SellersTable sellers={filteredSellers} onOpenChat={openSellerChat} />
                </motion.div>
              )}

              {tab === 'schema' && leadsData && sellersData && (
                <motion.div
                  key="schema"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <ConnectionSchema leads={filteredLeads} sellers={filteredSellers} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Groups breakdown — always at the bottom, scroll target */}
            {tab !== 'schema' && (
              <div ref={groupsRef} className="scroll-mt-20">
                <GroupsStats
                  leads={tab === 'sellers' ? filteredSellers : filteredLeads}
                  label={tab === 'sellers' ? 'продавцов' : 'лидов'}
                />
              </div>
            )}
          </>
        )}
      </main>

      <ScrollToTop />
    </>
  );
}
