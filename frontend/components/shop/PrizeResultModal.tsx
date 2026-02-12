import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface ResultPrize {
  id: string;
  name: string;
  grade: string;
  image_url?: string;
  is_last_one?: boolean;
  ticket_number?: number;
}

interface PrizeResultModalProps {
  isOpen: boolean;
  prizes: ResultPrize[];
  onClose: () => void;
  onGoToWarehouse?: () => void;
  onPlayAgain?: () => void;
  isLoading?: boolean;
}

const HIGH_TIER_GRADES = ['A', 'B', 'C', 'Last One', 'LAST ONE', 'SP'];

export const PrizeResultModal: React.FC<PrizeResultModalProps> = ({
  isOpen,
  prizes,
  onClose,
  onGoToWarehouse,
  onPlayAgain,
  isLoading
}) => {
  const [showContent, setShowContent] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state and start loading timer
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setShowContent(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isHighTier = (grade: string) => HIGH_TIER_GRADES.includes(grade);

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
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn(
              "fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
              "md:relative md:bottom-auto md:left-auto md:right-auto md:top-auto",
              "md:w-full md:max-w-[800px] md:rounded-2xl md:h-auto"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading View */}
            {!showContent ? (
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
                {/* Header / Title */}
                <div className="relative py-5 text-center shrink-0 border-b border-neutral-100">
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative z-10"
                  >
                    <h2 className="text-2xl font-black text-neutral-900 tracking-wider">
                      🎉 恭喜獲得 🎉
                    </h2>
                  </motion.div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-neutral-50">
                  <div className="flex flex-wrap justify-center gap-4 md:gap-6 mx-auto">
                    {prizes.map((prize, idx) => {
                      const isSpecial = isHighTier(prize.grade);
                      
                      return (
                        <motion.div
                          key={`${prize.id}-${idx}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: idx * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          className="w-32 md:w-36 flex flex-col items-center group"
                        >
                          {/* Card Container (Image + Badges) */}
                          <div className={cn(
                            "w-full aspect-square rounded-xl relative flex items-center justify-center mb-2 transition-all duration-300 bg-white border border-neutral-200 shadow-sm overflow-hidden",
                            isSpecial && "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                          )}>
                            {/* Special Effect Overlay */}
                            {isSpecial && (
                              <div className="absolute inset-0 bg-yellow-50 animate-pulse z-0 pointer-events-none opacity-50" />
                            )}
                            
                            {/* Image Area */}
                            <div className="w-full h-full p-2 flex items-center justify-center relative z-10">
                              {prize.image_url ? (
                                <img 
                                  src={prize.image_url} 
                                  alt={prize.name} 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300 font-bold text-2xl">?</div>
                              )}
                            </div>
                            
                            {/* Grade Badge (Top Left) - Black */}
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-black bg-neutral-900 text-white shadow-sm z-20 leading-none">
                              {prize.grade.replace('賞', '')}賞
                            </div>
                            
                            {/* Ticket Number / No.1 Badge (Top Right) - White */}
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold bg-white text-neutral-900 border border-neutral-200 shadow-sm z-20 leading-none">
                              {prize.is_last_one ? 'LAST' : `No.${prize.ticket_number ?? '?'}`}
                            </div>
                          </div>

                          {/* Name Label (Below Card) */}
                          <div className="text-center w-full px-1">
                            <p className={cn(
                              "text-sm font-bold leading-tight line-clamp-2",
                              isSpecial ? "text-yellow-600" : "text-neutral-700"
                            )}>
                              {prize.name}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions - Desktop Only */}
                <div className="hidden md:flex p-4 md:p-6 bg-white border-t border-neutral-100 shrink-0 justify-center gap-4">
                  <Button
                    onClick={onGoToWarehouse}
                    variant="outline"
                    className="flex-1 max-w-[200px] h-12 rounded-xl font-bold border-2"
                  >
                    前往倉庫
                  </Button>
                  <Button
                    onClick={onPlayAgain}
                    className="flex-1 max-w-[200px] h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    繼續抽獎
                  </Button>
                </div>

              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
