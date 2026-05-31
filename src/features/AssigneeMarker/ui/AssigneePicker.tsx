'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getManager, MANAGER_LIST, normalizeUsername } from '@/shared/lib/assignees';
import { useAssignees } from '@/shared/lib/useAssignees';
import { AssigneeMarker } from './AssigneeMarker';

interface AssigneePickerProps {
  /** Telegram username собеседника (URL, @username или просто username). */
  author: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showChevron?: boolean;
}

interface Coords {
  top: number;
  left: number;
  direction: 'up' | 'down';
}

const MENU_ROW_HEIGHT = 36;
const MENU_WIDTH = 200;

export function AssigneePicker({ author, size = 'md', showLabel = false, showChevron = false }: AssigneePickerProps) {
  const username = normalizeUsername(author);
  const { get, set } = useAssignees();
  const value = get(username);
  const manager = getManager(value);

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuHeight = (MANAGER_LIST.length + 1) * MENU_ROW_HEIGHT + 16;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const direction: 'up' | 'down' = spaceBelow >= menuHeight + 8 || spaceBelow > spaceAbove ? 'down' : 'up';
    const leftRaw = rect.right - MENU_WIDTH;
    const left = Math.max(8, Math.min(leftRaw, window.innerWidth - MENU_WIDTH - 8));
    setCoords({
      top: direction === 'down' ? rect.bottom + 6 : rect.top - 6,
      left,
      direction,
    });
  }, [open, menuHeight]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  function pick(id: string | null) {
    if (!username) return;
    set(username, id);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); if (username) setOpen((v) => !v); }}
        disabled={!username}
        className={`flex items-center gap-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    ${showLabel || showChevron
                      ? 'px-1.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      : ''}`}
        title={manager ? `Обрабатывает: ${manager.name}` : (username ? 'Назначить менеджера' : 'Нет username — назначить нельзя')}
      >
        <span className="pointer-events-none">
          <AssigneeMarker value={value} onCycle={() => {}} size={size} />
        </span>
        {showLabel && (
          <span className={`hidden md:inline ${manager ? manager.meta.text : 'text-gray-500'}`}>
            {manager?.name ?? 'не назначен'}
          </span>
        )}
        {showChevron && (
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: coords.direction === 'down' ? -4 : 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.direction === 'down' ? -4 : 4, scale: 0.96 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: coords.direction === 'down' ? coords.top : undefined,
                bottom: coords.direction === 'up' ? window.innerHeight - coords.top : undefined,
                left: coords.left,
                width: MENU_WIDTH,
                zIndex: 100,
              }}
              className="bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => pick(null)}
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-white/[0.04] transition-colors
                           flex items-center gap-2"
              >
                <span className="w-4 h-4 rounded-full border border-dashed border-white/30 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M4 8h8" />
                  </svg>
                </span>
                Снять назначение
              </button>
              {MANAGER_LIST.map((m) => {
                const meta = getManager(m.id)!.meta;
                const active = value === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pick(m.id)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2
                                ${active ? `${meta.soft} ${meta.text}` : 'text-gray-300 hover:bg-white/[0.04]'}`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${meta.bg}`}>
                      {m.initials}
                    </span>
                    {m.name}
                    {active && (
                      <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
