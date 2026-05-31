'use client';

import type { SellerStatus } from '@/entities/Seller';

const STATUS_META: Record<SellerStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  'новый':   { label: 'Новый',   text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   dot: 'bg-blue-400'   },
  'в работе': { label: 'В работе', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  'готово':  { label: 'Готово',  text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  dot: 'bg-green-400'  },
};

interface SellerStatusSelectProps {
  value: SellerStatus;
  /** Игнорируется — статус управляется автоматически. */
  onChange?: (value: SellerStatus) => void;
}

/**
 * Display-only бейдж статуса продавца. Ручное редактирование запрещено.
 */
export function SellerStatusSelect({ value }: SellerStatusSelectProps) {
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
