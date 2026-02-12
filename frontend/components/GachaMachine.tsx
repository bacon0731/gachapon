import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PrizeResultModal } from '@/components/shop/PrizeResultModal';
import Image from 'next/image';

// Types
export interface Prize {
  id: string;
  name: string;
  rarity: 'A' | 'B' | 'C' | string;
  image_url?: string;
  grade?: string;
}

interface GachaMachineProps {
  prizes: Prize[];
  isOpen: boolean;
  onGoToWarehouse: () => void;
  onContinue: () => void;
}

type MachineState = 'IDLE' | 'SPINNING' | 'DROPPING' | 'RESULT';

// Color palette for capsules
const CAPSULE_COLORS = [
  { bg: 'from-red-400 to-red-600', shadow: 'shadow-red-500/50', border: 'border-red-400/30' },
  { bg: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/50', border: 'border-blue-400/30' },
  { bg: 'from-yellow-300 to-yellow-500', shadow: 'shadow-yellow-500/50', border: 'border-yellow-400/30' },
  { bg: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/50', border: 'border-purple-400/30' },
];

// 3D Capsule Component
const GachaCapsule = React.memo(({ 
  index, 
  state, 
}: { 
  index: number; 
  state: MachineState;
}) => {
  const color = useMemo(() => CAPSULE_COLORS[index % CAPSULE_COLORS.length], [index]);
  const randomDelay = useMemo(() => Math.random() * 2, []);
  
  // Idle Animation: Floating
  const idleVariants: Variants = {
    idle: {
      y: [0, -15, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2 + Math.random(),
        repeat: Infinity,
        ease: "easeInOut",
        delay: randomDelay,
      }
    },
    spinning: {
      x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
      y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
      rotate: [0, 180, 360, 720],
      scale: [1, 1.1, 0.9, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "linear"
      }
    },
    dropping: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute w-[60px] h-[60px] rounded-full",
        "bg-gradient-to-br shadow-lg",
        color.bg, color.shadow
      )}
      style={{
        left: `calc(50% - 30px + ${(index % 3 - 1) * 60}px)`,
        top: `calc(50% - 30px + ${Math.floor(index / 3) * 50}px)`,
        boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.3), inset 5px 5px 15px rgba(255,255,255,0.4)'
      }}
      variants={idleVariants}
      animate={state === 'IDLE' ? 'idle' : state === 'SPINNING' ? 'spinning' : state === 'DROPPING' ? 'dropping' : 'idle'}
    >
      <div className="absolute top-2 left-3 w-4 h-3 bg-white/40 rounded-full blur-[1px] -rotate-45" />
      <div className="absolute bottom-3 right-3 w-12 h-12 bg-black/10 rounded-full blur-md" />
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/10 -translate-y-1/2" />
    </motion.div>
  );
});

GachaCapsule.displayName = 'GachaCapsule';

