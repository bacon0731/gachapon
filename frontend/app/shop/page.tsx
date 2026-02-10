'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Filter, SlidersHorizontal, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const supabase = createClient();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          supabase.from('products').select('*, product_tags(category_id)'),
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
        ]);

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;

        // Transform the data to match the expected type if needed, 
        // though Supabase return should match if relation exists
        setProducts(productsRes.data as any || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const allCategories = useMemo(() => [
    { id: 'all', name: '全部商品', sort_order: -1, is_active: true, created_at: '' },
    ...categories
  ], [categories]);

  const productTypes = [
    { id: 'all', name: '全部商品' },
    { id: 'ichiban', name: '一番賞' },
    { id: 'blindbox', name: '盒玩' },
    { id: 'gacha', name: '轉蛋' },
    { id: 'custom', name: '自製賞' },
  ];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by type
    if (activeType !== 'all') {
      result = result.filter((p) => p.type === activeType);
    }

    // Filter by category (Tag)
    if (activeCategory !== 'all') {
      result = result.filter((p) => 
        p.product_tags?.some(tag => tag.category_id === activeCategory)
      );
    }

    // Filter by search
    if (searchQuery) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    // Default newest (by created_at or id if created_at is not reliable for sorting in this context, 
    // but here we assume generic newest logic. If products have created_at, we can use it)
    if (sortBy === 'newest') {
        // Assuming higher ID is newer or use created_at if available and consistent
        // The original mock logic didn't explicitly handle 'newest' sort implementation details other than default
        // Let's stick to default order or add explicit sort if needed.
        // For now, let's just reverse if it was naturally ordered by ID asc
        // or actually, supabase returns in insertion order usually.
        // Let's sort by created_at desc if available
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [activeCategory, activeType, searchQuery, sortBy, products, categories]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localSearch) params.set('search', localSearch);
    else params.delete('search');
    router.push(`/shop?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocalSearch('');
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-6">
        {/* 1. Mobile Search & Sort Row */}
        <div className="md:hidden flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            {/* Search Box with integrated Tags */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors">
                  <Search className="w-4 h-4 stroke-[3]" />
                </div>
                
                <div className="flex items-center gap-1.5 pl-10 pr-10 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-soft focus-within:border-primary/30 transition-all overflow-x-auto scrollbar-hide">
                  {/* Category Tag inside Search Box */}
                  {activeCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('all')}
                      className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black bg-primary/10 text-primary border border-primary/10 uppercase tracking-wider"
                    >
                      {allCategories.find((c) => c.id === activeCategory)?.name}
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  
                  <input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={activeCategory === 'all' ? "搜尋商品..." : ""}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] font-black placeholder:text-neutral-400 min-w-[80px] text-neutral-900 dark:text-white"
                  />
                </div>

                {/* Clear All Button inside Search Box */}
                {(activeCategory !== 'all' || localSearch) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-300 hover:text-accent-red transition-colors"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Sort Icon Only */}
            <div className="relative group">
              <button className="flex items-center justify-center w-11 h-11 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-neutral-600 dark:text-neutral-400 shadow-soft active:scale-95 transition-all">
                <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-3xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-right scale-95 group-hover:scale-100">
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

        {/* Mobile Type Tabs (Scrollable) */}
        <div className="md:hidden -mx-2 px-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-2">
            {productTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-black transition-all border active:scale-95",
                  activeType === type.id
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                    : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mobile Category Tabs (Scrollable) */}
        <div className="md:hidden -mx-2 px-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-black transition-all border active:scale-95",
                  activeCategory === cat.id
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                    : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
              >
                {cat.name}
              </button>
            ))}
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

        {/* 4. Product Grid & Sidebar */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-card border border-neutral-100 dark:border-neutral-800 transition-colors space-y-6">
              {/* Unified Menu */}
              <div>
                <div className="flex items-center gap-3 mb-3 lg:mb-4 px-1">
                  <Filter className="w-4 h-4 text-primary stroke-[2.5]" />
                  <h2 className="text-[12px] lg:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">商品列表</h2>
                </div>
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
          <div className="flex-1 w-full">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="h-[280px]">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    id={product.id.toString()}
                    name={product.name}
                    image={product.image_url || ''}
                    price={product.price}
                    isHot={product.is_hot}
                    category={product.category}
                    remaining={product.remaining}
                    total={product.total_count}
                    type={product.type}
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
