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
    <div
      className="relative w-full"
      style={{ aspectRatio: '750/750', transform: 'translateY(-7%)' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/gacha/cab.png"
          alt="全套收集背景"
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="relative z-10 h-full px-6 pt-10 pb-6">
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ top: '-3.5%' }}
        >
          <h2 className="text-base font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            全套收集 ({user ? obtainedPrizeIds.size : 0}/{prizes.length})
          </h2>
          {!user && (
            <div className="mt-1 text-[11px] font-bold text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              登入查看收集進度
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-2 gap-x-[9%] relative h-[calc(100%-3rem)]"
          style={{ transform: 'translateY(-9%)' }}
        >
        {prizes.map((prize, index) => {
          const isObtained = obtainedPrizeIds.has(prize.id);
          const isLocked = !user || (!isObtained && user);

          return (
            <div 
              key={prize.id} 
              className={cn(
                "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group",
                !isObtained && "grayscale"
              )}
              style={
                index < 3
                  ? { transform: 'translateY(6%)' }
                  : index >= 3 && index < 6
                    ? { transform: 'translateY(-8%)' }
                    : undefined
              }
            >
              <div className="relative w-[92%] h-[92%] mx-auto my-auto">
                <Image
                  src={prize.image_url || '/images/item.png'}
                  alt={prize.name}
                  fill
                  className="object-contain drop-shadow-sm"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 left-2 right-2 flex justify-center" style={{ transform: 'translateY(6px)' }}>
                 <span className={cn(
                   "text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm whitespace-nowrap inline-block bg-white/75 text-neutral-800"
                 )}>
                   {prize.name}
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
            <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-white/60 dark:bg-neutral-950/60 flex items-center justify-center">
              <Link href={`/login?redirect=/shop/${productId}`}>
                <Button size="lg" className="shadow-xl">
                  登入查看收集狀況
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
