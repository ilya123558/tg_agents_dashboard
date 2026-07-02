'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatContact } from '@/shared/types';
import { avatarGradient, avatarText, relativeTime } from '@/shared/lib/conversations';
import { getManager, normalizeUsername } from '@/shared/lib/assignees';
import { useAssignees } from '@/shared/lib/useAssignees';
import { fetchConversations, type ConversationSummary } from '@/shared/lib/chatMessages';
import { supabase } from '@/shared/lib/supabase-client';
import { useVertical } from '@/shared/lib/VerticalContext';
import { markChatSeen, useChatSeen } from '@/shared/lib/chatSeen';

interface ChatListProps {
  leads: ChatContact[];
  activeId: string | null;
  onSelect: (lead: ChatContact) => void;
}

const POLL_MS = 30000; // запасной поллинг — реалтайм основной источник
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function ChatList({ leads, activeId, onSelect }: ChatListProps) {
  const vertical = useVertical();
  const [search, setSearch] = useState('');
  const { get: getAssignee, managers } = useAssignees();
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [convMap, setConvMap] = useState<Map<string, ConversationSummary>>(new Map());
  const { isSeenAfter } = useChatSeen(vertical);

  // При клике на чат: помечаем seen и проксируем выбор наружу
  const handleSelect = (lead: ChatContact) => {
    const username = normalizeUsername(lead.author ?? '');
    if (username) markChatSeen(vertical, username);
    onSelect(lead);
  };

  // Автоматически отмечаем seen для текущего активного чата при появлении/обновлении
  useEffect(() => {
    if (!activeId) return;
    const lead = leads.find((l) => l.id === activeId);
    const username = normalizeUsername(lead?.author ?? '');
    if (!username) return;
    const conv = convMap.get(username);
    if (conv) markChatSeen(vertical, username, new Date(conv.lastMessageAt).getTime());
    else markChatSeen(vertical, username);
  }, [activeId, convMap, leads, vertical]);

  // Подгружаем сводки диалогов с сервера + realtime подписка на новые сообщения
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const list = await fetchConversations(vertical);
      if (cancelled) return;
      const m = new Map<string, ConversationSummary>();
      for (const c of list) m.set(c.authorUsername, c);
      setConvMap(m);
    };
    load();

    const channel = supabase
      .channel(`chat-list-messages-${vertical}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `vertical=eq.${vertical}` }, () => {
        if (!cancelled) load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignees', filter: `vertical=eq.${vertical}` }, () => {
        if (!cancelled) load();
      })
      .subscribe();

    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [vertical]);

  // Дедуплицируем лиды по автору — у одного юзера может быть несколько лидов
  // (нашли его в разных чатах в разные дни). Чат всегда один — по author.
  // Берём самый свежий лид как представителя.
  const uniqueLeads = useMemo(() => {
    const activeId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chat')
      : null;
    const byAuthor = new Map<string, ChatContact>();
    const leadTime = (l: ChatContact) => {
      const conv = convMap.get(normalizeUsername(l.author ?? ''));
      if (conv) return new Date(conv.lastMessageAt).getTime();
      return l.date ? new Date(l.date).getTime() : 0;
    };
    for (const lead of leads) {
      const key = normalizeUsername(lead.author ?? '') || `__noauthor__${lead.id}`;
      const cur = byAuthor.get(key);
      // Активный лид побеждает всегда (чтобы открытый чат не пропал из списка)
      if (lead.id === activeId) {
        byAuthor.set(key, lead);
        continue;
      }
      if (cur?.id === activeId) continue;
      if (!cur || leadTime(lead) > leadTime(cur)) byAuthor.set(key, lead);
    }
    return Array.from(byAuthor.values());
  }, [leads, convMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const activeId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chat')
      : null;
    return uniqueLeads.filter((lead) => {
      if (q) {
        const haystack = `${lead.author ?? ''} ${lead.group ?? ''} ${lead.text ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (managerFilter !== 'all') {
        const assignee = getAssignee(lead.author ?? '');
        if (assignee !== managerFilter) return false;
      }
      // Показываем диалоги если есть переписка ИЛИ назначен менеджер ИЛИ он открыт
      const key = normalizeUsername(lead.author ?? '');
      const hasMessages = key && convMap.has(key);
      const hasAssignee = getAssignee(lead.author ?? '') !== null;
      if (!hasMessages && !hasAssignee && lead.id !== activeId) return false;
      // Скрываем ЗАБРОШЕННЫЕ (глобально, при любом фильтре): общение было >недели
      // назад, либо добавлен >недели назад без переписки. Открытый диалог не прячем.
      if (lead.id !== activeId) {
        const now = Date.now();
        const conv = convMap.get(key);
        const withinWeek = conv
          ? now - new Date(conv.lastMessageAt).getTime() <= WEEK_MS
          : lead.date ? now - new Date(lead.date).getTime() <= WEEK_MS : false;
        if (!withinWeek) return false;
      }
      return true;
    });
  }, [uniqueLeads, search, getAssignee, managerFilter, convMap]);

  // Сортировка: сначала диалоги с самым свежим сообщением
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ca = convMap.get(normalizeUsername(a.author ?? ''));
      const cb = convMap.get(normalizeUsername(b.author ?? ''));
      const ta = ca ? new Date(ca.lastMessageAt).getTime() : a.date ? new Date(a.date).getTime() : 0;
      const tb = cb ? new Date(cb.lastMessageAt).getTime() : b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [filtered, convMap]);

  // Общее число диалогов (уникальные авторы с сообщениями или менеджером)
  const totalVisible = useMemo(() => {
    const activeId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chat')
      : null;
    return uniqueLeads.filter((lead) => {
      const key = normalizeUsername(lead.author ?? '');
      const hasMessages = key && convMap.has(key);
      const hasAssignee = getAssignee(lead.author ?? '') !== null;
      if (lead.id === activeId) return true;
      if (!hasMessages && !hasAssignee) return false;
      const now = Date.now();
      const conv = convMap.get(key);
      return conv
        ? now - new Date(conv.lastMessageAt).getTime() <= WEEK_MS
        : lead.date ? now - new Date(lead.date).getTime() <= WEEK_MS : false;
    }).length;
  }, [uniqueLeads, convMap, getAssignee]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.05]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, группе, тексту..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.04] border border-white/[0.06] rounded-xl
                       text-white placeholder:text-gray-700 focus:outline-none focus:border-white/15 transition-colors"
          />
        </div>
      </div>

      {/* All + manager chips row */}
      <div className="flex items-center gap-1.5 px-3 py-3 flex-wrap border-b border-white/[0.05]">
        <button
          type="button"
          onClick={() => setManagerFilter('all')}
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors
                      ${managerFilter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {managerFilter === 'all' && (
            <motion.span
              layoutId="chatlist-filter-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 bg-white/[0.08] rounded-full -z-10"
            />
          )}
          Все
          <span className="text-[10px] text-gray-600 tabular-nums">{totalVisible}</span>
        </button>
        {managers.map((m) => {
          const active = managerFilter === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setManagerFilter(active ? 'all' : m.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors
                          ${active ? m.meta.text : 'text-gray-500 hover:text-gray-300'}`}
            >
              {active && (
                <motion.span
                  layoutId="chatlist-filter-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className={`absolute inset-0 rounded-full -z-10 ${m.meta.soft}`}
                />
              )}
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${m.meta.bg}`}>
                {m.initials}
              </span>
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-3xl mb-2 opacity-40">💬</div>
            <div className="text-xs text-gray-600">Нет диалогов</div>
            <div className="text-[10px] text-gray-700 mt-1">Попробуй сменить фильтр</div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {sorted.map((lead, idx) => {
            const summary = convMap.get(normalizeUsername(lead.author ?? '')) ?? null;
            const seen = summary
              ? isSeenAfter(normalizeUsername(lead.author ?? ''), summary.lastMessageAt)
              : isSeenAfter(normalizeUsername(lead.author ?? ''), lead.date ?? 0);
            return (
              <ChatListItem
                key={lead.id}
                lead={lead}
                summary={summary}
                seen={seen}
                active={lead.id === activeId}
                onSelect={() => handleSelect(lead)}
                index={idx}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatListItem({
  lead, summary, active, onSelect, index, seen,
}: {
  lead: ChatContact;
  summary: ConversationSummary | null;
  active: boolean;
  onSelect: () => void;
  index: number;
  seen: boolean;
}) {
  const { get: getAssignee } = useAssignees();
  const assignee = getAssignee(lead.author ?? '');
  const manager = getManager(assignee);
  const username = (lead.author ?? '').replace('https://t.me/', '');
  const grad = avatarGradient(lead.author);

  const previewText = summary?.lastText ?? lead.text ?? '';
  const previewPrefix = summary?.lastDirection === 'out' ? 'Вы: ' : '';
  const timeStr = summary
    ? relativeTime(summary.lastMessageAt)
    : lead.date ? relativeTime(lead.date) : '';

  // Непрочитано если:
  //   а) последнее сообщение — входящее ИЛИ переписки ещё нет
  //   б) И модератор не открывал этот чат после последнего сообщения
  const baseUnread = !summary || summary.lastDirection === 'in';
  const unread = baseUnread && !seen;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18, delay: Math.min(index, 12) * 0.015 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full text-left px-3 py-2.5 flex items-start gap-3 border-l-2 transition-colors
                  ${active
                    ? 'bg-white/[0.05] border-blue-500'
                    : 'border-transparent hover:bg-white/[0.025]'}`}
    >
      <div className={`shrink-0 w-11 h-11 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center
                       text-base font-bold text-white relative
                       ${lead.kind === 'seller' ? 'ring-2 ring-amber-500/40' : ''}`}>
        {avatarText(lead.author)}
        {manager && (
          <span
            title={`Обрабатывает: ${manager.name}`}
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-[#0d0d0d]
                        flex items-center justify-center text-[7px] font-bold text-white ${manager.meta.bg}`}
          >
            {manager.initials}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-gray-200'}`}>
              @{username || 'unknown'}
            </span>
            <span className={`shrink-0 text-[8px] font-semibold px-1.5 py-px rounded-md leading-[1.35] ${
              lead.kind === 'seller' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'}`}>
              {lead.kind === 'seller' ? 'Продавец' : 'Покупатель'}
            </span>
          </span>
          <span className="text-[10px] text-gray-600 shrink-0">{timeStr}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-xs truncate flex-1 ${unread && !active ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="text-gray-700">{previewPrefix}</span>
            {previewText || <span className="italic text-gray-700">нет сообщений</span>}
          </p>
          {unread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="shrink-0 w-2 h-2 rounded-full bg-blue-500"
            />
          )}
        </div>
        {lead.group && (
          <div className="text-[10px] text-gray-700 truncate mt-0.5">📍 {lead.group}</div>
        )}
      </div>
    </motion.button>
  );
}
