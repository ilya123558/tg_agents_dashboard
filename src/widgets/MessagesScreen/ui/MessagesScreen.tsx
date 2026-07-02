'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { ChatContact, ContactKind } from '@/shared/types';
import { ChatList } from '@/widgets/ChatList';
import { ChatView } from '@/widgets/ChatView';
import { useAssignees } from '@/shared/lib/useAssignees';
import { useUIShell } from '@/views/providers';
import { cleanupLegacyStorage } from '@/shared/lib/conversations';
import { useVertical } from '@/shared/lib/VerticalContext';
import { useManagerStats } from '@/shared/lib/useManagerStats';
import { ManagerInitials } from '@/shared/ui/managerInitials/ManagerInitials';

interface MessagesScreenProps {
  /** Название раздела в шапке, напр. «Электроника». */
  sectionName: string;
  /** Куда возвращает кнопка «назад», напр. «/electronics». */
  backHref: string;
  /** Покупатели (лиды). */
  buyers: ChatContact[];
  /** Продавцы. Может быть пустым — вкладка всё равно показывается. */
  sellers: ChatContact[];
  isLoading: boolean;
  isError: boolean;
}

const TAB_META: Record<ContactKind, { label: string; icon: string; active: string; pill: string }> = {
  buyer:  { label: 'Покупатели', icon: '🛒', active: 'text-sky-300',   pill: 'bg-sky-500/15' },
  seller: { label: 'Продавцы',   icon: '🏪', active: 'text-amber-300', pill: 'bg-amber-500/15' },
};

export function MessagesScreen({
  sectionName, backHref, buyers, sellers, isLoading, isError,
}: MessagesScreenProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ContactKind>('buyer');
  const [activeId, setActiveId] = useState<string | null>(null);
  const { managers } = useAssignees();
  const { setMobileFullscreen } = useUIShell();
  const vertical = useVertical();

  const activeList = tab === 'buyer' ? buyers : sellers;
  const combined = useMemo(() => [...buyers, ...sellers], [buyers, sellers]);

  // Счётчик «живых» лидов + «у кого непрочитанное» — единое правило (см. useManagerStats)
  const { counts, unread } = useManagerStats(activeList, vertical);

  const activeContact: ChatContact | null = useMemo(
    () => combined.find((c) => c.id === activeId) ?? null,
    [combined, activeId],
  );

  useEffect(() => { cleanupLegacyStorage(); }, []);

  // Восстанавливаем ?chat= из URL + подставляем правильную вкладку
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const chat = new URLSearchParams(window.location.search).get('chat');
    if (!chat) return;
    setActiveId(chat);
    const c = combined.find((x) => x.id === chat);
    if (c) setTab(c.kind);
  }, [combined]);

  // Синхронизируем activeId с URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeId) url.searchParams.set('chat', activeId);
    else url.searchParams.delete('chat');
    window.history.replaceState(null, '', url.toString());
  }, [activeId]);

  // На мобиле, когда диалог открыт — прячем глобальную нижнюю навигацию
  useEffect(() => {
    setMobileFullscreen(!!activeContact);
    return () => setMobileFullscreen(false);
  }, [activeContact, setMobileFullscreen]);

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(backHref);
  }

  const tabs: ContactKind[] = ['buyer', 'seller'];

  return (
    <div className="flex flex-col bg-[#0f0f0f] overflow-hidden h-[100dvh] md:h-screen">
      {/* Header */}
      <header className={`${activeContact ? 'hidden md:flex' : 'flex'}
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
          <span className="text-[11px] text-gray-600 truncate hidden sm:inline">· {sectionName}</span>
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
                <ManagerInitials manager={m} unread={unread[m.id]} />
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

      {!isLoading && !isError && (
        <div className="flex-1 flex min-h-0">
          {/* Список: вкладки + чаты */}
          <div className={`${activeContact ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] lg:w-[400px]
                           md:border-r md:border-white/[0.06] shrink-0 min-h-0`}>
            {/* Вкладки Покупатели | Продавцы */}
            <div className="flex items-center gap-1 p-2 border-b border-white/[0.06] bg-[#0d0d0d]">
              {tabs.map((k) => {
                const meta = TAB_META[k];
                const active = tab === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                                transition-colors ${active ? meta.active : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="messages-tab-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className={`absolute inset-0 rounded-xl -z-10 ${meta.pill}`}
                      />
                    )}
                    <span className="text-sm">{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0">
              <ChatList
                leads={activeList}
                activeId={activeId}
                onSelect={(c) => setActiveId(c.id)}
              />
            </div>
          </div>

          {/* Диалог */}
          <div className={`${activeContact ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 min-h-0`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeContact?.id ?? 'empty'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-1 min-w-0 min-h-0"
              >
                <ChatView lead={activeContact} onBack={() => setActiveId(null)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
