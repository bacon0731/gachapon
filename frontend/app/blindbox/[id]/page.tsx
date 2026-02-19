'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import ProductDetailSkeleton from '@/components/ProductDetailSkeleton';
import { PurchaseConfirmationModal } from '@/components/shop/PurchaseConfirmationModal';
import { ImageButton } from '@/components/ui/ImageButton';
import { GachaCollectionList } from '@/components/shop/GachaCollectionList';

type ProductRow = Database['public']['Tables']['products']['Row'];
type PrizeRow = Database['public']['Tables']['product_prizes']['Row'];

export default function BlindboxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [prizes, setPrizes] = useState<PrizeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<
    {
      id: string;
      name: string;
      grade: string;
      image_url?: string;
      ticket_number?: number;
      is_last_one?: boolean;
    }[]
  >([]);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [videoMode, setVideoMode] = useState<'trial' | 'purchase' | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idParam = params.id;
        const productId =
          typeof idParam === 'string' ? parseInt(idParam, 10) : parseInt(Array.isArray(idParam) ? idParam[0] : '', 10);
        if (!productId || Number.isNaN(productId)) {
          setIsLoading(false);
          return;
        }

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .neq('status', 'pending')
          .single();

        if (productError) throw productError;
        if (!productData) {
          setIsLoading(false);
          return;
        }

        if (productData.type !== 'blindbox') {
          router.replace(`/shop/${productId}`);
          return;
        }

        setProduct(productData);

        const { data: prizesData, error: prizesError } = await supabase
          .from('product_prizes')
          .select('*')
          .eq('product_id', productId)
          .order('level', { ascending: true });

        if (prizesError) throw prizesError;
        setPrizes(prizesData || []);
      } catch (err) {
        console.error('Error loading blindbox product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, supabase]);

  useEffect(() => {
    const baseWidth = 375;
    const maxWidth = 560;

    const updateScale = () => {
      if (typeof window === 'undefined') return;
      const width = Math.min(window.innerWidth, maxWidth);
      setScale(width / baseWidth);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const handlePlay = () => {
    if (!product) return;
    setIsPurchaseModalOpen(true);
  };

  const handleChangeBox = () => {
    router.push('/shop');
  };

  const handleTrial = () => {
    if (prizes.length > 0) {
      const index = Math.floor(Math.random() * prizes.length);
      const sample = prizes[index];
      setWonPrizes([
        {
          id: String(sample.id),
          name: sample.name,
          grade: sample.level || '',
          image_url: sample.image_url || undefined,
          ticket_number: undefined,
          is_last_one: false,
        },
      ]);
    }

    setVideoMode('trial');
    setIsVideoOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!product || !user) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('play_gacha', {
        p_product_id: product.id,
        p_count: quantity,
      });

      if (error) throw error;

      const rawResults = data as unknown as {
        name: string;
        grade: string;
        image_url: string;
        ticket_number?: number;
        is_last_one?: boolean;
      }[];

      const results = rawResults.map((item, index) => ({
        id: item.ticket_number !== undefined ? String(item.ticket_number) : `${product.id}-${index}`,
        name: item.name,
        grade: item.grade,
        image_url: item.image_url,
        ticket_number: item.ticket_number,
        is_last_one: item.is_last_one,
      }));

      setWonPrizes(results);
      setCollectionRefreshKey(prev => prev + 1);
      setIsPurchaseModalOpen(false);
      setVideoMode('purchase');
      setIsVideoOpen(true);
    } catch (e) {
      console.error('Blindbox purchase error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVideoEnd = () => {
    setIsVideoOpen(false);

    if (wonPrizes.length > 0 && videoMode !== null) {
      setIsPrizeModalOpen(true);
    }

    setVideoMode(null);
  };

  const handleVideoError = () => {
    setIsVideoOpen(false);

    if (wonPrizes.length > 0 && videoMode !== null) {
      setIsPrizeModalOpen(true);
    }

    setVideoMode(null);
  };

  const handlePrizeClose = () => {
    setIsPrizeModalOpen(false);
  };

  const handlePrizeGoToWarehouse = () => {
    setIsPrizeModalOpen(false);
    router.push(`/profile?tab=warehouse&product_id=${product?.id}`);
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center space-y-3">
          <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">找不到此盒玩商品</p>
          <Button onClick={() => router.push('/shop')} size="sm">
            返回商店
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32 md:pb-12 pt-14 md:pt-0">
      <div className="max-w-7xl mx-auto px-0 py-2 sm:px-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-6 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="w-full flex justify-center">
              <div
                className="relative"
                style={{
                  width: 375,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div className="bg-neutral-950 shadow-card border border-neutral-900 overflow-hidden">
                  <div className="relative w-full" style={{ aspectRatio: '750/932' }}>
                    <video
                      src="/videos/bg.mp4"
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />

                    <div
                      className="absolute left-1/2 -translate-x-1/2 text-center hidden md:block"
                      style={{ top: '17.2%' }}
                    >
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/80 text-white text-[11px] font-black uppercase tracking-widest shadow-md">
                        Blind Box
                      </div>
                      <div className="mt-2 px-4 max-w-[260px]">
                        <h1 className="text-lg sm:text-xl font-black text-white tracking-tight line-clamp-2">
                          {product.name}
                        </h1>
                      </div>
                    </div>

                    <ImageButton
                      src="/images/gacha/btn2.png"
                      alt="換一盒"
                      text="換一盒"
                      className="absolute"
                      textClassName="text-base md:text-lg"
                      style={{
                        left: '5.33%',
                        top: '84.5%',
                        width: '25.06%',
                        height: '11.2%',
                      }}
                      onClick={handleChangeBox}
                    />

                    <ImageButton
                      src="/images/gacha/btn1.png"
                      alt="立即開盒"
                      text="立即開盒"
                      className="absolute"
                      textClassName="text-base md:text-lg"
                      style={{
                        left: '31.73%',
                        top: '84.5%',
                        width: '36.53%',
                        height: '11.2%',
                      }}
                      onClick={handlePlay}
                    />

                    <ImageButton
                      src="/images/gacha/btn2.png"
                      alt="試試看"
                      text="試試看"
                      className="absolute"
                      textClassName="text-base md:text-lg"
                      style={{
                        left: '69.6%',
                        top: '84.5%',
                        width: '25.06%',
                        height: '11.2%',
                      }}
                      onClick={handleTrial}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[750px]">
                <GachaCollectionList
                  productId={product.id}
                  prizes={prizes}
                  refreshKey={collectionRefreshKey}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {product && (
        <PurchaseConfirmationModal
          isOpen={isPurchaseModalOpen}
          onClose={() => !isProcessing && setIsPurchaseModalOpen(false)}
          onConfirm={handlePurchaseConfirm}
          product={product}
          userPoints={user?.tokens || 0}
          isProcessing={isProcessing}
          onTopUp={() => router.push('/wallet')}
        />
      )}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black">
          <video
            src="/videos/blindbox-opening.mp4"
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
          />
        </div>
      )}
      {isPrizeModalOpen && (
        <div className="fixed inset-0 z-[2150] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handlePrizeClose} />
          <div className="relative z-[2151] w-full max-w-sm mx-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs font-black text-neutral-400 tracking-widest uppercase">恭喜獲得</div>
              <div className="text-lg font-black text-neutral-900 dark:text-neutral-50">
                {wonPrizes.length === 1 ? wonPrizes[0]?.name : `共 ${wonPrizes.length} 件獎品`}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[260px] overflow-y-auto custom-scrollbar">
              {wonPrizes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-2.5"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    {p.image_url && (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black text-white text-[11px] font-black tracking-widest">
                        {p.grade}
                      </span>
                      {p.ticket_number !== undefined && (
                        <span className="text-[11px] font-black text-neutral-400">
                          票號 {p.ticket_number}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-black text-neutral-900 dark:text-neutral-50 line-clamp-2">
                      {p.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="flex-1 h-[44px] rounded-xl text-sm font-black tracking-widest uppercase"
                onClick={handlePrizeGoToWarehouse}
              >
                前往倉庫
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-[44px] rounded-xl text-sm font-black tracking-widest uppercase"
                onClick={handlePrizeClose}
              >
                繼續開盒
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
