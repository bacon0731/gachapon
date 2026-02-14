'use client';

import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';

interface MarketProductCardProps {
  id: string | number;
  productId?: number;
  name: string;
  image: string;
  price: number;
  grade?: string;
  series?: string;
  isUserOwned?: boolean;
  onClick?: () => void;
}

export default function MarketProductCard({
  productId,
  name,
  image,
  price,
  grade,
  series,
  isUserOwned,
  onClick,
}: MarketProductCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!user || !productId) return;

    const checkFollowStatus = async () => {
      const { count } = await supabase
        .from('product_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      setIsFollowed(!!count);
    };

    checkFollowStatus();
  }, [user, productId, supabase]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('請先登入');
      return;
    }

    if (!productId) {
      return;
    }

    const newStatus = !isFollowed;
    setIsFollowed(newStatus);

    try {
      if (newStatus) {
        const { error } = await supabase
          .from('product_follows')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        toast.success('已加入關注清單');
      } else {
        const { error } = await supabase
          .from('product_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
        toast.success('已取消關注');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowed(!newStatus);
      toast.error('操作失敗，請稍後再試');
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group block h-full cursor-pointer"
    >
      <div className="relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-t-2xl">
          <div className="w-full h-full flex items-center justify-center text-white/20 group-hover:scale-105 transition-transform duration-500 relative">
            <Image 
              src={image || '/images/item.png'} 
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between pointer-events-none">
            <div className="flex flex-col gap-1.5">
               {grade && (
                 <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[10px] font-black border border-white/10 shadow-sm">
                   {grade}賞
                 </div>
               )}
            </div>
            {isUserOwned && (
              <div className="px-2 py-1 rounded-lg bg-primary/90 backdrop-blur-md text-white text-[10px] font-black border border-white/10 shadow-sm">
                個人
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2">
          {series && (
             <p className="text-[10px] font-bold text-neutral-400 mb-0.5 line-clamp-1">
               {series}
             </p>
          )}
          
          <h3 className="text-base font-black text-neutral-900 dark:text-white line-clamp-2 mb-1 min-h-[3rem] leading-tight group-hover:text-primary transition-colors tracking-tight">
            {name}
          </h3>
          
          <div className="mt-auto pt-2 border-t border-neutral-50 dark:border-neutral-800">
            <div className="flex items-end justify-between gap-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent-yellow shadow-sm">
                    <span className="text-[10px] text-white font-black leading-none">G</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[28px] leading-none font-black font-amount text-accent-red tracking-tight">{price.toLocaleString()}</span>
                    <span className="text-[11px] font-black text-neutral-400">/個</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleFollow}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-90",
                  isFollowed 
                    ? "bg-accent-red text-white shadow-accent-red/20" 
                    : "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-neutral-400 hover:text-accent-red hover:bg-white dark:hover:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isFollowed && "fill-current")} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
