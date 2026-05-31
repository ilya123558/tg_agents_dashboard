'use client';

import { motion } from 'framer-motion';
import { getManager, type Assignee } from '@/shared/lib/assignees';

interface AssigneeMarkerProps {
  value: Assignee;
  onCycle: () => void;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

/**
 * Маркер-аватар: пустой контур = не назначен, цветной чип с инициалами = менеджер.
 * Клик циклически меняет значение через onCycle.
 */
export function AssigneeMarker({ value, onCycle, size = 'md', title }: AssigneeMarkerProps) {
  const manager = getManager(value);

  const dim =
    size === 'sm' ? { box: 'w-4 h-4',  initials: 'text-[8px]',  plus: 'w-2.5 h-2.5' } :
    size === 'lg' ? { box: 'w-7 h-7',  initials: 'text-[11px]', plus: 'w-4 h-4'     } :
                    { box: 'w-5 h-5',  initials: 'text-[9px]',  plus: 'w-3 h-3'     };

  const computedTitle = title ?? (manager ? `Обрабатывает: ${manager.name}` : 'Не назначен — кликни чтобы взять');

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCycle();
      }}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.12 }}
      title={computedTitle}
      aria-label={computedTitle}
      className={`${dim.box} rounded-full shrink-0 flex items-center justify-center font-bold leading-none
                  transition-shadow duration-150 ${
        manager
          ? `${manager.meta.bg} text-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)] hover:shadow-[0_0_10px_-2px_currentColor]`
          : 'border border-dashed border-white/25 hover:border-white/50 text-white/35 hover:text-white/70'
      }`}
    >
      {manager ? (
        <span className={dim.initials}>{manager.initials}</span>
      ) : (
        <svg
          className={`${dim.plus} block`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      )}
    </motion.button>
  );
}
