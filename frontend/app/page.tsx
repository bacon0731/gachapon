'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { BannerSkeleton } from '@/components/Skeletons';
import HeroBanner from '@/components/HeroBanner';
import WinningMarquee from '@/components/WinningMarquee';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ProductRow = Database['public']['Tables']['products']['Row'];

type SortMode = 'latest' | 'price-asc' | 'price-desc' | 'sold-out';

export default function Home() {
  const [hotProducts, setHotProducts] = useState<ProductRow[]>([]);
  const [newProducts, setNewProducts] = useState<ProductRow[]>([]);
  const [banners, setBanners] = useState<Database['public']['Tables']['banners']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const fetchData = useCallback(async () => {
    const LOAD_TIMEOUT_MS = 8000;
    const withTimeout = async <T,>(p: Promise<T>) => {
      return Promise.race<T>([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS))
      ]);
    };

    try {
      setIsLoading(true);
      setLoadError(null);
      type ProductRow = Database['public']['Tables']['products']['Row'];
      type BannerRow = Database['public']['Tables']['banners']['Row'];
      const [productsData, bannersData] = await Promise.all([
        withTimeout(supabase.from('products').select('*').neq('status', 'pending').order('created_at', { ascending: false }) as unknown as Promise<unknown>),
        withTimeout(supabase.from('banners').select('*').order('sort_order', { ascending: true }).eq('is_active', true) as unknown as Promise<unknown>)
      ]);

      const prodRes = productsData as unknown as { data?: ProductRow[] };
      const bannRes = bannersData as unknown as { data?: BannerRow[] };

      if (prodRes.data) {
        const p = prodRes.data;
        setNewProducts(p.slice(0, 10));
        setHotProducts(p.filter(pr => pr.is_hot).slice(0, 10));
      }

      if (bannRes.data) {
        setBanners(bannRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadError('載入逾時或失敗，請稍後重試');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoading) return;
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setLoadError((prev) => prev || '載入逾時或失敗，請稍後重試');
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-products-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData();
      })
      .on('broadcast', { event: 'products_updated' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

  type PrimaryTabId =
    | 'all'
    | 'ichiban'
    | 'blindbox'
    | 'gacha'
    | 'card'
    | 'custom'
    | 'limited'
    | 'valentine'
    | 'afterNewYear';

  const [activePrimaryTab, setActivePrimaryTab] = useState<PrimaryTabId>('all');
  const [activeSecondaryTab, setActiveSecondaryTab] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const primaryTabs: { id: PrimaryTabId; label: string }[] = [
    { id: 'all', label: '精選' },
    { id: 'ichiban', label: '一番賞' },
    { id: 'blindbox', label: '盒玩' },
    { id: 'gacha', label: '轉蛋' },
    { id: 'card', label: '抽卡' },
    { id: 'custom', label: '自製賞' },
    { id: 'limited', label: '限時優惠' },
    { id: 'valentine', label: '情人節限定' },
    { id: 'afterNewYear', label: '年後特價' },
  ];

  const secondaryTabsByPrimary: Record<PrimaryTabId, { id: string; label: string }[]> = {
    all: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-popular', label: '人氣主題' },
      { id: 'kw-limited', label: '限量款' },
      { id: 'kw-collab', label: '聯名合作' },
      { id: 'kw-season', label: '季節限定' },
      { id: 'kw-anime', label: '動漫IP' },
    ],
    ichiban: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-a', label: 'A賞' },
      { id: 'kw-last', label: '最後賞' },
      { id: 'kw-sp', label: '特別賞' },
      { id: 'kw-lottery', label: '抽獎活動' },
    ],
    blindbox: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-full', label: '整盒購' },
      { id: 'kw-rare', label: '隱藏款' },
      { id: 'kw-random', label: '隨機組合' },
      { id: 'kw-mini', label: '迷你尺寸' },
    ],
    gacha: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-figure', label: '公仔款' },
      { id: 'kw-key', label: '鑰匙圈' },
      { id: 'kw-machine', label: '機台限定' },
      { id: 'kw-series', label: '系列收藏' },
    ],
    card: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-10', label: '十連抽' },
      { id: 'kw-ssr', label: 'SSR卡' },
      { id: 'kw-pack', label: '卡包販售' },
      { id: 'kw-limited-card', label: '限量卡面' },
    ],
    custom: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-original', label: '原創賞' },
      { id: 'kw-lab', label: '實驗款' },
      { id: 'kw-fan', label: '同人作品' },
      { id: 'kw-event', label: '活動合作' },
    ],
    limited: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-today', label: '今日限定' },
      { id: 'kw-weekend', label: '週末優惠' },
      { id: 'kw-flash', label: '閃購時段' },
    ],
    valentine: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-couple', label: '情侶組合' },
      { id: 'kw-choco', label: '巧克力主題' },
      { id: 'kw-pink', label: '粉色系列' },
    ],
    afterNewYear: [
      { id: 'all', label: '全部' },
      { id: 'hot', label: '熱門' },
      { id: 'new', label: '最新' },
      { id: 'kw-clearing', label: '清倉出清' },
      { id: 'kw-bonus', label: '加碼贈品' },
      { id: 'kw-return', label: '開工回饋' },
    ],
  };

  useEffect(() => {
    setActiveSecondaryTab('all');
  }, [activePrimaryTab]);

  const filterByPrimaryTab = useCallback(
    (products: ProductRow[]) => {
      return products.filter((product) => {
        if (activePrimaryTab === 'all') {
          return true;
        }

        if (activePrimaryTab === 'limited' || activePrimaryTab === 'valentine' || activePrimaryTab === 'afterNewYear') {
          return true;
        }

        if (activePrimaryTab === 'card') {
          const category = product.category || '';
          return category.includes('卡') || category.toLowerCase().includes('card');
        }

        return product.type === activePrimaryTab;
      });
    },
    [activePrimaryTab]
  );

  const applySortAndFilter = useCallback(
    (products: ProductRow[]) => {
      const base = filterByPrimaryTab(products);
      let result = [...base];

      if (sortMode === 'sold-out') {
        result = result.filter(
          (p) =>
            (typeof p.remaining === 'number' && p.remaining <= 0) ||
            p.status === 'ended'
        );
      }

      if (sortMode === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortMode === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
      } else {
        result.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
      }

      return result;
    },
    [filterByPrimaryTab, sortMode]
  );

  const filteredHotProducts = useMemo(
    () => applySortAndFilter(hotProducts),
    [hotProducts, applySortAndFilter]
  );

  const filteredNewProducts = useMemo(
    () => applySortAndFilter(newProducts),
    [newProducts, applySortAndFilter]
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-neutral-950 pb-24 transition-colors">
      <div className="max-w-7xl mx-auto px-0 pt-0 sm:pt-4">
        <div className="px-2">
          <WinningMarquee />
        </div>

        <section className="mb-0 sm:mb-0">
          {isLoading ? (
            <BannerSkeleton />
          ) : (
            <HeroBanner
              banners={banners.map((b) => ({
                id: b.id,
                image: b.image_url,
                link: b.link_url || '#',
              }))}
            />
          )}
        </section>

        <div className="sticky top-[3.25rem] z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 -mx-0">
          <div className="max-w-7xl mx-auto px-2 py-2 space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 border-b border-neutral-100 dark:border-neutral-800">
              {primaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePrimaryTab(tab.id as typeof activePrimaryTab)}
                  className="relative flex-shrink-0 px-3 py-1.5 text-[13px] font-black whitespace-nowrap"
                >
                  <span className={cn(
                    "transition-colors",
                    activePrimaryTab === tab.id ? "text-primary" : "text-neutral-500"
                  )}>
                    {tab.label}
                  </span>
                  {activePrimaryTab === tab.id && (
                    <span className="absolute inset-x-1 -bottom-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5">
                  {secondaryTabsByPrimary[activePrimaryTab].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSecondaryTab(tab.id as typeof activeSecondaryTab)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[12px] font-black whitespace-nowrap transition-colors",
                        activeSecondaryTab === tab.id
                          ? "bg-primary text-white"
                          : "bg-neutral-100 text-neutral-600"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex-shrink-0 mr-[-0.25rem]">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={cn(
                    "ml-1 p-1.5 rounded-full active:scale-95 transition-all",
                    sortMode === 'latest' && !isFilterOpen
                      ? "text-neutral-500 hover:text-primary hover:bg-primary/5"
                      : "text-primary bg-primary/5"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16" />
                    <path d="M6 12h12" />
                    <path d="M10 20h4" />
                  </svg>
                </button>
                {isFilterOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 rounded-lg shadow-modal border border-neutral-100 dark:border-neutral-800 py-2 z-40">
                      {[
                        { id: 'latest' as SortMode, label: '最新上架' },
                        { id: 'price-asc' as SortMode, label: '價格：低到高' },
                        { id: 'price-desc' as SortMode, label: '價格：高到低' },
                        { id: 'sold-out' as SortMode, label: '已完抽' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortMode(opt.id);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-[13px] font-black transition-colors",
                            sortMode === opt.id
                              ? "bg-primary/5 text-primary"
                              : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mb-4 sm:mb-8 px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-1.5 gap-y-3 sm:gap-4">
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-[280px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : loadError ? (
              <div className="col-span-full text-center text-sm text-neutral-500 dark:text-neutral-400 font-black">
                {loadError}
              </div>
            ) : (
              filteredHotProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  name={product.name}
                  image={product.image_url || ''}
                  price={product.price}
                  remaining={product.remaining}
                  total={product.total_count}
                  isHot={product.is_hot}
                  type={product.type}
                  status={product.status}
                />
              ))
            )}
          </div>
        </section>

        {/* New Products */}
        <section className="px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-[280px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : loadError ? (
              <div className="col-span-full text-center text-sm text-neutral-500 dark:text-neutral-400 font-black">
                {loadError}
              </div>
            ) : (
              filteredNewProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  name={product.name}
                  image={product.image_url || ''}
                  price={product.price}
                  remaining={product.remaining}
                  total={product.total_count}
                  isHot={product.is_hot}
                  type={product.type}
                  status={product.status}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
