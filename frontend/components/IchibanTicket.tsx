'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Hand } from 'lucide-react';

interface IchibanTicketProps {
  grade: string;
  prizeName: string;
  isOpened?: boolean;
  isLastOne?: boolean;
  onOpen?: () => void;
  className?: string;
}

export const IchibanTicket: React.FC<IchibanTicketProps> = ({
  grade,
  prizeName,
  isOpened: externalIsOpened,
  isLastOne = false,
  onOpen,
  className,
}) => {
  const [internalIsOpened, setInternalIsOpened] = useState(false);
  const isOpened = externalIsOpened !== undefined ? externalIsOpened : internalIsOpened;

  const handleOpen = () => {
    if (!isOpened) {
      setInternalIsOpened(true);
      onOpen?.();
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full max-w-[320px] aspect-[2/1] group select-none perspective-1000",
        !isOpened && "cursor-pointer",
        className
      )}
    >
      {/* Shadow layer for depth */}
      <div className="absolute inset-0 bg-black/10 rounded-3xl blur-md translate-y-1 group-hover:translate-y-2 transition-transform" />

      {/* Main Ticket Base */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-[#F3F4F6]">
        {/* Background Image */}
        <img 
          src="/images/bg.svg" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="ticket background"
          draggable={false}
        />

        {/* The Result Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={isOpened ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
            transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
            className="flex flex-col items-center justify-center w-full z-10 px-4"
          >
            <div className="flex items-baseline gap-0.5 sm:gap-1 text-center justify-center">
              <span className={cn(
                "text-4xl sm:text-5xl font-black tracking-tighter leading-none font-amount",
                isLastOne ? "text-yellow-600 drop-shadow-sm" : "text-neutral-900"
              )}>
                {(() => {
                  if (isLastOne) return "LAST";
                  const val = grade.replace('賞', '');
                  const num = parseInt(val);
                  return isNaN(num) ? val : num.toLocaleString();
                })()}
              </span>
              <span className={cn(
                "text-sm sm:text-lg font-black",
                isLastOne ? "text-yellow-700" : "text-neutral-900"
              )}>
                {isLastOne ? "ONE" : "賞"}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-black text-neutral-800 text-center line-clamp-2 w-full mt-1 leading-tight">
              {prizeName}
            </div>
          </motion.div>
        </div>

        {/* The Tearable Cover Layer */}
        <AnimatePresence>
          {!isOpened && (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 300 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                  handleOpen();
                }
              }}
              onClick={handleOpen}
              exit={{ 
                rotateY: -110,
                x: '110%',
                z: 400,
                opacity: 0,
                transition: { 
                  duration: 1, 
                  ease: [0.4, 0, 0.2, 1],
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                originX: 1,
                originY: 0.5,
                perspective: 2000,
                transformStyle: 'preserve-3d',
                zIndex: 50
              }}
              className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 backface-hidden flex items-center justify-center overflow-visible">
                <img 
                  src="/images/up.svg?v=5" 
                  className="w-[105%] h-[105%] max-w-none object-cover" 
                  alt="cover" 
                  draggable={false}
                />

                {/* Finger Swipe Guide */}
                <motion.div 
                  className="absolute left-[25%] top-1/2 -translate-y-1/2 pointer-events-none"
                  animate={{ 
                    x: [0, 140],
                    opacity: [0, 1, 1, 0] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.1, 0.8, 1]
                  }}
                >
                  <img 
                    src="/images/finger.png" 
                    alt="swipe" 
                    className="w-16 h-16 drop-shadow-md"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jagged Edge Mask - Optional/Simplified */}
        {isOpened && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-y-0 left-[10%] w-6 pointer-events-none z-40 overflow-hidden mt-2.5 mb-2.5"
          >
             {/* Removed the complex mask for now as it might clash with bg.svg, 
                 or user might want it to look like torn paper. 
                 Since we have bg.svg, maybe we don't need the dark overlay mask?
                 I'll comment it out or leave it if it adds a nice shadow effect.
                 I'll remove it to be clean, assuming bg.svg handles the look.
             */}
          </motion.div>
        )}
      </div>
    </div>
  );
};
