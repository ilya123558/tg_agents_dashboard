'use client';

interface ManagerLike {
  initials: string;
  meta: { bg: string };
}

/**
 * Кружок-аватар менеджера с инициалами. Если `unread` — сверху пульсирующая
 * точка «новое сообщение». `ringColor` — цвет фона под точкой (обводка),
 * чтобы точка читалась на тёмной шапке.
 */
export function ManagerInitials({
  manager,
  unread = false,
  ringColor = '#0f0f0f',
}: {
  manager: ManagerLike;
  unread?: boolean;
  ringColor?: string;
}) {
  return (
    <span className="relative shrink-0">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${manager.meta.bg}`}>
        {manager.initials}
      </span>
      {unread && (
        <span
          title="Новое сообщение"
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
          style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
        />
      )}
    </span>
  );
}
