'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { BannerSkeleton } from '@/components/Skeletons';
import { Skeleton } from '@/components/ui/Skeleton';
import HeroBanner from '@/components/HeroBanner';
import { ArrowRight, Flame, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [hotProducts, setHotProducts] = useState<Database['public']['Tables']['products']['Row'][]>([]);
  const [newProducts, setNewProducts] = useState<Database['public']['Tables']['products']['Row'][]>([]);
  const [banners, setBanners] = useState<Database['public']['Tables']['banners']['Row'][]>([]);
  const [news, setNews] = useState<Database['public']['Tables']['news']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [bannersRes, newsRes, hotRes, newRes] = await Promise.all([
          supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('news').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(5),
          supabase.from('products').select('*').eq('is_hot', true).eq('status', 'active').limit(10),
          supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(10)
        ]);

        if (bannersRes.data) setBanners(bannersRes.data);
        if (newsRes.data) setNews(newsRes.data);
        if (hotRes.data) setHotProducts(hotRes.data);
        if (newRes.data) setNewProducts(newRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 pt-2 sm:pt-4">
        {/* Hero Section */}
        <section className="mb-2 sm:mb-6">
          {isLoading ? (
            <BannerSkeleton />
          ) : (
            <HeroBanner banners={banners.map(b => ({
              id: b.id,
              image: b.image_url,
              link: b.link_url || '#'
            }))} />
          )}
        </section>

        {/* Announcement Marquee */}
        <div className="mb-6 h-[40px] bg-primary/5 border border-primary/10 rounded-2xl px-1.5 flex items-center gap-3 overflow-hidden shadow-soft dark:bg-blue-900/10 dark:border-blue-900/20">
          <div className="flex-shrink-0 bg-primary text-white p-1.5 rounded-xl shadow-sm">
            <Megaphone className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
             {isLoading ? (
               <Skeleton className="h-4 w-3/4 bg-neutral-200/50 dark:bg-neutral-700/50" />
             ) : (
               <div className="absolute whitespace-nowrap animate-marquee flex items-center text-[13px] text-neutral-600 dark:text-neutral-300 font-bold tracking-tight">
                 {news.length > 0 ? (
                   news.map((item, index) => (
                     <span key={item.id} className="mr-8">
                       {item.title} {index < news.length - 1 ? '🎉' : ''}
                     </span>
                   ))
                 ) : (
                   "歡迎來到一番賞線上抽獎平台！新會員註冊即送 100 代幣 🎉 全館滿千免運費！ 🎊 本週五晚上 8 點直播開箱新品，敬請鎖定！ ✨ 系統維護通知：1/28 凌晨 2:00 - 4:00 進行例行維護。"
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Hot Products */}
        <section className="mb-6 sm:mb-12">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-red fill-current" />
              熱門商品
            </h2>
            <Link href="/shop" className="text-[13px] font-black text-neutral-400 dark:text-neutral-500 hover:text-primary uppercase tracking-widest flex items-center transition-colors">
              查看全部 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-[280px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              hotProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  name={product.name}
                  image={product.image_url || ''}
                  price={product.price}
                />
              ))
            )}
          </div>
        </section>

        {/* New Products */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="text-xl">✨</span>
              最新上架
            </h2>
            <Link href="/shop" className="text-[13px] font-black text-neutral-400 dark:text-neutral-500 hover:text-primary uppercase tracking-widest flex items-center transition-colors">
              查看全部 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-[280px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              newProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  name={product.name}
                  image={product.image_url || ''}
                  price={product.price}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
