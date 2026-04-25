'use client';

import { PropsWithChildren } from 'react';
import { cn } from '@/views/lib';

interface AnimationHeightWrapperProps {
  isOpen: boolean;
  maxHeight?: number;
  withoutOverflowHidden?: boolean;
  className?: string;
}

interface AnimationWidthWrapperProps {
  isOpen: boolean;
  maxWidth?: number;
  withoutOverflowHidden?: boolean;
  className?: string;
}

/**
 * Анимирует высоту блока при открытии/закрытии.
 * Используй для: аккордеонов, раскрывающихся списков, коллапсов.
 *
 * @param isOpen - Открыт или закрыт
 * @param maxHeight - Максимальная высота в px когда открыт (по умолчанию 1000)
 * @param withoutOverflowHidden - Отключить overflow: hidden
 *
 * @example
 * const [isOpen, toggle] = useToggle();
 *
 * <button onClick={toggle}>Toggle</button>
 * <AnimationHeightWrapper isOpen={isOpen}>
 *   <p>Скрытый контент</p>
 * </AnimationHeightWrapper>
 */
export const AnimationHeightWrapper = ({
  children,
  className,
  isOpen,
  maxHeight,
  withoutOverflowHidden,
}: PropsWithChildren<AnimationHeightWrapperProps>) => {
  const cap = typeof maxHeight === 'number' ? maxHeight : 1000;

  return (
    <div
      style={{ maxHeight: isOpen ? `${cap}px` : '0px' }}
      className={cn(
        !withoutOverflowHidden && 'overflow-hidden',
        'transition-all duration-500',
        !isOpen && 'opacity-0 pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Анимирует ширину блока при открытии/закрытии.
 * Используй для: сайдбаров, выдвигающихся панелей.
 *
 * @param isOpen - Открыт или закрыт
 * @param maxWidth - Максимальная ширина в px когда открыт (по умолчанию 1000)
 * @param withoutOverflowHidden - Отключить overflow: hidden
 *
 * @example
 * const [isOpen, toggle] = useToggle();
 *
 * <button onClick={toggle}>Toggle</button>
 * <AnimationWidthWrapper isOpen={isOpen} maxWidth={300}>
 *   <Sidebar />
 * </AnimationWidthWrapper>
 */
export const AnimationWidthWrapper = ({
  children,
  className,
  isOpen,
  maxWidth,
  withoutOverflowHidden,
}: PropsWithChildren<AnimationWidthWrapperProps>) => {
  const cap = typeof maxWidth === 'number' ? maxWidth : 1000;

  return (
    <div
      style={{ maxWidth: isOpen ? `${cap}px` : '0px' }}
      className={cn(
        !withoutOverflowHidden && 'overflow-hidden',
        'transition-all duration-500',
        !isOpen && 'opacity-0 pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  );
};
