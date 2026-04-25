'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/views/lib';

interface ModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
}

/**
 * Модальное окно с backdrop blur и fade-анимацией. Без внешних зависимостей.
 * Закрывается по клику на backdrop или клавише Escape.
 *
 * @param isOpen - Открыта ли модалка
 * @param setIsOpen - Управление состоянием
 *
 * @example
 * const [isOpen, , open, close] = useToggle();
 *
 * <button onClick={open}>Открыть</button>
 * <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
 *   <p>Контент модалки</p>
 * </Modal>
 */
export const Modal = ({
  isOpen,
  setIsOpen,
  children,
  className,
}: PropsWithChildren<ModalProps>) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, setIsOpen]);

  if (!isMounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center select-none',
        'transition-all duration-500',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 min-w-[100px] min-h-[100px]',
          'rounded-[10px] border border-dashed border-gray-300',
          'bg-white p-6',
          'transition-all duration-500',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
