import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';

export interface ResultPrize {
  id: string;
  name: string;
  grade: string;
  image_url?: string;
  is_last_one?: boolean;
  ticket_number?: number;
}

interface PrizeResultModalProps {
  isOpen?: boolean;
  prizes?: ResultPrize[];
  results?: {
    grade: string;
    name: string;
    isOpened: boolean;
    image_url: string;
    is_last_one: boolean;
    ticket_number: number;
  }[];
  onClose: () => void;
  onGoToWarehouse?: () => void;
  onPlayAgain?: () => void;
  isLoading?: boolean;
  skipRevealAnimation?: boolean;
}

const HIGH_TIER_GRADES = ['A', 'B', 'C', 'Last One', 'LAST ONE', 'SP'];

export const PrizeResultModal: React.FC<PrizeResultModalProps> = ({
  isOpen = true,
  prizes,
  results,
  onGoToWarehouse,
  onPlayAgain,
  onClose,
  isLoading = false,
  skipRevealAnimation = false,
}) => {
  const [showContent, setShowContent] = useState(skipRevealAnimation);

  // Normalize prizes from either `prizes` or `results` prop
  const displayPrizes: ResultPrize[] = React.useMemo(() => {
    const list = prizes || (results ? results.map((r, i) => ({
      id: String(i),
      name: r.name,
      grade: r.grade,
      image_url: r.image_url,
      is_last_one: r.is_last_one,
      ticket_number: r.ticket_number
    })) : []);
    
    // Sort: Normal prizes first, Last One last
    return [...list].sort((a, b) => {
      // If skipRevealAnimation is true (Check Results mode), sort by ticket number
      if (skipRevealAnimation) {
         if (a.is_last_one) return 1;
         if (b.is_last_one) return -1;
         return (a.ticket_number || 0) - (b.ticket_number || 0);
      }
      
      // Default behavior for draw results (Last One last)
      if (a.is_last_one && !b.is_last_one) return 1;
      if (!a.is_last_one && b.is_last_one) return -1;
      return 0;
    });
  }, [prizes, results, skipRevealAnimation]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (!skipRevealAnimation) {
        // Reset state and start loading timer
        setShowContent(false);
        const timer = setTimeout(() => {
          setShowContent(true);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowContent(true);
      }
    } else {
      document.body.style.overflow = '';
      setShowContent(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, skipRevealAnimation]);

  const isHighTier = (grade: string) => HIGH_TIER_GRADES.includes(grade);
  const hasLastOne = displayPrizes.some(p => p.is_last_one);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn(
              "relative w-full max-w-[640px] max-h-[80vh] h-full rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col mx-4",
              "md:mx-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white z-10 shrink-0">
              <h3 className="text-lg font-black text-neutral-900">抽獎結果一覽</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            {/* Loading View */}
            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                 <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                 <p className="mt-4 text-sm font-bold text-neutral-500">正在載入抽獎結果...</p>
               </div>
            ) : !showContent ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6">
                 <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-neutral-100 rounded-full" />
                  <div className="absolute inset-0 border-t-4 border-accent-yellow rounded-full animate-spin" />
                  <div className="text-4xl animate-bounce">🎁</div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-widest">
                    獎項結算中...
                  </h2>
                  <p className="text-neutral-500 font-bold">恭喜中獎！</p>
                </div>
              </div>
            ) : (
              /* Result View */
              <>
                {/* Header / Title - Removed as it is now in the modal header */}
                
                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-neutral-50">
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 content-start pb-24">
                    {displayPrizes.map((prize, idx) => {
                      const isSpecial = isHighTier(prize.grade);
                      const isLastOne = prize.is_last_one;
                      
                      return (
                        <motion.div
                          key={`${prize.id}-${idx}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: idx * 0.03, // Faster staggered animation
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          className={cn(
                            "aspect-[3/4] rounded-xl border flex flex-col items-center justify-center gap-1 bg-white shadow-sm transition-all duration-200",
                            isSpecial ? "border-red-200 bg-red-50/30" : "border-neutral-200",
                            isLastOne && "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400 ring-offset-2"
                          )}
                        >
                          <span className="text-[10px] sm:text-xs font-bold text-neutral-400 font-amount">
                            {isLastOne ? "LAST" : String(prize.ticket_number).padStart(2, '0')}
                          </span>
                          <span className={cn(
                            "text-lg sm:text-xl font-black font-amount leading-none",
                            isSpecial ? "text-accent-red" : "text-neutral-700",
                            isLastOne && "text-yellow-600"
                          )}>
                            {prize.grade.replace('賞', '')}<span className="text-xs ml-0.5">賞</span>
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions - Unified */}
                <div className="bg-white border-t border-neutral-100 shrink-0 pb-safe z-40 absolute bottom-0 left-0 right-0">
                  <div className="h-16 px-4 flex items-center gap-3">
                    <Button
                      onClick={onGoToWarehouse}
                      className="flex-1 h-[44px] rounded-xl font-black bg-neutral-200 hover:bg-neutral-300 text-neutral-700 shadow-sm text-base"
                    >
                      前往倉庫
                    </Button>
                    <Button
                      onClick={onPlayAgain}
                      className={cn(
                        "flex-1 h-[44px] rounded-xl font-black text-base shadow-xl",
                        hasLastOne 
                          ? "bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/20" 
                          : "bg-accent-red hover:bg-accent-red/90 text-white shadow-accent-red/20"
                      )}
                    >
                      {hasLastOne ? "查看結果" : "繼續抽獎"}
                    </Button>
                  </div>
                </div>

              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
