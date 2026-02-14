import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import Image from 'next/image';
import { Prize } from '@/components/GachaMachine'; // Reuse type

interface GachaResultModalProps {
  isOpen: boolean;
  onClose: () => void; // Usually "Play Again" or just close
  onGoToWarehouse: () => void;
  results: Prize[];
}

export function GachaResultModal({ isOpen, onClose, onGoToWarehouse, results }: GachaResultModalProps) {
  if (!isOpen) return null;

  // For now, assume single draw or multiple. We'll show a list.
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Burst Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-yellow-400/20 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  恭喜獲得！
                </h2>
                <p className="text-neutral-500 font-bold">已放入您的置物櫃</p>
              </div>

              {/* Prizes Grid */}
              <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto py-2">
                {results.map((prize, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-700"
                  >
                    <div className="relative w-16 h-16 bg-white dark:bg-neutral-700 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={prize.image_url || '/images/item.png'}
                        alt={prize.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-accent-red text-white text-[10px] font-black rounded uppercase">
                          {prize.rarity}賞
                        </span>
                      </div>
                      <div className="font-bold text-neutral-900 dark:text-white truncate">
                        {prize.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  onClick={onGoToWarehouse}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  查看置物櫃
                </Button>
                <Button 
                  onClick={onClose}
                  variant="primary" // Assuming primary is the default/main action style
                  size="lg"
                  className="w-full bg-accent-red hover:bg-accent-red/90 text-white shadow-lg shadow-accent-red/20"
                >
                  再抽一次
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
