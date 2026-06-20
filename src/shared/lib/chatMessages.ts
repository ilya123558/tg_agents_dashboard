/**
 * Клиентский слой над API чата. Никакого localStorage — всё ходит в Supabase
 * через /api/chat/*.
 *
 * События:
 *   CHAT_MESSAGES_EVENT — диспатчится после успешного `sendMessage()`, чтобы
 *   подписчики (ChatView) могли мгновенно перечитать историю не дожидаясь
 *   следующего поллинга.
 */

export type MessageDirection = 'in' | 'out';
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  /** Telegram username собеседника (lowercase, без @). */
  authorUsername: string;
  direction: MessageDirection;
  text: string;
  status: MessageStatus;
  sentBy?: string;
  tgMessageId?: number | null;
  error?: string | null;
  createdAt: string;
}

interface DbRow {
  id: string;
  author_username: string;
  direction: MessageDirection;
  text: string;
  status: MessageStatus;
  sent_by: string | null;
  tg_message_id: number | null;
  error: string | null;
  created_at: string;
}

function rowToMsg(r: DbRow): ChatMessage {
  return {
    id: r.id,
    authorUsername: r.author_username,
    direction: r.direction,
    text: r.text,
    status: r.status,
    sentBy: r.sent_by ?? undefined,
    tgMessageId: r.tg_message_id,
    error: r.error,
    createdAt: r.created_at,
  };
}

/** Унификация username — '@Ivan' / 'https://t.me/Ivan' → 'ivan'. */
export function normalizeUsername(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '')
    .toLowerCase();
}

export async function fetchMessages(authorOrUrl: string | null, vertical: string = 'electronics'): Promise<ChatMessage[]> {
  const author = normalizeUsername(authorOrUrl);
  if (!author) return [];
  const res = await fetch(`/api/chat/messages?author=${encodeURIComponent(author)}&vertical=${encodeURIComponent(vertical)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: DbRow[] };
  return (data.messages ?? []).map(rowToMsg);
}

export async function sendMessage(
  authorOrUrl: string | null,
  text: string,
  sentBy?: string,
  vertical: string = 'electronics',
): Promise<ChatMessage | null> {
  const author = normalizeUsername(authorOrUrl);
  if (!author || !text.trim()) return null;
  const res = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text: text.trim(), sentBy, vertical }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { message?: DbRow };
  const msg = data.message ? rowToMsg(data.message) : null;
  if (msg && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CHAT_MESSAGES_EVENT, { detail: { author: msg.authorUsername } }),
    );
  }
  return msg;
}

export const CHAT_MESSAGES_EVENT = 'dashboard:chatMessages:changed';

// ─── Conversations (для списка диалогов) ────────────────────────────────────

export interface ConversationSummary {
  authorUsername: string;
  lastMessageAt: string;
  lastText: string | null;
  lastDirection: 'in' | 'out' | null;
  inCount: number;
  outCount: number;
  assignee: string | null;
}

export async function fetchConversations(vertical: string = 'electronics'): Promise<ConversationSummary[]> {
  const res = await fetch(`/api/chat/conversations?vertical=${encodeURIComponent(vertical)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    conversations?: {
      author_username: string;
      last_message_at: string;
      last_text: string | null;
      last_direction: 'in' | 'out' | null;
      in_count: number;
      out_count: number;
      assignee: string | null;
    }[];
  };
  return (data.conversations ?? []).map((c) => ({
    authorUsername: c.author_username,
    lastMessageAt: c.last_message_at,
    lastText: c.last_text,
    lastDirection: c.last_direction,
    inCount: c.in_count,
    outCount: c.out_count,
    assignee: c.assignee,
  }));
}
