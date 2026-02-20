'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface WinningRecord {
  id: number;
  user_name: string;
  product_name: string;
  prize_level: string;
  prize_name: string;
}

interface JoinedDrawRecord {
  id: number;
  prize_level: string;
  prize_name: string;
  users: { name: string } | null;
  products: { name: string } | null;
}

export default function WinningMarquee() {
  const [records, setRecords] = useState<WinningRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchRecords = async () => {
      // Note: This assumes foreign key relationships exist between these tables.
      // If not, we might need to adjust or fetch manually.
      const { data, error } = await supabase
        .from('draw_records')
        .select(`
          id,
          prize_level,
          prize_name,
          users ( name ),
          products ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const formatted = (data as unknown as JoinedDrawRecord[])
          .map((item) => ({
            id: item.id,
            user_name: item.users?.name || '神秘客',
            product_name: item.products?.name || '未知商品',
            prize_level: item.prize_level,
            prize_name: item.prize_name || '未知獎項'
          }))
          .filter((item) => {
            const level = (item.prize_level || '').toUpperCase();
            if (!level || level.includes('LAST')) return false;
            return level.startsWith('A') || level.startsWith('B') || level.startsWith('C');
          });
        setRecords(formatted);
      } else if (error) {
        console.error('Error fetching winning records:', error);
      }
    };

    fetchRecords();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:draw_records')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'draw_records' }, () => {
        fetchRecords();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (records.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % records.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [records.length]);

  const hasRecords = records.length > 0;
  const currentRecord = hasRecords ? records[currentIndex] : null;

  return (
    <div className="h-[32px] bg-primary px-2 flex items-center overflow-hidden -mx-2 sm:mx-0 rounded-none sm:rounded-2xl border-0 sm:border sm:border-primary/20 shadow-soft">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shadow-sm border border-white/25">
          <Trophy className="w-3 h-3 stroke-[2.5] text-white" />
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={hasRecords && currentRecord ? currentRecord.id : 'winning-marquee-placeholder'}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute w-full truncate text-[12px] text-white/90 font-medium tracking-[0.04em]"
            >
              {hasRecords && currentRecord ? (
                <>
                  恭喜 <span className="font-black mx-0.5 text-white">{currentRecord.user_name}</span>
                  抽中 <span className="font-black mx-0.5 text-accent-yellow">{currentRecord.prize_level}賞</span>
                  <span className="font-black mx-0.5 text-accent-yellow">{currentRecord.prize_name}</span>
                </>
              ) : (
                <span className="font-black text-white">
                  日本超夯一番賞同步上線
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
