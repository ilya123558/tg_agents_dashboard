'use client';

import { PropsWithChildren } from 'react';
import { useMediaQuery } from '@/views/hooks';

/**
 * Компоненты для условного отображения контента в зависимости от ширины экрана.
 * Брейкпоинты соответствуют Tailwind CSS.
 *
 * Sm   — показывает от 0 до 640px
 * SmUp — показывает от 640px и выше
 *
 * @example
 * <Sm><MobileMenu /></Sm>       // только на мобильном
 * <SmUp><DesktopMenu /></SmUp>  // от 640px и выше
 */

export const Sm = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(max-width: 639px)');
  return matches ? <>{children}</> : null;
};

export const SmUp = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(min-width: 640px)');
  return matches ? <>{children}</> : null;
};

export const Md = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(max-width: 767px)');
  return matches ? <>{children}</> : null;
};

export const MdUp = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(min-width: 768px)');
  return matches ? <>{children}</> : null;
};

export const Lg = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(max-width: 1023px)');
  return matches ? <>{children}</> : null;
};

export const LgUp = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(min-width: 1024px)');
  return matches ? <>{children}</> : null;
};

export const Xl = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(max-width: 1279px)');
  return matches ? <>{children}</> : null;
};

export const XlUp = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(min-width: 1280px)');
  return matches ? <>{children}</> : null;
};

export const XXl = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(max-width: 1535px)');
  return matches ? <>{children}</> : null;
};

export const XXlUp = ({ children }: PropsWithChildren) => {
  const matches = useMediaQuery('(min-width: 1536px)');
  return matches ? <>{children}</> : null;
};
