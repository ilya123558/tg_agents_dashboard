'use client';

import { PropsWithChildren, ReactElement, useRef } from 'react';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { cn } from '@/views/lib';

export { SwiperSlide as Slide };

interface SliderProps {
  className?: string;
  prevButton?: ReactElement;
  nextButton?: ReactElement;
  spaceBetween?: number;
  slidesPerView?: number;
}

/**
 * Обёртка над Swiper для создания слайдеров.
 * Слайды оборачивай в компонент Slide (реэкспорт SwiperSlide).
 *
 * @param prevButton - Кастомная кнопка назад
 * @param nextButton - Кастомная кнопка вперёд
 * @param spaceBetween - Отступ между слайдами в px (по умолчанию 0)
 * @param slidesPerView - Количество видимых слайдов (по умолчанию 3)
 *
 * @example
 * import { Slider, Slide } from '@/shared/ui';
 *
 * <Slider slidesPerView={2} spaceBetween={16} prevButton={<ArrowLeft />} nextButton={<ArrowRight />}>
 *   <Slide><Card /></Slide>
 *   <Slide><Card /></Slide>
 * </Slider>
 */
export const Slider = ({
  children,
  className,
  prevButton,
  nextButton,
  slidesPerView = 3,
  spaceBetween = 0,
}: PropsWithChildren<SliderProps>) => {
  const swiperRef = useRef<SwiperRef | null>(null);

  return (
    <div className={cn('w-full h-full relative', className)}>
      <Swiper
        ref={swiperRef}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        className='w-full h-full'
      >
        {children}
      </Swiper>
      {prevButton && (
        <div onClick={() => swiperRef.current?.swiper.slidePrev()}>
          {prevButton}
        </div>
      )}
      {nextButton && (
        <div onClick={() => swiperRef.current?.swiper.slideNext()}>
          {nextButton}
        </div>
      )}
    </div>
  );
};
