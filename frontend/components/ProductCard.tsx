
import Link from 'next/link';
import ProductBadge, { ProductType } from './ui/ProductBadge';
import Image from 'next/image';

const ITEM_IMAGES = [
  '/images/item/10001.jpg',
  '/images/item/10002.jpg',
  '/images/item/10003.jpg',
  '/images/item/10004.jpg',
  '/images/item/10005.jpg',
  '/images/item/10006.jpg',
  '/images/item/10007.jpg',
  '/images/item/10008.jpg',
  '/images/item/10009.jpg',
  '/images/item/10010.jpg',
  '/images/item/10011.jpg',
  '/images/item/10012.jpg',
  '/images/item/10013.jpg',
  '/images/item/10014.jpg',
  '/images/item/10015.jpg',
  '/images/item/10016.jpg',
  '/images/item/10017.jpg',
  '/images/item/10018.jpg',
  '/images/item/10019.jpg',
  '/images/item/10020.jpg',
];

const getItemImageForId = (id: string | number) => {
  if (ITEM_IMAGES.length === 0) return '/images/item.png';
  const key = typeof id === 'number' ? id.toString() : id;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const index = hash % ITEM_IMAGES.length;
  return ITEM_IMAGES[index] || '/images/item.png';
};

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

export default function ProductCard(props: ProductCardProps) {
  const {
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
  } = props;
  const href = type === 'blindbox' ? `/blindbox/${id}` : `/shop/${id}`;
  const fallbackImage = getItemImageForId(id);
  const displayImage = image || fallbackImage;
  const drawnCount = typeof total === 'number' && typeof remaining === 'number' && total > 0
    ? Math.max(total - remaining, 0)
    : null;

  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-[8px] border border-neutral-100 dark:border-neutral-800 overflow-hidden transition-transform duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-t-[8px]">
          <div className="w-full h-full flex items-center justify-center text-white/20 group-hover:scale-105 transition-transform duration-500 relative">
            <Image 
              src={displayImage}
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          <div className="absolute top-0 left-0 z-10 flex flex-col pointer-events-none">
            {isNew && !isHot && (
              <ProductBadge
                type="new"
                className="h-6 rounded-2xl rounded-tr-none rounded-bl-none text-[11px]"
              />
            )}
          </div>
          
          <div className="absolute top-0 right-0 z-10 flex flex-col items-end pointer-events-none">
            {isHot && (
              <div className="h-6 px-2 inline-flex items-center rounded-tr-lg rounded-bl-lg bg-[#EE4D2D] text-white text-[11px] font-black border border-white/10 leading-none">
                熱門
              </div>
            )}
          </div>

          {((typeof remaining === 'number' && remaining <= 0) || status === 'ended') && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-[8px]">
              <Image 
                src="/images/sale.svg" 
                alt="完抽" 
                width={96}
                height={96}
                className="w-24 h-auto transform scale-110"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2 md:pt-2 md:-mt-0.5">
          <div className="mb-1 min-h-[2.75rem]">
            <h3 className="text-[13px] font-normal text-neutral-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors tracking-tight">
              {type && (
                <ProductBadge
                  type={type}
                  className="inline-flex align-middle mr-1 relative -top-[0.1rem]"
                />
              )}
              <span className="inline">
                {name}
              </span>
            </h3>
          </div>
          
          <div className="mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-end justify-between gap-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent-yellow">
                    <span className="text-[10px] text-white font-black leading-none">G</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[24px] leading-none font-black font-amount text-[#EE4D2D] tracking-tight">{price.toLocaleString()}</span>
                    <span className="text-[11px] font-black text-neutral-400">/抽</span>
                  </div>
                </div>
              </div>

              {drawnCount !== null && (
                <span className="text-[10px] font-medium text-neutral-600">
                  已抽{drawnCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
