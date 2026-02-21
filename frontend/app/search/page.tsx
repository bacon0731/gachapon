'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/ProductCard';
import type { Database } from '@/types/database.types';

const HOT_SEARCHES = ['航海王', '七龍珠', '鬼滅之刃', 'SPY×FAMILY', '寶可夢', '進擊的巨人', '鏈鋸人', '約定的夢幻島', '東京復仇者', '排球少年'];

type ProductRow = Database['public']['Tables']['products']['Row'];

export default function SearchPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [hotProducts, setHotProducts] = useState<ProductRow[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

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
    const fetchHot = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_hot', true)
        .neq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.error('Error fetching hot products:', error);
        setHotProducts([]);
      } else {
        setHotProducts((data as ProductRow[]) || []);
      }
    };
    fetchHot();
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

  const runSearch = async (keyword: string, saveToHistory: boolean) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    if (saveToHistory) {
      saveHistory(trimmed);
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('status', 'pending')
        .ilike('name', `%${trimmed}%`)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        console.error('Error searching products:', error);
        setProducts([]);
      } else {
        setProducts((data as ProductRow[]) || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      return;
    }
    const id = setTimeout(() => {
      runSearch(trimmed, false);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const handleSubmit = async (value?: string) => {
    const raw = typeof value === 'string' ? value : query;
    setQuery(raw);
    await runSearch(raw, true);
  };

  const trimmedQuery = query.trim();

  const showHotProducts = !trimmedQuery;

  const suggestionItems = [
    ...searchHistory.map((term) => ({ type: 'history' as const, term })),
    ...HOT_SEARCHES.map((term) => ({ type: 'hot' as const, term })),
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-neutral-950 pb-20 transition-colors">
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-2 py-2 flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[2.5]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="搜尋想抽的商品..."
                className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full pl-9 pr-8 text-[13px] font-black text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setProducts([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 h-9 rounded-full bg-primary text-white text-[12px] font-black whitespace-nowrap active:scale-95 transition-transform"
            >
              搜尋
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 pt-3 space-y-4">
        {/* 建議列表區：未 focus 顯示原來兩區，focus 時顯示直式列表 */}
        {!isFocused ? (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-[12px] font-black text-neutral-400 uppercase tracking-widest">
                歷史紀錄
              </h2>
              {searchHistory.length === 0 ? (
                <p className="text-[12px] text-neutral-400 font-bold">
                  目前沒有搜尋紀錄
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        handleSubmit(term);
                      }}
                      className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12px] font-black text-neutral-700 dark:text-neutral-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-[12px] font-black text-neutral-400 uppercase tracking-widest">
                熱門關鍵字
              </h2>
              <div className="flex flex-wrap gap-2">
                {HOT_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      handleSubmit(term);
                    }}
                    className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12px] font-black text-neutral-700 dark:text-neutral-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          suggestionItems.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              {suggestionItems.map((item) => (
                <button
                  key={`${item.type}-${item.term}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(item.term);
                    handleSubmit(item.term);
                  }}
                  className="w-full flex items-center px-3 py-2.5 text-left text-[13px] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {item.type === 'history' && (
                    <Clock className="w-3.5 h-3.5 mr-2 text-neutral-400 stroke-[2.5]" />
                  )}
                  <span className="truncate">{item.term}</span>
                </button>
              ))}
            </div>
          )
        )}

        {/* 商品列表區：預設熱門商品，輸入文字後即時顯示搜尋結果 */}
        <div className="mt-1">
          <div className="flex items-baseline justify-between mb-2 px-0.5">
            <h2 className="text-[14px] sm:text-[15px] font-black text-neutral-900 dark:text-white tracking-tight">
              {showHotProducts ? '熱門商品' : `搜尋「${trimmedQuery}」的結果`}
            </h2>
            <span className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {isLoading
                ? '載入中...'
                : showHotProducts
                ? `${hotProducts.length} 個商品`
                : `${products.length} 個商品`}
            </span>
          </div>

          {showHotProducts ? (
            hotProducts.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-neutral-400 font-bold">
                目前沒有熱門商品
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {hotProducts.map((product) => (
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
            )
          ) : products.length === 0 && !isLoading ? (
            <div className="py-10 text-center text-[13px] text-neutral-400 font-bold">
              找不到相關商品，試試其他關鍵字
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {products.map((product) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
