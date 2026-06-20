import type { LeadStatus } from '@/entities/Lead';

const CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  'новый':       { label: 'Новый',       className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'отправлено':  { label: 'Отправлено',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'ответил':     { label: 'Ответил',     className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'не ответил':  { label: 'Не ответил',  className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = CONFIG[status] ?? CONFIG['новый'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
