'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { BannerSkeleton } from '@/components/Skeletons';
import { Skeleton } from '@/components/ui/Skeleton';
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
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, bannersData] = await Promise.all([
          supabase.from('products').select('*').neq('status', 'pending').order('created_at', { ascending: false }),
          supabase.from('banners').select('*').order('sort_order', { ascending: true }).eq('is_active', true)
        ]);

        if (productsData.data) {
          setNewProducts(productsData.data.slice(0, 10));
          setHotProducts(productsData.data.filter(p => p.is_hot).slice(0, 10));
        }

        if (bannersData.data) {
          setBanners(bannersData.data);
        }
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
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
