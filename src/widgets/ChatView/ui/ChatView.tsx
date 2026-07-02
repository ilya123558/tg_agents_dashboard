'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatContact } from '@/shared/types';
import { AssigneePicker } from '@/features/AssigneeMarker';
import { useAssignees } from '@/shared/lib/useAssignees';
import {
  CHAT_MESSAGES_EVENT,
  fetchMessages,
  normalizeUsername as normalizeChatUsername,
  sendMessage,
  type ChatMessage,
} from '@/shared/lib/chatMessages';
import { avatarGradient, avatarText } from '@/shared/lib/conversations';
import { supabase } from '@/shared/lib/supabase-client';
import { useVertical } from '@/shared/lib/VerticalContext';
import { PinnedContext } from './PinnedContext';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';

interface ChatViewProps {
  lead: ChatContact | null;
  onBack?: () => void;       // на мобиле — вернуться к списку
}

const POLL_MS = 30000; // запасной поллинг — realtime основной источник

export function ChatView({ lead, onBack }: ChatViewProps) {
  const vertical = useVertical();
  const { get: getAssignee } = useAssignees();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const authorKey = lead?.author ?? '';
  const normalizedAuthor = useMemo(() => normalizeChatUsername(authorKey), [authorKey]);

  const refresh = useCallback(async () => {
    if (!authorKey) return;
    const msgs = await fetchMessages(authorKey, vertical);
    setMessages(msgs);
  }, [authorKey, vertical]);

  // Первая загрузка при смене лида
  useEffect(() => {
    setMessages([]);
    if (!authorKey) return;
    refresh();
  }, [authorKey, refresh]);

  // Запасной поллинг (на случай если realtime отвалится)
  useEffect(() => {
    if (!authorKey) return;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [authorKey, refresh]);

  // Realtime подписка на сообщения только этого диалога этой вертикали
  useEffect(() => {
    if (!normalizedAuthor) return;
    const channel = supabase
      .channel(`chat-view-${vertical}-${normalizedAuthor}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `author_username=eq.${normalizedAuthor}`,
        },
        (payload) => {
          // Доп. фильтр по вертикали на клиенте (Supabase realtime фильтрует только по 1 полю)
          const row = (payload.new ?? payload.old) as { vertical?: string } | undefined;
          if (!row || row.vertical === vertical) refresh();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [normalizedAuthor, vertical, refresh]);

  // Слушаем кастомное событие после отправки — мгновенное обновление
  useEffect(() => {
    if (!authorKey) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ author: string }>).detail;
      if (detail?.author && lead?.author && detail.author === lead.author.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').toLowerCase()) {
        refresh();
      } else {
        // Безопасный fallback — на любое событие тоже рефрешим
        refresh();
      }
    };
    window.addEventListener(CHAT_MESSAGES_EVENT, handler);
    return () => window.removeEventListener(CHAT_MESSAGES_EVENT, handler);
  }, [authorKey, lead?.author, refresh]);

  // Автоскролл вниз
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, authorKey]);

  const username = useMemo(() => (lead?.author ?? '').replace('https://t.me/', ''), [lead]);
  const assignee = lead ? getAssignee(lead.author ?? '') : null;
  const grad = avatarGradient(lead?.author);

  async function handleSend(text: string) {
    if (!lead?.author) return;
    await sendMessage(lead.author, text, assignee ?? 'agent', vertical);
    // refresh уже происходит из CHAT_MESSAGES_EVENT
  }

  if (!lead) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0d0d0d] p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="text-center max-w-sm"
        >
          <div className="text-5xl mb-4 opacity-30">💬</div>
          <div className="text-sm text-gray-500 mb-1">Выбери диалог слева</div>
          <div className="text-[11px] text-gray-700">
            Кликни на лида в списке — увидишь его исходное сообщение из группы
            и сможешь сразу написать в личку.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-[#0d0d0d] min-w-0">
      {/* Header */}
      <motion.div
        key={lead.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="border-b border-white/[0.06] bg-[#111] px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 md:gap-3 shrink-0"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1 -ml-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            title="Назад"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center
                         text-sm md:text-base font-bold text-white shrink-0`}>
          {avatarText(lead.author)}
        </div>
        <div className="flex-1 min-w-0">
          {lead.author ? (
            <a
              href={lead.author}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white hover:text-blue-300 transition-colors truncate block"
            >
              @{username || 'unknown'}
            </a>
          ) : (
            <div className="text-sm font-medium text-white truncate">@{username || 'unknown'}</div>
          )}
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${
              lead.kind === 'seller' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'}`}>
              {lead.kind === 'seller' ? '🏪 Продавец' : '🛒 Покупатель'}
            </span>
            <span className="text-[10px] text-gray-600 flex items-center gap-1 min-w-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">{lead.group ?? 'без группы'}</span>
            </span>
          </div>
        </div>

        {/* Assignee picker */}
        <div className="shrink-0">
          <AssigneePicker author={lead.author} size="md" showLabel showChevron />
        </div>
      </motion.div>

      {/* Scrollable content: pinned + messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
        <PinnedContext lead={lead} />

        <div className="mt-4 space-y-2">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-xs text-gray-700 py-12"
            >
              Нет сообщений. Напиши первым.
            </motion.div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={m.id} message={m} index={i} />
          ))}
        </div>
      </div>

      {/* Composer */}
      <Composer onSend={handleSend} />
    </div>
  );
}
