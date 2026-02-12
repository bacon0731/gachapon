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

export default function WinningMarquee() {
  const [records, setRecords] = useState<WinningRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

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
        // Define type for joined data
        interface JoinedDrawRecord {
          id: number;
          prize_level: string;
          prize_name: string;
          users: { name: string } | null;
          products: { name: string } | null;
        }

        const formatted = (data as unknown as JoinedDrawRecord[]).map((item) => ({
          id: item.id,
          user_name: item.users?.name || '神秘客',
          product_name: item.products?.name || '未知商品',
          prize_level: item.prize_level,
          prize_name: item.prize_name || '未知獎項'
        }));
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
    }, 4000);
    return () => clearInterval(interval);
  }, [records.length]);

  if (records.length === 0) {
    // Fallback if no records found
    return null;
  }

  const currentRecord = records[currentIndex];

  return (
    <div className="mb-6 h-[40px] bg-primary/5 border border-primary/10 rounded-2xl px-1.5 flex items-center gap-3 overflow-hidden shadow-soft dark:bg-blue-900/10 dark:border-blue-900/20">
      <div className="flex-shrink-0 bg-primary text-white p-1.5 rounded-xl shadow-sm">
        <Trophy className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRecord.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-full truncate text-[13px] text-neutral-600 dark:text-neutral-300 font-medium"
          >
            恭喜 <span className="text-primary font-black mx-0.5">{currentRecord.user_name}</span> 
            抽中一番賞 <span className="text-primary font-black mx-0.5">{currentRecord.product_name}</span> 
            的 <span className="text-accent-red font-black mx-0.5">{currentRecord.prize_level}賞</span> 
            <span className="text-accent-red font-black mx-0.5">{currentRecord.prize_name}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