export default function GachaMachine({ prizes, isOpen, onGoToWarehouse, onContinue }: GachaMachineProps) {
  const [state, setState] = useState<MachineState>('IDLE');
  const [droppedCapsule, setDroppedCapsule] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  
  const knobControls = useAnimation();
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timeouts
  const clearTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);
  
  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setState('IDLE');
      setDroppedCapsule(false);
      setShowResultModal(false);
      clearTimeouts();
    }
  }, [isOpen]);

  const handleSpin = async () => {
    if (state !== 'IDLE') return;

    // 1. Start Spinning
    setState('SPINNING');
    
    // Knob Animation
    knobControls.start({
      rotate: 360,
      transition: { duration: 1.5, type: "spring", stiffness: 50, damping: 15 }
    });

    // 2. Stop Spinning and Drop (after 1.5s)
    const t1 = setTimeout(() => {
      setState('DROPPING');
      
      // 3. Show Result (after drop animation 0.6s + delay 0.5s)
      const t2 = setTimeout(() => {
        setDroppedCapsule(true);
        const t3 = setTimeout(() => {
          setState('RESULT');
          setShowResultModal(true);
        }, 800);
        timeoutsRef.current.push(t3);
      }, 600);
      timeoutsRef.current.push(t2);
    }, 1500);
    
    timeoutsRef.current.push(t1);
  };

  const skipAnimation = () => {
    if (state === 'SPINNING' || state === 'DROPPING') {
      clearTimeouts();
      knobControls.stop();
      setState('RESULT');
      setDroppedCapsule(true);
      setShowResultModal(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-[-1]">
        <Image 
          src="/images/gacha_bg.png" 
          alt="" 
          fill
          className="object-cover filter brightness-[0.85] blur-[3px] scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Click anywhere to skip animation if running */}
      {(state === 'SPINNING' || state === 'DROPPING') && (
        <div className="absolute inset-0 z-50 cursor-pointer" onClick={skipAnimation} />
      )}

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative flex flex-col items-center pointer-events-auto"
      >
        {/* Machine Container */}
        <div className="relative w-[300px] h-[400px] bg-gradient-to-b from-blue-50/20 to-blue-100/10 backdrop-blur-md rounded-t-[100px] rounded-b-[40px] border border-white/20 shadow-2xl overflow-hidden z-10">
          
          {/* Glass Reflection */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          
          {/* Capsules Container */}
          <div className="absolute inset-0 top-10 p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <GachaCapsule 
                key={i} 
                index={i} 
                state={state} 
              />
            ))}
          </div>

          {/* Machine Base (Inside) */}
          <div className="absolute bottom-0 w-full h-[120px] bg-[#4ECDC4] shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)]">
            {/* Exit Hole */}
            <div className="absolute bottom-4 right-8 w-[80px] h-[80px] bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
               <div className="w-full h-1/2 bg-black/50 absolute bottom-0" />
            </div>
            
            {/* Knob Area */}
            <div className="absolute bottom-4 left-8 w-[80px] h-[80px] rounded-full bg-neutral-200/20 flex items-center justify-center">
              {/* Knob */}
              <motion.div
                animate={knobControls}
                onClick={(e) => { e.stopPropagation(); handleSpin(); }}
                className={cn(
                  "w-[80px] h-[80px] rounded-full bg-neutral-900 relative shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center",
                  state === 'IDLE' ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform" : "cursor-default"
                )}
                style={{
                  background: 'conic-gradient(from 0deg, #333, #111, #333)'
                }}
              >
                <div className="w-full h-[10px] bg-neutral-600 rounded-full shadow-lg" />
                <div className="absolute w-[10px] h-full bg-neutral-600 rounded-full shadow-lg" />
                <div className="absolute w-4 h-4 rounded-full bg-neutral-400 shadow-inner" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dropping Capsule Animation (Outside/Overlay) */}
        <AnimatePresence>
          {state === 'DROPPING' && !droppedCapsule && (
            <motion.div
              initial={{ y: 250, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: [250, 450], 
                opacity: 1, 
                scale: 1,
                rotate: 360 
              }}
              transition={{ 
                duration: 0.6, 
                times: [0, 1],
                ease: "easeIn" 
              }}
              className="absolute z-20 left-[calc(50%+40px)] top-0"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl border border-yellow-300/30 relative">
                 <div className="absolute top-2 left-3 w-4 h-3 bg-white/40 rounded-full blur-[1px] -rotate-45" />
                 <div className="absolute bottom-3 right-3 w-12 h-12 bg-black/10 rounded-full blur-md" />
                 <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/10 -translate-y-1/2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Result Modal */}
      <PrizeResultModal 
        isOpen={showResultModal}
        prizes={prizes.map(p => ({
          ...p,
          grade: p.grade || p.rarity
        }))}
        onClose={onGoToWarehouse}
        onGoToWarehouse={onGoToWarehouse}
        onPlayAgain={onContinue}
      />
    </div>
  );
}
