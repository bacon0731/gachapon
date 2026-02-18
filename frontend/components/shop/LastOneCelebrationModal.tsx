'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';

interface LastOneCelebrationModalProps {
  onClose: () => void;
}

export function LastOneCelebrationModal({ onClose }: LastOneCelebrationModalProps) {
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (timeLeft === 0) {
      onClose();
    }
  }, [timeLeft, onClose]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 50 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 border border-yellow-500/50 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          {/* Icon/Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-24 h-24 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center relative"
          >
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/50 animate-[spin_4s_linear_infinite]" />
            <PartyPopper className="w-12 h-12 text-yellow-500" />
          </motion.div>

          {/* Text */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-2"
          >
            恭喜獲得最後賞！
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-yellow-500/80 font-bold text-sm mb-6"
          >
            Last One Prize Get!
          </motion.p>

          {/* Timer */}
          <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-full bg-yellow-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Confetti/Fireworks (CSS only for simplicity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* We can add particle effects here if needed, but the main modal is flashy enough */}
      </div>
    </div>
  );
}
