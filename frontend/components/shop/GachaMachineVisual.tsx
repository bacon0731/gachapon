import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GachaMachineVisualProps {
  state: 'idle' | 'shaking' | 'spinning' | 'result';
  onAnimationComplete?: () => void;
}

const CAPSULE_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-yellow-400',
  'bg-pink-500',
  'bg-purple-500',
  'bg-green-500',
];

export function GachaMachineVisual({ state, onAnimationComplete }: GachaMachineVisualProps) {
  const [balls, setBalls] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  
  // Initialize balls
  useEffect(() => {
    const newBalls = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // Random position within container
      y: Math.random() * 100 - 20,
      color: CAPSULE_COLORS[i % CAPSULE_COLORS.length],
    }));
    setBalls(newBalls);
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto aspect-[4/5] flex items-center justify-center">
      {/* Machine Body Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/main.png"
          alt="Gacha Machine"
          fill
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {/* Glass Window Area - Balls Container */}
      {/* 
         Adjusting position to match the window in main.png.
         Assuming the window is roughly in the upper-middle area.
         These percentages need to be tuned based on the actual image.
         Let's start with a guess based on typical gacha machine proportions.
      */}
      <div className="absolute top-[18%] left-[18%] w-[64%] h-[42%] overflow-hidden rounded-2xl z-10">
        {/* Inner Shadow/Overlay for depth */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none z-20 rounded-2xl" />
        
        {/* Balls Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {balls.map((ball) => (
            <GachaBall 
              key={ball.id} 
              {...ball} 
              machineState={state} 
            />
          ))}
        </div>
      </div>
      
      {/* Optional: Add a subtle glow or effect when spinning */}
      {state === 'spinning' && (
        <div className="absolute top-[18%] left-[18%] w-[64%] h-[42%] bg-yellow-400/20 blur-xl z-0 animate-pulse" />
      )}
    </div>
  );
}

function GachaBall({ id, x, y, color, machineState }: { id: number; x: number; y: number; color: string; machineState: string }) {
  const controls = useAnimation();

  useEffect(() => {
    if (machineState === 'shaking') {
      controls.start({
        x: [x, Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 200 - 100],
        y: [y, Math.random() * 150 - 50, Math.random() * 150 - 50, Math.random() * 150 - 50],
        rotate: [0, 180, -180, 90],
        transition: { duration: 0.5, repeat: 3, repeatType: "reverse" }
      });
    } else if (machineState === 'spinning') {
       controls.start({
        x: [0, Math.cos(id) * 100, Math.cos(id + 1) * 100],
        y: [0, Math.sin(id) * 100, Math.sin(id + 1) * 100],
        rotate: [0, 720],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      });
    } else {
      controls.start({
        x: x,
        y: y + 100, // Settle at bottom
        rotate: 0,
        transition: { type: "spring", stiffness: 50 }
      });
    }
  }, [machineState, controls, x, y, id]);

  return (
    <motion.div
      animate={controls}
      className={cn(
        "absolute w-10 h-10 rounded-full shadow-md border border-white/20",
        color
      )}
      style={{ 
        left: '50%',
        top: '0%', // Start from top area but controlled by x/y
        marginLeft: -20,
        marginTop: -20
      }}
    >
      <div className="absolute top-2 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px] -rotate-45" />
      <div className="absolute bottom-0 w-full h-1/2 bg-black/10 rounded-b-full" />
    </motion.div>
  );
}
