
import Link from 'next/link';
import { Flame, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
}

export default function ProductCard({
  id,
  name,
  image,
  price,
  originalPrice,
  remaining,
  total,
  isHot = false,
  isNew = false,
  hasTicket = false,
  category,
}: ProductCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFollowed(!isFollowed);
  };

  return (
    <Link href={`/shop/${id}`} className="group block h-full">
      <div className="relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-t-2xl">
          <div className="w-full h-full flex items-center justify-center text-white/20 group-hover:scale-105 transition-transform duration-500">
            <img 
              src={image || '/images/item.png'} 
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between">
            {isHot ? (
              <span className="px-2 py-0.5 text-[11px] font-black text-white bg-accent-red rounded-lg shadow-lg shadow-accent-red/20 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                熱賣
              </span>
            ) : <div />}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2">
          {category && (
            <div className="mb-1">
              <span className="px-1.5 py-0.5 text-[10px] md:text-[12px] font-black text-primary bg-primary/5 rounded-md uppercase tracking-wider border border-primary/10">
                {category}
              </span>
            </div>
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
