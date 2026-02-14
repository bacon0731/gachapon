'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { BannerSkeleton } from '@/components/Skeletons';
import HeroBanner from '@/components/HeroBanner';
import WinningMarquee from '@/components/WinningMarquee';
import { ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [hotProducts, setHotProducts] = useState<Database['public']['Tables']['products']['Row'][]>([]);
  const [newProducts, setNewProducts] = useState<Database['public']['Tables']['products']['Row'][]>([]);
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
        <WinningMarquee />

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
              hotProducts.map((product) => (
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
              newProducts.map((product) => (
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
