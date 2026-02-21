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
            if (!item.prize_level || !item.prize_name) return false;
            const raw = item.prize_level;
            const normalized = raw.replace('賞', '').trim().toUpperCase();
            if (!normalized) return false;
            if (normalized === 'LAST ONE' || normalized === '最後' || normalized === 'LO') return true;
            return ['SS', 'SP', 'S', 'A'].includes(normalized);
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
    <div className="h-[32px] bg-primary/5 px-3 flex items-center gap-2 overflow-hidden -mx-2 sm:mx-0">
      <div className="flex-shrink-0 bg-primary text-white px-1.5 py-1 rounded-full">
        <Trophy className="w-3 h-3 stroke-[3]" />
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={hasRecords && currentRecord ? currentRecord.id : 'winning-marquee-placeholder'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-full truncate text-[12px] text-neutral-700 dark:text-neutral-300 font-medium"
          >
            {hasRecords && currentRecord ? (
              <>
                太神啦！<span className="text-primary font-black mx-0.5">{currentRecord.user_name}</span>
                抽到<span className="text-primary font-black mx-0.5">
                  {currentRecord.prize_level}賞 {currentRecord.prize_name}
                </span>
              </>
            ) : (
              <span className="font-black text-primary">
                日本超夯一番賞同步上線
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
