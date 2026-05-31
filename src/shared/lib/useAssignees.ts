'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSIGNEES_CHANGED_EVENT,
  colorMeta,
  fetchAssignees,
  MANAGER_IDS,
  MANAGER_LIST,
  MANAGERS,
  normalizeUsername,
  postAssignee,
  type Assignee,
  type ManagerId,
} from './assignees';

/**
 * Hook для работы с назначениями менеджеров. Хранилище — Supabase через /api/assignees.
 * Ключ — Telegram username собеседника (без @, lowercase).
 *
 * Внутренняя map обновляется:
 *   1) при монтировании — fetch с сервера
 *   2) при изменении через set/cycle — оптимистично + POST
 *   3) при получении кастомного события ASSIGNEES_CHANGED_EVENT — рефетч
 */
export function useAssignees() {
  const [map, setMap] = useState<Record<string, ManagerId>>({});
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetchAssignees().then((m) => {
      if (!cancelled) setMap(m);
    });
    const onChanged = () => {
      fetchAssignees().then((m) => { if (!cancelled) setMap(m); });
    };
    window.addEventListener(ASSIGNEES_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(ASSIGNEES_CHANGED_EVENT, onChanged);
    };
  }, []);

  const set = useCallback(async (author: string, value: Assignee) => {
    const key = normalizeUsername(author);
    if (!key) return;
    // оптимистичный апдейт
    setMap((prev) => {
      const next = { ...prev };
      if (value == null) delete next[key];
      else next[key] = value;
      return next;
    });
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    try {
      const ok = await postAssignee(key, value);
      if (!ok) {
        // откат: перечитываем из источника правды
        const fresh = await fetchAssignees();
        setMap(fresh);
      }
    } finally {
      inFlight.current.delete(key);
      window.dispatchEvent(new CustomEvent(ASSIGNEES_CHANGED_EVENT));
    }
  }, []);

  const get = useCallback(
    (author: string): Assignee => {
      const key = normalizeUsername(author);
      return (map[key] ?? null) as Assignee;
    },
    [map],
  );

  const cycle = useCallback(
    (author: string) => {
      const current = get(author);
      const order: Assignee[] = [null, ...MANAGER_IDS];
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      set(author, next);
    },
    [get, set],
  );

  /** Считает кол-во по каждому менеджеру среди items (у каждого должно быть поле `author`). */
  const countBy = useCallback(
    (items: { author?: string | null }[]) => {
      const counts: Record<string, number> = {};
      for (const m of MANAGER_LIST) counts[m.id] = 0;
      for (const it of items) {
        const key = normalizeUsername(it.author ?? '');
        if (!key) continue;
        const v = map[key];
        if (v && v in counts) counts[v] += 1;
      }
      return { ...counts, total: items.length } as Record<string, number> & { total: number };
    },
    [map],
  );

  const managers = useMemo(
    () => MANAGER_LIST.map((m) => ({ ...m, meta: colorMeta(m.color) })),
    [],
  );

  return { map, set, cycle, get, countBy, MANAGERS, managers };
}
