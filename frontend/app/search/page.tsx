'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/ProductCard';
import type { Database } from '@/types/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

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
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .neq('status', 'pending')
          .order('is_hot', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Error fetching products for search:', error);
          setAllProducts([]);
          setHotKeywords([]);
          return;
        }

        const rows = (data as ProductRow[]) || [];
        setAllProducts(rows);

        const keywords = Array.from(
          new Set(
            rows
              .map((p) => p.name?.trim())
              .filter((name): name is string => !!name)
          )
        ).slice(0, 12);
        setHotKeywords(keywords);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
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

  const searchQueryParam = searchParams.get('q') || '';
  const focusParam = searchParams.get('focus') || '';

  useEffect(() => {
    setQuery(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    if (focusParam === '1') {
      setIsInputFocused(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [focusParam]);

  const trimmedQuery = query.trim();
  const visibleHistory = searchHistory.slice(0, 5);
  const showSuggestionPanel = isInputFocused && !trimmedQuery;

  useEffect(() => {
    setVisibleCount(10);
  }, [trimmedQuery]);

  const filteredProducts = trimmedQuery
    ? allProducts.filter((product) => {
        const name = product.name || '';
        return name.toLowerCase().includes(trimmedQuery.toLowerCase());
      })
    : allProducts;

  const handleSearchSubmit = (value?: string) => {
    const raw = (typeof value === 'string' ? value : query).trim();
    const params = new URLSearchParams(searchParams.toString());

    if (!raw) {
      setQuery('');
      setIsInputFocused(false);
      params.delete('q');
      params.delete('focus');
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : '/search');
      return;
    }

    setQuery(raw);
    saveHistory(raw);
    setIsInputFocused(false);
    params.set('q', raw);
    params.delete('focus');
    router.push(`/search?${params.toString()}`);
  };

  const mobileTitle = trimmedQuery ? `搜尋「${trimmedQuery}」的結果` : '猜你喜歡';

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-neutral-950 pb-20 transition-colors">
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 md:hidden">
        <div className="max-w-7xl mx-auto px-2 relative">
          <div className="flex items-center gap-3 h-[57px]">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-2 rounded-full text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </button>
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
                  className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full pl-9 pr-8 text-[16px] font-black text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  inputMode="search"
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

      <div className="max-w-7xl mx-auto px-2 pt-3 space-y-4">
        <div className="mt-1 md:hidden">
          <div className="flex items-baseline justify-between mb-2 px-0.5">
            <h2 className="text-[14px] sm:text-[15px] font-black text-neutral-900 dark:text-white tracking-tight">
              {mobileTitle}
            </h2>
            <span className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {isLoading ? '載入中...' : `${filteredProducts.length} 個商品`}
            </span>
          </div>

          {filteredProducts.length === 0 && !isLoading ? (
            <div className="py-10 text-center text-[13px] text-neutral-400 font-bold">
              {trimmedQuery ? '找不到相關商品，試試其他關鍵字' : '目前沒有商品'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {filteredProducts.slice(0, visibleCount).map((product) => (
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
              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 10)}
                    className="px-4 py-2 text-[13px] font-black text-primary bg-primary/5 rounded-full hover:bg-primary/10 transition-colors"
                  >
                    載入更多
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden md:block">
          <div className="mt-1">
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight px-0.5 mb-1.5">
              {mobileTitle}
            </h1>
            <div className="px-0.5 text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {isLoading ? (
                '載入中...'
              ) : (
                <>
                  <span className="font-amount">
                    {filteredProducts.length.toLocaleString()}
                  </span>{' '}
                  個商品
                </>
              )}
            </div>

            {filteredProducts.length === 0 && !isLoading ? (
              <div className="py-10 text-center text-[13px] text-neutral-400 font-bold">
                {trimmedQuery ? '找不到相關商品，試試其他關鍵字' : '目前沒有商品'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {filteredProducts.slice(0, visibleCount).map((product) => (
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
                {visibleCount < filteredProducts.length && (
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 10)}
                      className="px-4 py-2 text-[13px] font-black text-primary bg-primary/5 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      載入更多
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
