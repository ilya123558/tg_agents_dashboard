'use client';

import type { LeadStatus } from '@/entities/Lead';

const STATUS_META: Record<LeadStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  'новый':      { label: 'Новый',      text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   dot: 'bg-blue-400'   },
  'отправлено': { label: 'Отправлено', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  'ответил':    { label: 'Ответил',    text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  dot: 'bg-green-400'  },
  'не ответил': { label: 'Не ответил', text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-400'    },
};

interface StatusSelectProps {
  value: LeadStatus;
  /** Игнорируется — статус управляется автоматически, ручное изменение запрещено. */
  onChange?: (value: LeadStatus) => void;
}

/**
 * Display-only бейдж статуса лида.
 * Статус меняется только агентом автоматически (после отправки сообщения, ответа клиента и т.д.).
 */
export function StatusSelect({ value }: StatusSelectProps) {
  const meta = STATUS_META[value] ?? STATUS_META['новый'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                  ${meta.bg} ${meta.text} ${meta.border}`}
      title="Статус управляется автоматически"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
