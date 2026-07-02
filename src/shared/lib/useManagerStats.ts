'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchConversations, type ConversationSummary } from './chatMessages';
import { normalizeUsername } from './assignees';
import { useAssignees } from './useAssignees';
import { useChatSeen } from './chatSeen';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthorDated {
  author: string | null;
  date: string | null;
}

export interface ManagerStats {
  /** Кол-во «живых» лидов/продавцов на каждого менеджера (managerId → число). */
  counts: Record<string, number>;
  /** У кого есть непрочитанное входящее сообщение (managerId → true). */
  unread: Record<string, boolean>;
}

/**
 * Статистика по менеджерам для шапки/чипов.
 *
 * «Живой» = переписка не старше недели ИЛИ добавлен за последнюю неделю без
 * переписки. Заброшенные (общение >недели назад; либо добавлен >недели без
 * переписки) НЕ считаются.
 *
 * `unread` = у менеджера есть назначенный лид со свежим (≤недели) входящим
 * сообщением, которое ещё не открывали.
 */
export function useManagerStats<T extends AuthorDated>(items: T[], vertical: string): ManagerStats {
  const { countBy, get: getAssignee } = useAssignees();
  const { isSeenAfter, _version } = useChatSeen(vertical);
  const [convMap, setConvMap] = useState<Map<string, ConversationSummary>>(new Map());

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
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [vertical]);

  return useMemo(() => {
    const now = Date.now();
    const counts = countBy(
      items.filter((it) => {
        const conv = convMap.get(normalizeUsername(it.author ?? ''));
        if (conv) return now - new Date(conv.lastMessageAt).getTime() <= WEEK_MS;
        const added = it.date ? new Date(it.date).getTime() : 0;
        return added > 0 && now - added <= WEEK_MS;
      }),
    );

    const unread: Record<string, boolean> = {};
    for (const it of items) {
      const uname = normalizeUsername(it.author ?? '');
      const conv = convMap.get(uname);
      if (!conv || conv.lastDirection !== 'in') continue;                       // нет входящего последним
      if (now - new Date(conv.lastMessageAt).getTime() > WEEK_MS) continue;     // старше недели
      if (isSeenAfter(uname, conv.lastMessageAt)) continue;                     // уже открывали
      const mgr = getAssignee(it.author ?? '');
      if (mgr) unread[mgr] = true;
    }

    return { counts, unread };
    // _version — чтобы пересчитать после отметки «прочитано»
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, convMap, countBy, getAssignee, isSeenAfter, _version]);
}
