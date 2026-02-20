'use client';

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import type { TouchEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroBanner from '@/components/HeroBanner';
import WinningMarquee from '@/components/WinningMarquee';
import { hasAdjustedRates } from '@/utils/rateUtils';

interface TabItem {
  id: string;
  name: string;
  kind: 'reset' | 'type' | 'category';
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

const productTypes = [
  { id: 'all', name: '全部商品' },
  { id: 'ichiban', name: '一番賞' },
  { id: 'blindbox', name: '盒玩' },
  { id: 'gacha', name: '轉蛋' },
  { id: 'custom', name: '自製賞' },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get('category') || 'all';
  const activeType = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [products, setProducts] = useState<(Database['public']['Tables']['products']['Row'] & { product_tags: { category_id: string }[] })[]>([]);
  const [categories, setCategories] = useState<Database['public']['Tables']['categories']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const [banners, setBanners] = useState<Database['public']['Tables']['banners']['Row'][]>([]);

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [activeLabelTab, setActiveLabelTab] = useState<'hot' | 'new' | 'rate'>('new');
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

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
      type CategoryRow = Database['public']['Tables']['categories']['Row'];
      const [productsRes, categoriesRes] = await Promise.all([
        withTimeout(supabase.from('products').select('*, product_tags(category_id)').neq('status', 'pending') as unknown as Promise<unknown>),
        withTimeout(supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }) as unknown as Promise<unknown>)
      ]);

      const pRes = productsRes as unknown as { data?: (ProductRow & { product_tags: { category_id: string }[] })[]; error?: { message?: string } };
      const cRes = categoriesRes as unknown as { data?: CategoryRow[]; error?: { message?: string } };
      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;

      setProducts((pRes.data as (ProductRow & { product_tags: { category_id: string }[] })[]) || []);
      setCategories((cRes.data as CategoryRow[]) || []);
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
      .channel('realtime-products-shop')
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

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        type BannerRow = Database['public']['Tables']['banners']['Row'];
        const { data } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        setBanners((data as BannerRow[]) || []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };
    fetchBanners();
  }, [supabase]);

  const allCategories = useMemo(() => [
    { id: 'all', name: '全部商品', sort_order: -1, is_active: true, created_at: '' },
    ...categories
  ], [categories]);

  const combinedTabs = useMemo(() => [
    { id: 'all_reset', name: '全部商品', kind: 'reset' } as TabItem,
    ...productTypes.filter(t => t.id !== 'all').map(t => ({ ...t, kind: 'type' } as TabItem)),
    ...categories.map(c => ({ ...c, kind: 'category' } as TabItem))
  ], [categories]);

  const getActiveTabIndex = () => {
    return combinedTabs.findIndex((tab) => {
      if (tab.kind === 'reset') {
        return activeType === 'all' && activeCategory === 'all';
      }
      if (tab.kind === 'type') {
        return activeType === tab.id;
      }
      if (tab.kind === 'category') {
        return activeCategory === tab.id;
      }
      return false;
    });
  };

  const goToAdjacentTab = (direction: 'next' | 'prev') => {
    if (!combinedTabs.length) return;
    const currentIndex = getActiveTabIndex();
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= combinedTabs.length) return;
    const nextTab = combinedTabs[nextIndex];
    handleTabClick(nextTab);
  };

  const handleTabClick = (item: TabItem) => {
    if (item.kind === 'reset') {
      const params = new URLSearchParams(searchParams);
      params.delete('category');
      params.delete('type');
      router.push(`/shop?${params.toString()}`);
    } else if (item.kind === 'type') {
      handleTypeChange(item.id);
    } else if (item.kind === 'category') {
      handleCategoryChange(item.id);
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const startTime = touchStartTimeRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;
    if (startX == null || startY == null || startTime == null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dt = Date.now() - startTime;
    if (dt > 600) return;
    if (Math.abs(dx) < 40) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) {
      goToAdjacentTab('next');
    } else {
      goToAdjacentTab('prev');
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeType !== 'all') {
      result = result.filter((p) => p.type === activeType);
    }

    if (activeCategory !== 'all') {
      result = result.filter((p) =>
        p.product_tags?.some((tag) => tag.category_id === activeCategory)
      );
    }

    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeLabelTab === 'hot') {
      result = result.filter((p) => p.is_hot);
    }

    if (activeLabelTab === 'rate') {
      result = result.filter((p) => hasAdjustedRates(p.id));
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [activeCategory, activeType, searchQuery, sortBy, products, activeLabelTab]);

  const handleCategoryChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    if (id === 'all') {
      params.delete('category');
    } else {
      params.set('category', id);
      params.delete('type'); // Reset type when selecting category (Mutually Exclusive)
    }
    router.push(`/shop?${params.toString()}`);
  };

  const handleTypeChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    if (id === 'all') {
      params.delete('type');
      params.delete('category'); // Reset category when selecting "All Products"
    } else {
      params.set('type', id);
      params.delete('category'); // Reset category when selecting specific type
    }
    router.push(`/shop?${params.toString()}`);
  };

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    router.push('/shop');
  };

  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    // Remove non-digits
    const raw = value.replace(/\D/g, '');
    if (!raw) {
      setter('');
      return;
    }
    // Format with commas
    setter(parseInt(raw).toLocaleString());
  };

  const handleKeywordSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get('search') || '';
    if (current === term) {
      params.delete('search');
    } else {
      params.set('search', term);
    }
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-0 md:pt-4">
        {activeType === 'all' && activeCategory === 'all' && (
          <div className="md:hidden mb-0">
            <WinningMarquee />
            {banners.length > 0 && (
              <div className="-mx-2 max-h-[180px] overflow-hidden">
                <HeroBanner
                  banners={banners.map((b) => ({
                    id: b.id.toString(),
                    image: b.image_url,
                    link: b.link_url || '#',
                  }))}
                />
              </div>
            )}
          </div>
        )}

        <div className="md:hidden sticky top-[54px] flex flex-col gap-0 mb-[0.4rem] animate-in fade-in slide-in-from-top-2 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm">
          {/* 上排：種類 Tabs */}
          <div className="flex items-center">
            <div className="flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
              <div className="flex gap-4 min-w-max px-0">
                {combinedTabs.map((tab) => {
                  const isActive =
                    (tab.kind === 'reset' && activeType === 'all' && activeCategory === 'all') ||
                    (tab.kind === 'type' && activeType === tab.id) ||
                    (tab.kind === 'category' && activeCategory === tab.id);

                  return (
                    <button
                      key={`${tab.kind}-${tab.id}`}
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        "relative pb-2.5 pt-2.5 text-[16px] font-black whitespace-nowrap text-neutral-700 dark:text-neutral-300",
                        isActive && "text-primary dark:text-primary"
                      )}
                    >
                      {tab.name}
                      {isActive && (
                        <span className="absolute left-0 right-0 -bottom-[1px] h-1 bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 下排：模式 + IP 標籤 + 篩選按鈕 */}
          <div className="flex items-center gap-1 overflow-x-visible">
            <div className="flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
              <div className="flex gap-2 px-0 py-2">
                {[
                  { kind: 'mode' as const, id: 'hot', label: '熱門' },
                  { kind: 'mode' as const, id: 'new', label: '最新' },
                  { kind: 'mode' as const, id: 'rate', label: '機率UP' },
                  { kind: 'kw' as const, id: 'kw-pokemon', label: '寶可夢' },
                  { kind: 'kw' as const, id: 'kw-demon', label: '鬼滅之刃' },
                  { kind: 'kw' as const, id: 'kw-shin', label: '蠟筆小新' },
                  { kind: 'kw' as const, id: 'kw-labubu', label: 'LABUBU' },
                  { kind: 'kw' as const, id: 'kw-onepiece', label: '海賊王' },
                ].map((item) => {
                  const isMode = item.kind === 'mode';
                  const isActiveMode = isMode && activeLabelTab === (item.id as 'hot' | 'new' | 'rate');
                  const isActiveKw = !isMode && searchQuery === item.label;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isMode) {
                          setActiveLabelTab(item.id as 'hot' | 'new' | 'rate');
                          if (item.id === 'new') {
                            setSortBy('newest');
                          }
                        } else {
                          handleKeywordSearch(item.label);
                        }
                      }}
                      className={cn(
                        "px-2.5 py-[7px] rounded-full text-[12px] font-black whitespace-nowrap tracking-[0.04em] border transition-all active:scale-95",
                        isMode
                          ? isActiveMode
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-soft"
                            : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-100 dark:border-neutral-800"
                          : isActiveKw
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-soft"
                            : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-100 dark:border-neutral-800"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 active:scale-95 transition-all",
                  isMobileSortOpen && "border-primary bg-primary/5 text-primary"
                )}
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.25]" />
              </button>

              {isMobileSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMobileSortOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-3xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {[
                      { id: 'newest', label: '最新上架' },
                      { id: 'price-asc', label: '價格: 低到高' },
                      { id: 'price-desc', label: '價格: 高到低' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id as 'newest' | 'price-asc' | 'price-desc');
                          setIsMobileSortOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm font-black rounded-xl transition-colors",
                          sortBy === opt.id
                            ? "bg-primary/5 text-primary"
                            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
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

        {/* 3. Header Section (Desktop Title) */}
        <div className="hidden md:flex flex-col gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <h1 className="flex items-baseline gap-4 text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {searchQuery ? `搜尋結果: ${searchQuery}` : '全部商品'}
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                <span className="font-amount">{filteredProducts.length.toLocaleString()}</span> 個商品
              </span>
            </h1>

            <div className="flex items-center justify-end gap-2 w-auto">
              {/* Filter Tags Container (Desktop only) - Moved here */}
              {(activeCategory !== 'all' || activeType !== 'all' || !!searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 mr-2">
                  {activeType !== 'all' && (
                    <button
                      onClick={() => handleTypeChange('all')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/5 uppercase tracking-wider group"
                    >
                      {productTypes.find((t) => t.id === activeType)?.name ?? '種類'}
                      <span className="text-primary/40 group-hover:text-primary transition-colors">×</span>
                    </button>
                  )}
                  {activeCategory !== 'all' && (
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/5 uppercase tracking-wider group"
                    >
                      {allCategories.find((c) => c.id === activeCategory)?.name ?? '分類'}
                      <span className="text-primary/40 group-hover:text-primary transition-colors">×</span>
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.delete('search');
                        router.push(`/shop?${params.toString()}`);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all border border-neutral-200/50 uppercase tracking-wider group"
                    >
                      關鍵字: {searchQuery}
                      <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">×</span>
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/shop')}
                    className="text-xs font-black text-neutral-400 hover:text-accent-red px-2 py-1 transition-colors uppercase tracking-widest ml-1"
                  >
                    清除全部
                  </button>
                </div>
              )}

              {/* Sorting Button (Desktop) */}
              <div className="relative group shrink-0">
                <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-black text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary shadow-soft transition-all active:scale-95">
                  <SlidersHorizontal className="w-4 sm:h-4 stroke-[2.5]" />
                  <span>排序方式</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-300 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-right scale-95 group-hover:scale-100">
                  {[
                    { id: 'newest', label: '最新上架' },
                    { id: 'price-asc', label: '價格: 低到高' },
                    { id: 'price-desc', label: '價格: 高到低' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id as 'newest' | 'price-asc' | 'price-desc')}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm font-black rounded-xl transition-colors",
                        sortBy === opt.id ? "bg-primary/5 text-primary" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Product Grid & Sidebar */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-card border border-neutral-100 dark:border-neutral-800 transition-colors space-y-6">
              {/* Unified Menu */}
              <div>
                <div className="space-y-1 lg:space-y-1">
                  {/* Fixed Types */}
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                      className={cn(
                        "w-full text-left px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-[13px] lg:text-sm font-black transition-all flex items-center justify-between group",
                        // Active state logic:
                        // 1. If type.id is 'all', it's active if both activeType is 'all' AND activeCategory is 'all'
                        // 2. Otherwise, it's active if activeType matches type.id
                        (type.id === 'all' ? (activeType === 'all' && activeCategory === 'all') : activeType === type.id)
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                      )}
                    >
                      <span className="truncate">{type.name}</span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 lg:w-4 h-4 transition-transform -rotate-90 shrink-0",
                        (type.id === 'all' ? (activeType === 'all' && activeCategory === 'all') : activeType === type.id) ? "text-white/50" : "text-neutral-300 group-hover:text-neutral-400"
                      )} />
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="py-2 flex items-center justify-center">
                    <div className="w-full border-t border-dashed border-neutral-200 dark:border-neutral-800"></div>
                  </div>

                  {/* Dynamic Categories (Tags) */}
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="px-2.5 lg:px-3 py-2 lg:py-2.5">
                         <Skeleton className="h-5 w-full rounded-lg" />
                      </div>
                    ))
                  ) : (
                    allCategories.filter(c => c.id !== 'all').map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={cn(
                          "w-full text-left px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-[13px] lg:text-sm font-black transition-all flex items-center justify-between group",
                          activeCategory === cat.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 lg:w-4 h-4 transition-transform -rotate-90 shrink-0",
                          activeCategory === cat.id ? "text-white/50" : "text-neutral-300 group-hover:text-neutral-400"
                        )} />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Price Range (Mock) */}
              <div>
                <div className="flex items-center gap-3 mb-3 lg:mb-4 px-1">
                  <div className="w-4 h-4 flex items-center justify-center rounded-full bg-accent-yellow/20 text-accent-yellow">
                    <span className="text-xs font-bold font-amount">$</span>
                  </div>
                  <h2 className="text-[12px] lg:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">價格區間</h2>
                </div>
                <div className="px-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <input 
                      type="text" 
                      value={priceMin}
                      onChange={(e) => handlePriceChange(e.target.value, setPriceMin)}
                      placeholder="min" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 text-center font-bold font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                    <span className="font-bold">-</span>
                    <input 
                      type="text" 
                      value={priceMax}
                      onChange={(e) => handlePriceChange(e.target.value, setPriceMax)}
                      placeholder="max" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 text-center font-bold font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>
                  <button className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black uppercase tracking-widest hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white transition-colors">
                    套用篩選
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div
            className="flex-1 w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-[6px] md:gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="h-[280px]">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <EmptyState 
                title="無法載入商品" 
                description={loadError}
                actionLabel="重試"
                onAction={() => {
                  // simple reload to retry
                  window.location.reload();
                }}
              />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-[6px] md:gap-4">
                {filteredProducts.map((product) => (
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
                ))}
              </div>
            ) : (
              <EmptyState 
                title="找不到商品" 
                description="試試看調整搜尋關鍵字或篩選條件" 
                actionLabel="清除篩選"
                onAction={clearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
