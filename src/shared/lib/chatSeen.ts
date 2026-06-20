/**
 * Локальный трекер «когда модератор последний раз открывал этот чат».
 * Используется чтобы скрывать «непрочитанный» индикатор после открытия диалога.
 *
 * Хранится в localStorage. Один user — один браузер. Если нужна
 * мульти-юзерность — нужно переносить в Supabase, но для текущего UX достаточно.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'chatSeen:v1';
const EVENT_NAME  = 'chat-seen-changed';

type SeenMap = Record<string, number>;

function readMap(): SeenMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: SeenMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // quota / parse fail — игнорим
  }
}

function key(vertical: string, username: string) {
  return `${vertical}::${username.toLowerCase().replace(/^@/, '')}`;
}

export function markChatSeen(vertical: string, username: string, at: number = Date.now()) {
  if (!username) return;
  const map = readMap();
  const k = key(vertical, username);
  if ((map[k] ?? 0) >= at) return;
  map[k] = at;
  writeMap(map);
}

export function getChatSeenAt(vertical: string, username: string): number {
  if (!username) return 0;
  return readMap()[key(vertical, username)] ?? 0;
}

/**
 * Хук: возвращает функцию `isSeenAfter(username, ts)` — true если модератор
 * открывал чат после указанной отметки. Перерисовывается на изменения карты.
 */
export function useChatSeen(vertical: string) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return {
    isSeenAfter: (username: string, ts: string | number) => {
      if (!username) return false;
      const seenAt = getChatSeenAt(vertical, username);
      const target = typeof ts === 'string' ? new Date(ts).getTime() : ts;
      return seenAt >= target;
    },
    _version: version,
  };
}
