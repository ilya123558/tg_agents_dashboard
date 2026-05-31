/**
 * Server-only Supabase REST client. Использует service_role ключ — не импортировать
 * из клиентских компонентов.
 *
 * Доступ к таблицам:
 *   public.messages       — переписка
 *   public.assignees      — кто из менеджеров обрабатывает диалог
 *   public.conversations  — VIEW: последнее сообщение + счётчики по каждому автору
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  // На уровне модуля валим, чтобы было сразу видно
  console.error('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
}

const HEADERS: HeadersInit = {
  apikey: KEY ?? '',
  Authorization: `Bearer ${KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function rest(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    ...init,
    headers: { ...HEADERS, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  return res;
}

export async function sbSelect<T = any>(table: string, query: string = ''): Promise<T[]> {
  const res = await rest(`/${table}${query ? `?${query}` : ''}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase select ${table} ${res.status}: ${txt}`);
  }
  return (await res.json()) as T[];
}

export async function sbInsert<T = any>(table: string, data: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
  const res = await rest(`/${table}`, { method: 'POST', body: JSON.stringify(data) });
  if (res.status === 409) return []; // unique conflict — норма
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase insert ${table} ${res.status}: ${txt}`);
  }
  return (await res.json()) as T[];
}

export async function sbUpdate<T = any>(table: string, query: string, data: Record<string, unknown>): Promise<T[]> {
  const res = await rest(`/${table}?${query}`, { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase update ${table} ${res.status}: ${txt}`);
  }
  return (await res.json()) as T[];
}

export async function sbUpsert<T = any>(table: string, data: Record<string, unknown>, onConflict: string): Promise<T[]> {
  const res = await rest(`/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase upsert ${table} ${res.status}: ${txt}`);
  }
  return (await res.json()) as T[];
}

export async function sbDelete(table: string, query: string): Promise<void> {
  const res = await rest(`/${table}?${query}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase delete ${table} ${res.status}: ${txt}`);
  }
}

// ─── Domain types ───────────────────────────────────────────────────────────

export interface DbMessage {
  id: string;
  author_username: string;
  direction: 'in' | 'out';
  text: string;
  tg_message_id: number | null;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  sent_by: string | null;
  error: string | null;
  created_at: string;
}

export interface DbAssignee {
  author_username: string;
  manager_id: string | null;
  updated_at: string;
}

export interface DbConversation {
  author_username: string;
  last_message_at: string;
  message_count: number;
  in_count: number;
  out_count: number;
  last_text: string | null;
  last_direction: 'in' | 'out' | null;
  assignee: string | null;
}

/** Нормализует @username/URL → 'username' (lowercase, без @). */
export function normalizeUsername(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '')
    .toLowerCase();
}
