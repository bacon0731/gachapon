import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Prize } from '@/components/GachaMachine'; // Reuse type

interface GachaResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: Prize[];
}

export function GachaResultModal({ isOpen, onClose, results }: GachaResultModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = results.length > 1;
  const activePrize = results[activeIndex] || results[0];
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const prevOpenRef = useRef(isOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/u_o8xh7gwsrj-correct_answer_toy_bi-bling-476370.mp3');
    audio.preload = 'auto';
    soundRef.current = audio;

    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.src = '';
        soundRef.current.load();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      const audio = soundRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(0);
      return;
    }
    if (!results[activeIndex]) {
      setActiveIndex(0);
    }
  }, [isOpen, results, activeIndex]);

  const showPrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => {
      const nextIndex = prev - 1;
      if (nextIndex < 0) return results.length - 1;
      return nextIndex;
    });
  };

  const showNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= results.length) return 0;
      return nextIndex;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-[480px] sm:max-w-[520px] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[750/810] overflow-hidden">
              <div className="absolute flex items-center justify-center h-[62.8%] w-[83.5%] left-[7.2%] top-[28.3%]">
                <div className="flex-none rotate-[53.95deg]">
                  <div className="relative h-full w-[21.8%]">
                    <div className="absolute inset-[-21.66%_-108.11%_-20.9%_-105.67%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 428.86 962.59">
                        <g filter="url(#filter0_f_1_26)">
                          <path d="M214.43 0L428.86 241L321.642 962.59H107.215L0 241L214.43 0Z" fill="#FFFAB8" />
                        </g>
                        <defs>
                          <filter
                            id="filter0_f_1_26"
                            x="-75"
                            y="-75"
                            width="578.861"
                            height="1112.59"
                            filterUnits="userSpaceOnUse"
                            colorInterpolationFilters="sRGB"
                          >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_1_26" />
                          </filter>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0">
                <Image
                  src="/images/gacha/popup/bg.png"
                  alt="恭喜獲得"
                  fill
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  unoptimized
                />
              </div>

              {activePrize && (
                <>
                  <motion.div
                    key={activePrize.id ?? activeIndex}
                    className="absolute left-[38%] top-[42%] -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square"
                    drag={hasMultiple ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      const offsetX = info.offset.x;
                      if (offsetX > 40) {
                        showPrev();
                      } else if (offsetX < -40) {
                        showNext();
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#d4d4d4]">
                      <Image
                        src={activePrize.image_url || `/images/item/${(activePrize.id ?? '').toString().padStart(5, '0')}.jpg`}
                        alt={activePrize.name}
                        fill
                        className="object-cover object-[25%_50%]"
                        unoptimized
                      />
                    </div>
                  </motion.div>

                  <div className="absolute left-1/2 top-[72.5%] -translate-x-1/2 w-[37.3%] h-[8.4%] flex items-center justify-center">
                    <p
                      className="w-full text-center overflow-hidden text-white text-[14px] font-bold"
                      style={{
                        textShadow: '0 2px 2px rgba(87, 13, 13, 0.25)',
                        fontFamily: '"Chiron GoRound TC"',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        lineHeight: 1,
                      }}
                    >
                      {activePrize.name}
                    </p>
                  </div>

                  {hasMultiple && (
                    <>
                      <button
                        type="button"
                        onClick={showPrev}
                        className="absolute left-[14%] top-[48%] -translate-y-1/2 h-[60px] w-[60px] flex items-center justify-center text-[40px] font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.7)] z-10 rounded-full bg-black/20 active:scale-95 transition-transform"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={showNext}
                        className="absolute right-[14%] top-[48%] -translate-y-1/2 h-[60px] w-[60px] flex items-center justify-center text-[40px] font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.7)] z-10 rounded-full bg-black/20 active:scale-95 transition-transform"
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              )}

              <div className="absolute flex items-center justify-center h-[8.6%] w-[6.5%] left-[19.1%] top-[11.2%]">
                <div className="flex-none -rotate-[4.79deg]">
                  <div className="relative h-full w-full">
                    <Image
                      src="/images/gacha/popup/item.png"
                      alt=""
                      fill
                      className="absolute inset-0 max-w-none object-cover pointer-events-none"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <div className="absolute flex items-center justify-center h-[7.8%] w-[7.0%] left-[71.3%] top-[14.3%]">
                <div className="flex-none rotate-[21.39deg]">
                  <div className="relative h-full w-full">
                    <Image
                      src="/images/gacha/popup/item.png"
                      alt=""
                      fill
                      className="absolute inset-0 max-w-none object-cover pointer-events-none"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <div className="absolute left-[18.1%] top-[22.1%] h-[1.8%] w-[1.9%]">
                <div className="absolute inset-[-71.43%]">
                  <svg className="block size-full" fill="none" viewBox="0 0 34 34" preserveAspectRatio="none">
                    <g filter="url(#filter0_f_1_24)">
                      <circle cx="17" cy="17" r="7" fill="#FFF8D2" />
                    </g>
                    <defs>
                      <filter
                        id="filter0_f_1_24"
                        x="0"
                        y="0"
                        width="34"
                        height="34"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                        <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1_24" />
                      </filter>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-[88.8%] h-[9.9%] w-[41.8%]">
                <div className="absolute left-0 top-0 h-full w-full">
                  <Image
                    src="/images/gacha/popup/btn.png"
                    alt="確認"
                    fill
                    className="absolute inset-0 max-w-none object-cover pointer-events-none"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute inset-0 flex items-center justify-center text-[24px] font-black text-[#894801] leading-none text-center"
                >
                  確認
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
