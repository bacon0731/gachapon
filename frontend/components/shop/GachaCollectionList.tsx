import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Database } from '@/types/database.types';
import Link from 'next/link';

interface GachaCollectionListProps {
  productId: number;
  prizes: Database['public']['Tables']['product_prizes']['Row'][];
}

export function GachaCollectionList({ productId, prizes }: GachaCollectionListProps) {
  const { user } = useAuth();
  const [obtainedPrizeIds, setObtainedPrizeIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchUserCollection() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('draw_records')
          .select('product_prize_id')
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        const ids = new Set(data?.map(r => r.product_prize_id).filter((id): id is number => id !== null) || []);
        setObtainedPrizeIds(ids);
      } catch (error) {
        console.error('Error fetching collection:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserCollection();
  }, [user, productId, supabase]);

  // Filter out Last One prize for the collection list as it's a special prize
  // But usually in Gacha, every item is collectable. 
  // If Last One is treated as a separate collectable, keep it.
  // The user requirement says "Display all prizes... Obtained: Color, Not Obtained: Grayscale".
  // I will include all prizes.

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-card border border-neutral-100 dark:border-neutral-800 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          全套收集 ({user ? obtainedPrizeIds.size : 0}/{prizes.length})
        </h2>
        {!user && (
           <span className="text-sm font-bold text-neutral-400">登入查看收集進度</span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 relative">
        {prizes.map((prize) => {
          const isObtained = obtainedPrizeIds.has(prize.id);
          const isLocked = !user || (!isObtained && user);

          return (
            <div 
              key={prize.id} 
              className={cn(
                "aspect-square rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group",
                !isObtained && "opacity-60 grayscale"
              )}
            >
              <div className="relative w-full h-full">
                <Image
                  src={prize.image_url || '/images/item.png'}
                  alt={prize.name}
                  fill
                  className="object-contain drop-shadow-sm"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center">
                 <span className={cn(
                   "text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm",
                   isObtained 
                     ? "bg-white/90 text-neutral-900" 
                     : "bg-neutral-200/50 text-neutral-500"
                 )}>
                   {prize.level}賞
                 </span>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center p-2 text-center z-10 pointer-events-none">
                 <span className="text-white text-xs font-bold line-clamp-2">{prize.name}</span>
              </div>
            </div>
          );
        })}
        
        {/* Not Logged In Overlay */}
        {!user && (
          <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-white/60 dark:bg-neutral-950/60 flex items-center justify-center rounded-2xl">
            <Link href={`/login?redirect=/shop/${productId}`}>
              <Button size="lg" className="shadow-xl">
                登入查看收集狀況
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
