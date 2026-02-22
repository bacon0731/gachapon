'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  ShoppingCart,
  Info,
  X,
  Search,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MarketProductCard from '@/components/MarketProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface MarketplaceListing {
  id: number;
  price: number;
  seller_id: string;
  seller_name?: string;
  created_at: string;
  draw_record_id: number;
  product_prizes: {
    name: string;
    level: string;
    image_url: string;
  };
  products: {
    id: number;
    name: string;
    type?: string;
  };
}

interface RawMarketplaceListing {
  id: number;
  price: number;
  seller_id: string;
  created_at: string;
  draw_record_id: number;
  draw_records: {
    product_prizes: {
      name: string;
      level: string;
      image_url: string;
    };
    products: {
      id: number;
      name: string;
      type?: string;
    };
  };
}

export default function MarketplacePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'sold_out'>('newest');
  
  // Filters
  const activeType = searchParams.get('type') || 'all';
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const trimmedQuery = query.trim();
  const searchQueryParam = searchParams.get('search') || '';

  type PrimaryTabId =
    | 'all'
    | 'ichiban'
    | 'blindbox'
    | 'gacha'
    | 'card'
    | 'custom';

  const [activePrimaryTab, setActivePrimaryTab] = useState<PrimaryTabId>('all');
  const [activeSecondaryTab, setActiveSecondaryTab] = useState<string>('all');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const primaryTabs: { id: PrimaryTabId; label: string }[] = [
    { id: 'all', label: '精選' },
    { id: 'ichiban', label: '一番賞' },
    { id: 'blindbox', label: '盒玩' },
    { id: 'gacha', label: '轉蛋' },
    { id: 'card', label: '抽卡' },
    { id: 'custom', label: '自製賞' },
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
  };

  const setActiveType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.push(`/market?${params.toString()}`);
  };

  useEffect(() => {
    setQuery(searchQueryParam);
  }, [searchQueryParam]);
  
  // Purchase Modal
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [supabase] = useState(() => createClient());

  type ListingsQueryResult = {
    data: RawMarketplaceListing[] | null;
    error: unknown;
  };

  const fetchListings = React.useCallback(async () => {
    const LOAD_TIMEOUT_MS = 8000;
    const withTimeout = async <T,>(p: Promise<T>) => {
      return Promise.race<T>([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS))
      ]);
    };
    setIsLoading(true);
    setLoadError(null);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select(`
          id,
          price,
          seller_id,
          created_at,
          draw_record_id,
          draw_records!inner (
            product_prizes ( name, level, image_url ),
            products ( id, name, type )
          )
        `)
        .eq('status', 'active');

      // Sort
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      }

      const { data, error } = await withTimeout<ListingsQueryResult>(
        query as unknown as Promise<ListingsQueryResult>
      );

      if (error) throw error;

      if (!data) {
        setListings([]);
        return;
      }

      const formattedData = data.map((item) => ({
        id: item.id,
        price: item.price,
        seller_id: item.seller_id,
        seller_name: '玩家', // Placeholder
        created_at: item.created_at,
        draw_record_id: item.draw_record_id,
        product_prizes: item.draw_records.product_prizes,
        products: item.draw_records.products
      }));

      setListings(formattedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
      const message = '載入逾時或失敗，請稍後重試';
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, supabase]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Filter by Type
    if (activeType !== 'all') {
      result = result.filter(item => item.products.type === activeType);
    }

    // Filter by Search
    if (trimmedQuery) {
      const lowered = trimmedQuery.toLowerCase();
      result = result.filter(item =>
        item.products.name.toLowerCase().includes(lowered) ||
        item.product_prizes.name.toLowerCase().includes(lowered)
      );
    }

    // Filter by Level
    if (filterLevel) {
      result = result.filter(item => item.product_prizes.level === filterLevel);
    }

    // Filter by Price
    if (priceMin) {
      const min = parseInt(priceMin.replace(/,/g, ''));
      if (!isNaN(min)) {
        result = result.filter(item => item.price >= min);
      }
    }
    if (priceMax) {
      const max = parseInt(priceMax.replace(/,/g, ''));
      if (!isNaN(max)) {
        result = result.filter(item => item.price <= max);
      }
    }

    return result;
  }, [listings, activeType, filterLevel, priceMin, priceMax, trimmedQuery]);

  const handlePurchase = async () => {
    if (!selectedListing || !user) return;
    
    // Check balance (client side check first)
    if ((user.tokens || 0) < selectedListing.price) {
      toast.error('代幣餘額不足');
      return;
    }

    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.rpc('purchase_listing', {
        p_listing_id: selectedListing.id,
        p_buyer_id: user.id
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast.success('購買成功！獎項已存入您的倉庫');
      setSelectedListing(null);
      await fetchListings(); // Refresh list
      await refreshProfile(); // Refresh user balance
    } catch (error: unknown) {
      console.error('Purchase Error:', error);
      const message = error instanceof Error ? error.message : '購買失敗';
      toast.error(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelListing = async () => {
    if (!selectedListing || !user) return;

    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.rpc('cancel_listing', {
        p_listing_id: selectedListing.id,
        p_user_id: user.id
      });

      if (error) throw error;
      if (data.success) {
        toast.success(data.message);
        setSelectedListing(null);
        await fetchListings();
        await refreshProfile();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Cancel listing error:', error);
      toast.error((error as Error).message || '取消上架失敗');
    } finally {
      setIsPurchasing(false);
    }
  };

  const productTypes = [
    { id: 'all', name: '精選' },
    { id: 'ichiban', name: '一番賞' },
    { id: 'blindbox', name: '盲盒' },
    { id: 'gacha', name: '轉蛋' },
    { id: 'card', name: '抽卡' },
    { id: 'custom', name: '自製賞' },
  ];

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('searchHistory') : null;
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    const fetchHotKeywords = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('name, is_hot, created_at')
          .neq('status', 'pending')
          .order('is_hot', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Error fetching market hot keywords:', error);
          setHotKeywords([]);
          return;
        }

        const keywords = Array.from(
          new Set(
            (data || [])
              .map((p: { name: string | null }) => p.name?.trim())
              .filter((name): name is string => !!name)
          )
        ).slice(0, 12);

        setHotKeywords(keywords);
      } catch (err) {
        console.error('Error fetching market hot keywords:', err);
        setHotKeywords([]);
      }
    };

    fetchHotKeywords();
  }, [supabase]);

  const saveHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...searchHistory.filter((h) => h !== trimmed)].slice(0, 10);
    setSearchHistory(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(next));
    }
  };

  const deleteHistoryItem = (term: string) => {
    const next = searchHistory.filter((h) => h !== term);
    setSearchHistory(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(next));
    }
  };

  const visibleHistory = searchHistory.slice(0, 5);

  const showSuggestionPanel = isInputFocused && !trimmedQuery;

  const handleSearchSubmit = (value?: string) => {
    const raw = (typeof value === 'string' ? value : query).trim();
    const params = new URLSearchParams(searchParams.toString());

    if (!raw) {
      setQuery('');
      setIsInputFocused(false);
      params.delete('search');
      const qs = params.toString();
      router.push(qs ? `/market?${qs}` : '/market');
      return;
    }

    setQuery(raw);
    saveHistory(raw);
    setIsInputFocused(false);
    params.set('search', raw);
    router.push(`/market?${params.toString()}`);
  };

  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) {
      setter('');
      return;
    }
    setter(parseInt(raw).toLocaleString());
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-neutral-950 pb-24 transition-colors">
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 md:hidden">
        <div className="max-w-7xl mx-auto px-2 relative">
          <div className="flex items-center gap-3 h-[57px]">
            <span className="text-[18px] font-black text-neutral-900 dark:text-white">
              交易所
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[2.5]" />
                <input
                  ref={inputRef}
                  value={query}
                  onFocus={() => setIsInputFocused(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="曾經搜尋平凡的商品"
                  className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full pl-9 pr-8 text-[13px] font-black text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleSearchSubmit('');
                    setIsInputFocused(false);
                    inputRef.current?.blur();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
              <button
                type="submit"
                className="px-3 h-9 rounded-full bg-primary text-white text-[12px] font-black whitespace-nowrap active:scale-95 transition-transform"
              >
                搜尋
              </button>
            </form>
          </div>

          {showSuggestionPanel && (
            <div className="absolute left-0 right-0 mt-2">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl px-3 py-1 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {visibleHistory.map((term) => (
                    <div
                      key={term}
                      className="flex items-center justify-between py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit(term)}
                        className="flex items-center gap-2 text-left flex-1"
                      >
                        <History className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
                          {term}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(term);
                        }}
                        className="ml-2 text-[11px] font-black text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                      >
                        清除
                      </button>
                    </div>
                  ))}

                  {hotKeywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleSearchSubmit(kw)}
                      className="w-full py-2.5 text-left text-[13px] font-black text-primary"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 md:pt-6 pb-10">
        {!trimmedQuery && (
          <div className="md:hidden sticky top-[57px] z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 -mx-2">
            <div className="max-w-7xl mx-auto px-2 py-2 space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide pb-1 border-b border-neutral-100 dark:border-neutral-800">
                {primaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActivePrimaryTab(tab.id);
                      setActiveType(tab.id);
                    }}
                    className="relative flex-shrink-0 px-3 py-1.5 text-[15px] font-black whitespace-nowrap"
                  >
                    <span
                      className={cn(
                        "transition-colors",
                        activePrimaryTab === tab.id ? "text-primary" : "text-neutral-500"
                      )}
                    >
                      {tab.label}
                    </span>
                    {activePrimaryTab === tab.id && (
                      <span className="absolute inset-x-1 -bottom-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pb-1">
                <div className="flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                  <div className="flex items-center gap-1.5">
                    {secondaryTabsByPrimary[activePrimaryTab].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSecondaryTab(tab.id)}
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
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    className={cn(
                      "ml-1 mr-1 p-1.5 rounded-full active:scale-95 transition-all",
                      !isSortOpen
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
                  {isSortOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsSortOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 rounded-lg shadow-modal border border-neutral-100 dark:border-neutral-800 py-2 z-40">
                        {[
                          { id: 'newest' as const, label: '最新上架' },
                          { id: 'price_asc' as const, label: '價格：低到高' },
                          { id: 'price_desc' as const, label: '價格：高到低' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.id);
                              setIsSortOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-[13px] font-black transition-colors",
                              sortBy === opt.id
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
        )}
        {trimmedQuery && (
          <div className="md:hidden flex items-baseline justify-between mb-2 px-1">
            <span className="text-[14px] font-black text-neutral-900 dark:text-white tracking-tight">
              搜尋「{trimmedQuery}」的結果
            </span>
            <span className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {filteredListings.length.toLocaleString()} 個獎項
            </span>
          </div>
        )}

        {/* Mobile Product Grid - align spacing與首頁一致：外層px-2、列表自己不再加一層px-2 */}
        <section className="md:hidden px-0 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-[280px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : loadError ? (
              <div className="col-span-full">
                <EmptyState 
                  title="無法載入市集資料" 
                  description={loadError}
                  actionLabel="重試"
                  onAction={() => fetchListings()}
                />
              </div>
            ) : filteredListings.length > 0 ? (
              filteredListings.map((item) => (
                <MarketProductCard 
                  key={item.id} 
                  id={item.id}
                  name={item.product_prizes.name}
                  image={item.product_prizes.image_url}
                  price={item.price}
                  grade={item.product_prizes.level}
                  series={item.products.name}
                  productId={item.products.id}
                  isUserOwned={user?.id === item.seller_id}
                  onClick={() => setSelectedListing(item)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  title="找不到獎項" 
                  description="試試看調整篩選條件" 
                />
              </div>
            )}
          </div>
        </section>

        <div className="hidden md:flex md:flex-row gap-4 lg:gap-6 items-start">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-16">
            <div className="mb-4">
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                {trimmedQuery ? (
                  <>搜尋「{trimmedQuery}」的結果</>
                ) : (
                  '交易所'
                )}
              </h1>
              <div className="mt-1 text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                <span className="font-amount">{filteredListings.length.toLocaleString()}</span> 個獎項
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-card border border-neutral-100 dark:border-neutral-800 transition-colors space-y-6">
              <div>
                <div className="space-y-1 lg:space-y-1">
                  {productTypes.map((type) => (
                    <div key={type.id}>
                      <button
                        onClick={() => setActiveType(type.id)}
                        className={cn(
                          "w-full text-left px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-[13px] lg:text-sm font-black transition-all flex items-center justify-between group",
                          activeType === type.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                        )}
                      >
                        <span className="truncate">{type.name}</span>
                      </button>
                      {type.id === 'custom' && (
                        <div className="mt-2 mb-1 border-t border-dashed border-neutral-200 dark:border-neutral-700" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3 lg:mb-4 px-1">
                  <h2 className="text-[12px] lg:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">價格區間</h2>
                </div>
                <div className="px-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <input 
                      type="text" 
                      value={priceMin}
                      onChange={(e) => handlePriceChange(e.target.value, setPriceMin)}
                      placeholder="最小" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 text-center font-black font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                    <span className="font-bold">-</span>
                    <input 
                      type="text" 
                      value={priceMax}
                      onChange={(e) => handlePriceChange(e.target.value, setPriceMax)}
                      placeholder="最大" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 text-center font-black font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
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
          <div className="flex-1 w-full">
            <div className="hidden md:block sticky top-16 z-30 mb-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 -top-6 h-10 bg-[#F5F5F5] dark:bg-neutral-950 z-0" />
                <div className="relative z-10 bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-x-auto overscroll-x-contain scrollbar-hide">
                      <div className="flex items-center gap-1.5">
                        {secondaryTabsByPrimary[activePrimaryTab].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSecondaryTab(tab.id)}
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
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsSortOpen((prev) => !prev)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-[13px] font-black text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary shadow-soft transition-all active:scale-95",
                          isSortOpen && "border-primary text-primary"
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
                        <span>排序方式</span>
                      </button>
                      {isSortOpen && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 rounded-lg shadow-modal border border-neutral-100 dark:border-neutral-800 py-2 z-40">
                          {[
                            { id: 'newest' as const, label: '最新上架' },
                            { id: 'price_asc' as const, label: '價格：低到高' },
                            { id: 'price_desc' as const, label: '價格：高到低' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-[13px] font-black transition-colors",
                                sortBy === opt.id
                                  ? "bg-primary/5 text-primary"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isLoading ? (
              <section className="px-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="h-[280px]">
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </div>
              </section>
            ) : loadError ? (
              <EmptyState 
                title="無法載入市集資料" 
                description={loadError}
                actionLabel="重試"
                onAction={() => fetchListings()}
              />
            ) : filteredListings.length > 0 ? (
              <section className="px-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {filteredListings.map((item) => (
                    <MarketProductCard 
                      key={item.id} 
                      id={item.id}
                      name={item.product_prizes.name}
                      image={item.product_prizes.image_url}
                      price={item.price}
                      grade={item.product_prizes.level}
                      series={item.products.name}
                      productId={item.products.id}
                      isUserOwned={user?.id === item.seller_id}
                      onClick={() => setSelectedListing(item)}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <EmptyState 
                title="找不到獎項" 
                description="試試看調整篩選條件" 
              />
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-100 dark:border-neutral-800"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white">確認購買</h3>
                  <button 
                    onClick={() => setSelectedListing(null)}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="relative w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shrink-0">
                    <Image 
                      src={selectedListing.product_prizes.image_url} 
                      alt={selectedListing.product_prizes.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-[10px] font-black mb-1">
                      {selectedListing.products.name}
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white mb-2 line-clamp-2">
                      {selectedListing.product_prizes.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-accent-red">
                      <div className="w-4 h-4 rounded-full bg-accent-yellow flex items-center justify-center text-[10px] text-white font-black">G</div>
                      <span className="text-2xl font-black font-amount">{selectedListing.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">當前餘額</span>
                    <span className="font-black font-amount">{user?.tokens?.toLocaleString() || 0} G</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">購買金額</span>
                    <span className="font-black font-amount text-accent-red">-{selectedListing.price.toLocaleString()} G</span>
                  </div>
                  <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-900 dark:text-white font-black">購買後餘額</span>
                    <span className={cn(
                      "font-black font-amount",
                      (user?.tokens || 0) < selectedListing.price ? "text-red-500" : "text-neutral-900 dark:text-white"
                    )}>
                      {((user?.tokens || 0) - selectedListing.price).toLocaleString()} G
                    </span>
                  </div>
                  {(user?.tokens || 0) < selectedListing.price && (
                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <Info className="w-3.5 h-3.5" />
                      <span>餘額不足，請先儲值</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    取消
                  </button>
                  {user?.id === selectedListing.seller_id ? (
                    <button
                      onClick={handleCancelListing}
                      disabled={isPurchasing}
                      className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all border border-neutral-100 dark:border-neutral-700"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          處理中...
                        </>
                      ) : (
                        <span>取消上架</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing || (user?.tokens || 0) < selectedListing.price}
                      className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          處理中...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          確認購買
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
