/**
 * Утилиты для UI чатов: PinnedContext, аватарки, относительное время.
 * История переписки больше не хранится в localStorage —
 * см. chatMessages.ts (fetchMessages / sendMessage через API).
 */

// ─── Pinned context visibility ───────────────────────────────────────────────

const PINNED_KEY = 'dashboard:pinnedHidden:v1';
const PINNED_EVENT = 'dashboard:pinnedHidden:changed';

function readPinnedHidden(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PINNED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writePinnedHidden(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PINNED_KEY, JSON.stringify(map));
  } catch {}
}

export function isPinnedHidden(leadId: string): boolean {
  return !!readPinnedHidden()[leadId];
}

export function setPinnedHidden(leadId: string, hidden: boolean) {
  const map = readPinnedHidden();
  if (hidden) map[leadId] = true; else delete map[leadId];
  writePinnedHidden(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PINNED_EVENT));
  }
}

export const PINNED_EVENT_NAME = PINNED_EVENT;

// ─── Quick replies ───────────────────────────────────────────────────────────

export const QUICK_REPLIES = [
  'Здравствуйте! Есть в наличии, отвечу в ЛС',
  'Подскажите модель и цвет?',
  'Цена с доставкой, напишу детали',
  'Отправлю фото',
  'В работе, отпишусь через час',
];

// ─── Avatar / time helpers ───────────────────────────────────────────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarText(username: string | null | undefined): string {
  if (!username) return '?';
  const cleaned = username.replace('https://t.me/', '').replace('@', '').trim();
  if (!cleaned) return '?';
  return cleaned.charAt(0).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-blue-500/80 to-blue-700/80',
  'from-purple-500/80 to-purple-700/80',
  'from-emerald-500/80 to-emerald-700/80',
  'from-amber-500/80 to-amber-700/80',
  'from-pink-500/80 to-pink-700/80',
  'from-cyan-500/80 to-cyan-700/80',
  'from-violet-500/80 to-violet-700/80',
  'from-rose-500/80 to-rose-700/80',
];

export function avatarGradient(username: string | null | undefined): string {
  if (!username) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[hashCode(username) % AVATAR_GRADIENTS.length];
}

/** «5 мин», «1 час», «вчера», «12.05» */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн`;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ─── One-time cleanup старых localStorage ключей ─────────────────────────────

const CLEANUP_KEY = 'dashboard:cleanedV1';

/** Стирает старые моки переписки / assignees, оставшиеся от localStorage эпохи. */
export function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(CLEANUP_KEY)) return;
    window.localStorage.removeItem('dashboard:chatMessages:v1');
    window.localStorage.removeItem('dashboard:assignees:v1');
    window.localStorage.setItem(CLEANUP_KEY, '1');
  } catch {}
}
