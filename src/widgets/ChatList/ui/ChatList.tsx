'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead } from '@/entities/Lead';
import { avatarGradient, avatarText, relativeTime } from '@/shared/lib/conversations';
import { getManager, normalizeUsername } from '@/shared/lib/assignees';
import { useAssignees } from '@/shared/lib/useAssignees';
import { fetchConversations, type ConversationSummary } from '@/shared/lib/chatMessages';
import { supabase } from '@/shared/lib/supabase-client';

interface ChatListProps {
  leads: Lead[];
  activeId: string | null;
  onSelect: (lead: Lead) => void;
}

const POLL_MS = 30000; // запасной поллинг — реалтайм основной источник

export function ChatList({ leads, activeId, onSelect }: ChatListProps) {
  const [search, setSearch] = useState('');
  const { get: getAssignee, managers } = useAssignees();
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [convMap, setConvMap] = useState<Map<string, ConversationSummary>>(new Map());

  // Подгружаем сводки диалогов с сервера + realtime подписка на новые сообщения
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const list = await fetchConversations();
      if (cancelled) return;
      const m = new Map<string, ConversationSummary>();
      for (const c of list) m.set(c.authorUsername, c);
      setConvMap(m);
    };
    load();

    // Подписка на любые изменения в messages: новое входящее, отправленное, статусы.
    // На любое событие перечитываем агрегированную вьюшку — это дёшево.
    const channel = supabase
      .channel('chat-list-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (!cancelled) load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignees' }, () => {
        if (!cancelled) load();
      })
      .subscribe();

    const id = setInterval(load, POLL_MS); // на случай если realtime отвалится
    return () => {
      cancelled = true;
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const activeId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chat')
      : null;
    return leads.filter((lead) => {
      if (q) {
        const haystack = `${lead.author ?? ''} ${lead.group ?? ''} ${lead.text ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (managerFilter !== 'all') {
        const assignee = getAssignee(lead.author ?? '');
        if (assignee !== managerFilter) return false;
      }
      // Показываем диалоги если:
      //   а) есть переписка в Supabase
      //   б) на лида назначен менеджер (Александр / Антон)
      //   в) этот диалог сейчас открыт через ?chat=<id>
      const key = normalizeUsername(lead.author ?? '');
      const hasMessages = key && convMap.has(key);
      const hasAssignee = getAssignee(lead.author ?? '') !== null;
      if (!hasMessages && !hasAssignee && lead.id !== activeId) return false;
      return true;
    });
  }, [leads, search, getAssignee, managerFilter, convMap]);

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

  // Общее число диалогов (с сообщениями ИЛИ с назначенным менеджером).
  // Используется для счётчика «Все N» — не зависит от поиска/фильтра менеджера.
  const totalVisible = useMemo(() => {
    const activeId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('chat')
      : null;
    return leads.filter((lead) => {
      const key = normalizeUsername(lead.author ?? '');
      const hasMessages = key && convMap.has(key);
      const hasAssignee = getAssignee(lead.author ?? '') !== null;
      return hasMessages || hasAssignee || lead.id === activeId;
    }).length;
  }, [leads, convMap, getAssignee]);

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
          {sorted.map((lead, idx) => (
            <ChatListItem
              key={lead.id}
              lead={lead}
              summary={convMap.get(normalizeUsername(lead.author ?? '')) ?? null}
              active={lead.id === activeId}
              onSelect={() => onSelect(lead)}
              index={idx}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatListItem({
  lead, summary, active, onSelect, index,
}: {
  lead: Lead;
  summary: ConversationSummary | null;
  active: boolean;
  onSelect: () => void;
  index: number;
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

  // Непрочитано: есть входящее как последнее, ИЛИ ни одной переписки ещё нет
  const unread = !summary || summary.lastDirection === 'in';

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
                       text-base font-bold text-white relative`}>
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
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-gray-200'}`}>
            @{username || 'unknown'}
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
