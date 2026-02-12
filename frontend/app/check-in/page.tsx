'use client';

import { CalendarCheck, Sparkles, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CheckInPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState({
    consecutive_days: 0,
    checked_in_today: false,
    next_reward: 10
  });

  const fetchStatus = React.useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_check_in_status', { p_user_id: user.id });
      if (error) {
          if (error.code === '42883') {
              // Function not found - might need migration
              console.warn('Check-in function not found');
          } else {
              throw error;
          }
      }
      if (data) setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user && !loading) {
        // Redirect if not logged in? Or just show empty.
        // AuthContext usually handles protection but let's be safe.
        return;
    }
    if (user) {
        fetchStatus();
    } else {
        setLoading(false); // Stop loading if no user yet (will likely redirect or show login)
    }
  }, [user, loading, fetchStatus]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { data, error } = await supabase.rpc('daily_check_in', { p_user_id: user!.id });
      if (error) throw error;
      
      if (data.success) {
        toast.success(`簽到成功！獲得 ${data.reward} 代幣`);
        await refreshProfile();
        fetchStatus();
      } else {
        toast.info(data.message || '今日已簽到');
      }
    } catch (error: unknown) {
      console.error('Check-in Error:', error);
      const message = error instanceof Error ? error.message : '簽到失敗';
      toast.error(message);
    } finally {
      setCheckingIn(false);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    let itemStatus = 'upcoming';
    
    // Calculate display status
    const streak = status.consecutive_days;
    // If streak is multiple of 7 and we checked in today, we show full board (days 1-7 checked)
    // If streak is multiple of 7 and NOT checked in today, we show empty board (day 1 today)
    
    const cycleStreak = streak % 7;
    
    if (status.checked_in_today) {
       // e.g. streak 1 -> day 1 checked.
       // e.g. streak 7 -> day 7 checked (cycleStreak 0 -> treat as 7)
       const displayStreak = cycleStreak === 0 ? 7 : cycleStreak;
       if (dayNum <= displayStreak) itemStatus = 'checked';
    } else {
       // e.g. streak 0 -> day 1 today.
       // e.g. streak 1 -> day 1 checked, day 2 today.
       // e.g. streak 7 -> day 1 today (new cycle).
       if (dayNum <= cycleStreak) {
           itemStatus = 'checked';
       } else if (dayNum === cycleStreak + 1) {
           itemStatus = 'today';
       }
    }

    return {
      day: dayNum.toString(),
      points: 10 + (i * 5),
      status: itemStatus,
      isBig: i === 6
    };
  });

  if (loading) return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={() => router.back()} className="md:hidden p-2 -ml-2 text-neutral-500">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">每日簽到</h1>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 shadow-card border border-neutral-100 dark:border-neutral-800 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarCheck className="w-10 h-10 text-primary" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 font-bold mb-8">
                連續簽到 7 天可獲得大獎！
                <br/>
                <span className="text-xs font-normal text-neutral-400">目前連簽: {status.consecutive_days} 天</span>
            </p>
            
            <div className="grid grid-cols-4 gap-3 mb-8">
            {days.map((item, idx) => (
              <div 
                key={idx}
                className={`
                  relative p-2 md:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all
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
                  <span className="text-xs md:text-sm font-black font-amount">+{item.points.toLocaleString()}</span>
                </div>
                {item.status === 'checked' && (
                  <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-primary fill-white" />
                )}
              </div>
            ))}
          </div>

          {!status.checked_in_today ? (
            <Button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="w-full h-14 rounded-2xl bg-primary text-white text-lg font-black shadow-lg shadow-primary/20"
            >
              {checkingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : '立即簽到'}
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
