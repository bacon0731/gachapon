'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Filter, 
  ShoppingCart, 
  Info, 
  X, 
  SlidersHorizontal, 
  ChevronDown,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MarketProductCard from '@/components/MarketProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter, useSearchParams } from 'next/navigation';

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
    name: string;
    type?: string;
  };
}

export default function MarketplacePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  
  // Filters
  const activeType = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (localSearch) params.set('search', localSearch);
    else params.delete('search');
    router.push(`/market?${params.toString()}`);
  };

  const setActiveType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.push(`/market?${params.toString()}`);
  };
  
  // Purchase Modal
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchListings();
  }, [sortBy]);

  const fetchListings = async () => {
    setIsLoading(true);
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
            products ( name, type )
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

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
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
      toast.error('無法載入市集資料');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Filter by Type
    if (activeType !== 'all') {
      result = result.filter(item => item.products.type === activeType);
    }

    // Filter by Search
    if (searchQuery) {
      result = result.filter(item => 
        item.products.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.product_prizes.name.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [listings, activeType, filterLevel, priceMin, priceMax]);

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
      fetchListings(); // Refresh list
      refreshProfile(); // Refresh user balance
    } catch (error: any) {
      console.error('Purchase Error:', error);
      toast.error(error.message || '購買失敗');
    } finally {
      setIsPurchasing(false);
    }
  };

  const productTypes = [
    { id: 'all', name: '全部獎項' },
    { id: 'ichiban', name: '一番賞' },
    { id: 'blindbox', name: '盒玩' },
    { id: 'gacha', name: '轉蛋' },
    { id: 'custom', name: '自製賞' },
  ];

  const levels = [
    { id: 'SP', name: 'SP賞' },
    { id: 'A', name: 'A賞' },
    { id: 'B', name: 'B賞' },
    { id: 'C', name: 'C賞' },
    { id: 'Last One', name: 'Last One' },
  ];

  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) {
      setter('');
      return;
    }
    setter(parseInt(raw).toLocaleString());
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 md:pt-6">
        {/* 1. Mobile Filter Row */}
        <div className="md:hidden flex flex-col gap-3 mb-4 animate-in fade-in slide-in-from-top-2 relative z-30">
          <div className="flex items-center gap-2">
             {/* Scrollable Category Tabs */}
             <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(type.id)}
                      className={cn(
                        "flex-shrink-0 px-3 py-2 min-h-[40px] flex items-center rounded-xl text-sm font-black whitespace-nowrap transition-all",
                        activeType === type.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800"
                      )}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
             </div>

             {/* Sort Button */}
             <div className="relative shrink-0">
               <button 
                 onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
                 className={cn(
                   "flex items-center justify-center w-11 h-11 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-neutral-600 dark:text-neutral-400 shadow-soft active:scale-95 transition-all",
                   isMobileSortOpen && "border-primary text-primary"
                 )}
               >
                 <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
               </button>
               
               {/* Dropdown */}
               {isMobileSortOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setIsMobileSortOpen(false)} 
                   />
                   <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-3xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                     {[
                       { id: 'newest', label: '最新上架' },
                       { id: 'price_asc', label: '價格: 低到高' },
                       { id: 'price_desc', label: '價格: 高到低' },
                     ].map((opt) => (
                       <button
                         key={opt.id}
                         onClick={() => {
                           setSortBy(opt.id as any);
                           setIsMobileSortOpen(false);
                         }}
                         className={cn(
                           "w-full text-left px-4 py-3 text-sm font-black rounded-xl transition-colors",
                           sortBy === opt.id ? "bg-primary/5 text-primary" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
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

        {/* Mobile Type Tabs - REMOVED per request (Moved to Navbar) */}


        {/* Desktop Header */}
        <div className="hidden md:flex flex-col gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <h1 className="flex items-baseline gap-4 text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              市集
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                <span className="font-amount">{filteredListings.length.toLocaleString()}</span> 個獎項
              </span>
            </h1>

            <div className="flex items-center justify-end gap-2 w-auto">
              {/* Filter Tags */}
              {(activeType !== 'all' || filterLevel || priceMin || priceMax) && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 mr-2">
                   {activeType !== 'all' && (
                    <button
                      onClick={() => setActiveType('all')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/5 uppercase tracking-wider group"
                    >
                      {productTypes.find((t) => t.id === activeType)?.name}
                      <span className="text-primary/40 group-hover:text-primary transition-colors">×</span>
                    </button>
                  )}
                  {filterLevel && (
                    <button
                      onClick={() => setFilterLevel(null)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/5 uppercase tracking-wider group"
                    >
                      {levels.find((l) => l.id === filterLevel)?.name}
                      <span className="text-primary/40 group-hover:text-primary transition-colors">×</span>
                    </button>
                  )}
                  {(priceMin || priceMax) && (
                    <button
                      onClick={() => {
                        setPriceMin('');
                        setPriceMax('');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/5 uppercase tracking-wider group"
                    >
                      ${priceMin || '0'} - ${priceMax || '∞'}
                      <span className="text-primary/40 group-hover:text-primary transition-colors">×</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveType('all');
                      setFilterLevel(null);
                      setPriceMin('');
                      setPriceMax('');
                    }}
                    className="text-xs font-black text-neutral-400 hover:text-accent-red px-2 py-1 transition-colors uppercase tracking-widest ml-1"
                  >
                    清除全部
                  </button>
                </div>
              )}

              {/* Sorting Button */}
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
                      onClick={() => setSortBy(opt.id as any)}
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

        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-card border border-neutral-100 dark:border-neutral-800 transition-colors space-y-6">
              {/* Product Type Filter */}
              <div>
                <div className="space-y-1">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(type.id)}
                      className={cn(
                        "w-full text-left px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-[13px] lg:text-sm font-black transition-all flex items-center justify-between group",
                        activeType === type.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                      )}
                    >
                      <span className="truncate">{type.name}</span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 lg:w-4 h-4 transition-transform -rotate-90 shrink-0",
                        activeType === type.id ? "text-white/50" : "text-neutral-300 group-hover:text-neutral-400"
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Filter */}
              <div>
                <div className="flex items-center gap-3 mb-3 lg:mb-4 px-1">
                  <h2 className="text-[12px] lg:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">賞別篩選</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFilterLevel(filterLevel === level.id ? null : level.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-black border transition-all",
                        filterLevel === level.id
                          ? "bg-accent-red text-white border-accent-red shadow-md shadow-accent-red/20"
                          : "bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
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
                      placeholder="min" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-2.5 py-2 text-center font-bold font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                    <span className="font-bold">-</span>
                    <input 
                      type="text" 
                      value={priceMax}
                      onChange={(e) => handlePriceChange(e.target.value, setPriceMax)}
                      placeholder="max" 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-2.5 py-2 text-center font-bold font-amount focus:outline-none focus:ring-2 focus:ring-primary/20" 
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
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="h-[280px]">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {filteredListings.map((item) => (
                  <MarketProductCard 
                    key={item.id} 
                    id={item.id}
                    name={item.product_prizes.name}
                    image={item.product_prizes.image_url}
                    price={item.price}
                    grade={item.product_prizes.level}
                    series={item.products.name}
                    sellerName={item.seller_name}
                    onClick={() => setSelectedListing(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="找不到獎項" 
                description="試試看調整篩選條件" 
                actionLabel="清除篩選"
                onAction={() => {
                  setActiveType('all');
                  setFilterLevel(null);
                  setPriceMin('');
                  setPriceMax('');
                }}
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
                  <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={selectedListing.product_prizes.image_url} 
                      alt={selectedListing.product_prizes.name}
                      className="w-full h-full object-cover"
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
