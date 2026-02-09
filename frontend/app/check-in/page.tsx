'use client';

import { CalendarCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CheckInPage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const days = [
    { day: '1', points: 5, status: 'checked' },
    { day: '2', points: 5, status: 'checked' },
    { day: '3', points: 5, status: 'checked' },
    { day: '4', points: 10, status: 'today' },
    { day: '5', points: 5, status: 'upcoming' },
    { day: '6', points: 5, status: 'upcoming' },
    { day: '7', points: 50, status: 'upcoming', isBig: true },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-6">
        <h1 className="hidden md:block text-2xl font-black text-neutral-900 dark:text-white mb-6 tracking-tight">每日簽到</h1>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-card border border-neutral-100 dark:border-neutral-800 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarCheck className="w-10 h-10 text-primary" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 font-bold mb-8">連續簽到 7 天可獲得大獎！</p>
            
            <div className="grid grid-cols-4 gap-3 mb-8">
            {days.map((item, idx) => (
              <div 
                key={idx}
                className={`
                  relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all
                  ${item.status === 'checked' ? 'bg-primary/5 border-primary/20 text-primary' : ''}
                  ${item.status === 'today' ? 'bg-white dark:bg-neutral-800 border-primary ring-2 ring-primary/10 scale-110 z-10' : ''}
                  ${item.status === 'upcoming' ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500' : ''}
                  ${item.isBig ? 'col-span-2 aspect-auto py-4' : 'aspect-square'}
                `}
              >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Day {item.day}</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-accent-yellow flex items-center justify-center">
                    <span className="text-[8px] text-white font-black">G</span>
                  </div>
                  <span className="text-sm font-black font-amount">+{item.points.toLocaleString()}</span>
                </div>
                {item.status === 'checked' && (
                  <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-primary fill-white" />
                )}
              </div>
            ))}
          </div>

          {!isCheckedIn ? (
            <Button 
              onClick={() => setIsCheckedIn(true)}
              className="w-full h-14 rounded-2xl bg-primary text-white text-lg font-black shadow-lg shadow-primary/20"
            >
              立即簽到
            </Button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full h-14 rounded-2xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center gap-2 font-black border border-accent-emerald/20"
            >
              <CheckCircle2 className="w-6 h-6" />
              今日已簽到
            </motion.div>
          )}
        </div>

        <div className="mt-6 bg-accent-yellow/5 border border-accent-yellow/20 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent-yellow shrink-0 mt-0.5" />
          <div className="text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
            簽到獎勵將直接發放至您的錢包中。若中斷簽到，將重新從第一天開始計算。
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
