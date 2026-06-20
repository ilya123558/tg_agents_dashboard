'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGetClothingLeadsQuery } from '@/entities/Lead';
import type { Lead } from '@/entities/Lead';
import { ChatList } from '@/widgets/ChatList';
import { ChatView } from '@/widgets/ChatView';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useUIShell } from '@/views/providers';
import { cleanupLegacyStorage } from '@/shared/lib/conversations';

export default function ClothingMessagesPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetClothingLeadsQuery(undefined, { pollingInterval: 60_000 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const { countBy, managers } = useAssignees();
  const { setMobileFullscreen } = useUIShell();

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const counts = useMemo(() => countBy(leads), [leads, countBy]);

  const activeLead: Lead | null = useMemo(
    () => leads.find((l) => l.id === activeId) ?? null,
    [leads, activeId],
  );

  useEffect(() => {
    cleanupLegacyStorage();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const chat = params.get('chat');
    if (chat) setActiveId(chat);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeId) url.searchParams.set('chat', activeId);
    else url.searchParams.delete('chat');
    window.history.replaceState(null, '', url.toString());
  }, [activeId]);

  useEffect(() => {
    setMobileFullscreen(!!activeLead);
    return () => setMobileFullscreen(false);
  }, [activeLead, setMobileFullscreen]);

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/clothing');
    }
  }

  return (
    <div className="flex flex-col bg-[#0f0f0f] overflow-hidden h-[100dvh] md:h-screen">
      <header className={`${activeLead ? 'hidden md:flex' : 'flex'}
                          border-b border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur-sm
                          px-3 md:px-6 py-3 items-center gap-2 md:gap-3 z-30 shrink-0`}>
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          title="К разделу"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg shrink-0">💬</span>
          <span className="font-medium text-white text-sm truncate">Сообщения</span>
          <span className="text-[11px] text-gray-600 truncate hidden sm:inline">· Одежда</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2 shrink-0">
          {managers.map((m) => {
            const count = counts[m.id] ?? 0;
            return (
              <div
                key={m.id}
                title={`${m.name}: ${count}`}
                className={`flex items-center gap-1 md:gap-1.5 pl-1 pr-2 md:pr-2.5 py-0.5 rounded-full border border-white/[0.06] ${m.meta.soft}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${m.meta.bg}`}>
                  {m.initials}
                </span>
                <span className="text-[11px] text-gray-400 hidden md:inline">{m.name}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${m.meta.text}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </header>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Загрузка...
        </div>
      )}
      {isError && (
        <div className="flex-1 flex items-center justify-center text-red-500 text-sm">Ошибка загрузки</div>
      )}

      {data && (
        <div className="flex-1 flex min-h-0">
          <div className={`${activeLead ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] lg:w-[400px]
                           md:border-r md:border-white/[0.06] shrink-0 min-h-0`}>
            <ChatList
              leads={leads}
              activeId={activeId}
              onSelect={(l) => setActiveId(l.id)}
            />
          </div>

          <div className={`${activeLead ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 min-h-0`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLead?.id ?? 'empty'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-1 min-w-0 min-h-0"
              >
                <ChatView
                  lead={activeLead}
                  onBack={() => setActiveId(null)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
