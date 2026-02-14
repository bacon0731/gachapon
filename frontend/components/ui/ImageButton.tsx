import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ImageButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  src: string;
  alt: string;
  text?: string; // Optional text overlay
  textClassName?: string;
}

export const ImageButton = React.forwardRef<HTMLButtonElement, ImageButtonProps>(
  ({ className, src, alt, text, textClassName, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
        whileTap={{ scale: 0.95, filter: 'brightness(0.9)' }}
        className={cn(
          "relative flex items-center justify-center transition-all focus:outline-none select-none bg-transparent border-none p-0",
          className
        )}
        {...props}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain pointer-events-none"
          unoptimized
        />
        {text && (
          <span className={cn(
            "absolute inset-0 flex items-center justify-center font-black text-white drop-shadow-md z-10",
            textClassName
          )}>
            {text}
          </span>
        )}
      </motion.button>
    );
  }
);

ImageButton.displayName = 'ImageButton';
