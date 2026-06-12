'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchConversations, type ConversationSummary } from './chatMessages';
import { normalizeUsername } from './assignees';
import { supabase } from './supabase-client';

/**
 * Хук читает сводки диалогов (view conversations) + подписывается на realtime
 * изменения messages. Используется в LeadsTable/LeadCard для подсветки лидов,
 * которые уже ответили.
 */
export function useConversations() {
  const [map, setMap] = useState<Map<string, ConversationSummary>>(new Map());

  const load = useCallback(async () => {
    const list = await fetchConversations();
    const m = new Map<string, ConversationSummary>();
    for (const c of list) m.set(c.authorUsername, c);
    setMap(m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeLoad = () => { if (!cancelled) load(); };
    safeLoad();
    const channel = supabase
      .channel('useconversations-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, safeLoad)
      .subscribe();
    const id = setInterval(safeLoad, 30_000); // safety net
    return () => {
      cancelled = true;
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const get = useCallback(
    (author: string | null | undefined): ConversationSummary | null => {
      const key = normalizeUsername(author ?? '');
      if (!key) return null;
      return map.get(key) ?? null;
    },
    [map],
  );

  const hasReplied = useCallback(
    (author: string | null | undefined) => {
      const c = get(author);
      return !!(c && c.inCount > 0);
    },
    [get],
  );

  return useMemo(() => ({ map, get, hasReplied, reload: load }), [map, get, hasReplied, load]);
}
