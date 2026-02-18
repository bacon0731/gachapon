
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ProductBadge, { ProductType } from './ui/ProductBadge';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface ProductCardProps {
  id: string | number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  remaining?: number;
  total?: number;
  isHot?: boolean;
  isNew?: boolean;
  hasTicket?: boolean;
  category?: string;
  type?: ProductType;
  status?: 'active' | 'pending' | 'ended' | string;
}

export default function ProductCard({
  id,
  name,
  image,
  price,
  remaining,
  total,
  isHot = false,
  isNew = false,
  type,
  status,
}: ProductCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!user) return;
    
    const checkFollowStatus = async () => {
      const { count } = await supabase
        .from('product_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      setIsFollowed(!!count);
    };

    checkFollowStatus();
  }, [user, id, supabase]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Optional: Redirect to login or show toast
      return;
    }

    // Optimistic update
    const newStatus = !isFollowed;
    setIsFollowed(newStatus);

    try {
      if (newStatus) {
        const { error } = await supabase
          .from('product_follows')
          .insert({ user_id: user.id, product_id: id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert on error
      setIsFollowed(!newStatus);
    }
  };

  return (
    <Link href={`/shop/${id}`} className="group block h-full">
      <div className="relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-t-2xl">
          <div className="w-full h-full flex items-center justify-center text-white/20 group-hover:scale-105 transition-transform duration-500 relative">
            <Image 
              src={image || '/images/item.png'} 
              alt={name}
              fill
              className="object-fill"
              unoptimized
            />
          </div>
          
          {/* Status Badges */}
          <div className="absolute top-0 left-0 z-10 flex flex-col pointer-events-none">
            {isHot && <ProductBadge type="hot" className="rounded-2xl rounded-tr-none rounded-bl-none" />}
            {isNew && !isHot && <ProductBadge type="new" className="rounded-2xl rounded-tr-none rounded-bl-none" />}
          </div>
          
          <div className="absolute top-0 right-0 z-10 flex flex-col items-end pointer-events-none">
            {typeof remaining === 'number' && typeof total === 'number' && total > 0 && (
              <div className="h-6 px-2 inline-flex items-center rounded-2xl rounded-tl-none rounded-br-none bg-black/80 text-white text-[11px] font-black border border-white/10 shadow-sm leading-none">
                {remaining}/{total}
              </div>
            )}
          </div>

          {/* Sold Out Stamp */}
          {((typeof remaining === 'number' && remaining <= 0) || status === 'ended') && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <Image 
                src="/images/sale.svg" 
                alt="完抽" 
                width={96}
                height={96}
                className="w-24 h-auto transform scale-110 drop-shadow-xl"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2 md:pt-2 md:-mt-0.5">
          <div className="mb-1 min-h-[3rem]">
            <h3 className="text-base font-black text-neutral-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors tracking-tight">
              {type && (
                <ProductBadge
                  type={type}
                  className="inline-flex align-middle mr-2 relative -top-0.5"
                />
              )}
              {name}
            </h3>
          </div>
          
          <div className="mt-auto pt-2 border-t border-neutral-50 dark:border-neutral-800">
            <div className="flex items-end justify-between gap-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent-yellow shadow-sm">
                    <span className="text-[10px] text-white font-black leading-none">G</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[28px] leading-none font-black font-amount text-accent-red tracking-tight">{price.toLocaleString()}</span>
                    <span className="text-[11px] font-black text-neutral-400">/抽</span>
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
                <Heart className={cn("w-4 h-4 stroke-[3]", isFollowed && "fill-current")} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
