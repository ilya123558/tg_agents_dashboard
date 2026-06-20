'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/views/lib';

interface ImageWithSkeletonProps extends ImageProps {
  skeletonClassName?: string;
}

/**
 * Замена next/image с автоматическим скелетоном.
 * Показывает шиммер пока картинка загружается, затем плавно отображает её.
 * Поддерживает оба режима: фиксированный размер (width/height) и fill.
 *
 * @param skeletonClassName - Дополнительные классы для скелетона
 *
 * @example
 * // фиксированный размер
 * <ImageWithSkeleton src="/photo.jpg" alt="photo" width={400} height={400} className="rounded-xl" />
 *
 * // fill — обёртка должна иметь position: relative и размеры
 * <div className="relative w-full aspect-square">
 *   <ImageWithSkeleton src="/photo.jpg" alt="photo" fill className="object-cover rounded-xl" />
 * </div>
 */
export const ImageWithSkeleton = ({
  className,
  skeletonClassName,
  onLoad,
  fill,
  ...props
}: ImageWithSkeletonProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn(fill ? 'absolute inset-0' : 'relative w-fit')}>
      <div
        className={cn(
          'absolute inset-0 skeleton-shimmer transition-opacity duration-500',
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100',
          className,
          skeletonClassName
        )}
      />
      <Image
        {...props}
        fill={fill}
        className={cn(
          'transition-opacity duration-500 block',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
      />
    </div>
  );
};
