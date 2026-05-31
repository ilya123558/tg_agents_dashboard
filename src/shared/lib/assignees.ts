/**
 * Менеджеры и палитра. Хранение и API теперь — Supabase через /api/assignees.
 * Этот файл оставлен для типов + хелперов цветов/инициалов.
 */

// ─── Палитра ─────────────────────────────────────────────────────────────────

export type ColorKey = 'emerald' | 'amber' | 'violet' | 'cyan' | 'pink' | 'lime' | 'sky' | 'rose';

export interface ColorMeta {
  key: ColorKey;
  bg: string;
  text: string;
  ring: string;
  soft: string;
  border: string;
}

const PALETTE: Record<ColorKey, ColorMeta> = {
  emerald: { key: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/40', soft: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  amber:   { key: 'amber',   bg: 'bg-amber-500',   text: 'text-amber-400',   ring: 'ring-amber-500/40',   soft: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  violet:  { key: 'violet',  bg: 'bg-violet-500',  text: 'text-violet-400',  ring: 'ring-violet-500/40',  soft: 'bg-violet-500/10',  border: 'border-violet-500/30' },
  cyan:    { key: 'cyan',    bg: 'bg-cyan-500',    text: 'text-cyan-400',    ring: 'ring-cyan-500/40',    soft: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
  pink:    { key: 'pink',    bg: 'bg-pink-500',    text: 'text-pink-400',    ring: 'ring-pink-500/40',    soft: 'bg-pink-500/10',    border: 'border-pink-500/30' },
  lime:    { key: 'lime',    bg: 'bg-lime-500',    text: 'text-lime-400',    ring: 'ring-lime-500/40',    soft: 'bg-lime-500/10',    border: 'border-lime-500/30' },
  sky:     { key: 'sky',     bg: 'bg-sky-500',     text: 'text-sky-400',     ring: 'ring-sky-500/40',     soft: 'bg-sky-500/10',     border: 'border-sky-500/30' },
  rose:    { key: 'rose',    bg: 'bg-rose-500',    text: 'text-rose-400',    ring: 'ring-rose-500/40',    soft: 'bg-rose-500/10',     border: 'border-rose-500/30' },
};

export function colorMeta(key: ColorKey): ColorMeta {
  return PALETTE[key];
}

// ─── Менеджеры ───────────────────────────────────────────────────────────────

export interface ManagerConfig {
  id: string;
  name: string;
  initials: string;
  color: ColorKey;
}

export const MANAGER_LIST: ManagerConfig[] = [
  { id: 'alexander', name: 'Александр', initials: 'Ал', color: 'emerald' },
  { id: 'anton',     name: 'Антон',     initials: 'Ан', color: 'amber'   },
];

export const MANAGER_IDS = MANAGER_LIST.map(m => m.id);
export type ManagerId = string;
export type Assignee = ManagerId | null;

export const MANAGERS: Record<string, ManagerConfig & { meta: ColorMeta }> = Object.fromEntries(
  MANAGER_LIST.map(m => [m.id, { ...m, meta: PALETTE[m.color] }]),
);

export function getManager(id: string | null | undefined): (ManagerConfig & { meta: ColorMeta }) | null {
  if (!id) return null;
  return MANAGERS[id] ?? null;
}

/** Унификация username — '@Ivan' / URL → 'ivan'. */
export function normalizeUsername(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '')
    .toLowerCase();
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function fetchAssignees(): Promise<Record<string, ManagerId>> {
  const res = await fetch('/api/assignees', { cache: 'no-store' });
  if (!res.ok) return {};
  const data = (await res.json()) as { assignees?: Record<string, ManagerId> };
  return data.assignees ?? {};
}

export async function postAssignee(author: string, managerId: ManagerId | null): Promise<boolean> {
  const res = await fetch('/api/assignees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: normalizeUsername(author), managerId }),
  });
  return res.ok;
}

export const ASSIGNEES_CHANGED_EVENT = 'dashboard:assignees:changed';
