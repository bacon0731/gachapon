'use client';

import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import ProductDetailSkeleton from '@/components/ProductDetailSkeleton';
import { PurchaseConfirmationModal } from '@/components/shop/PurchaseConfirmationModal';
import { ImageButton } from '@/components/ui/ImageButton';
import { GachaCollectionList } from '@/components/shop/GachaCollectionList';
import { GachaResultModal } from '@/components/shop/GachaResultModal';
import type { Prize as GachaPrize } from '@/components/GachaMachine';

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
  const [bgVariantIndex, setBgVariantIndex] = useState(0);
  const bgVideos = ['/videos/bg.mp4'];
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const openingVideoRef = useRef<HTMLVideoElement | null>(null);

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

  const replayBackgroundVideo = () => {
    const el = bgVideoRef.current;
    if (!el) return;
    try {
      el.currentTime = 0;
      el.play().catch(() => undefined);
    } catch {
    }
  };

  const handlePlay = () => {
    if (!product) return;
    setIsPurchaseModalOpen(true);
  };

  const handleChangeBox = () => {
    setBgVariantIndex((prev) => (prev + 1) % bgVideos.length);
    replayBackgroundVideo();
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
      setCollectionRefreshKey((prev) => prev + 1);
    }

    setVideoMode(null);
    setIsVideoMuted(true);
  };

  const handleVideoError = () => {
    setIsVideoOpen(false);

    if (wonPrizes.length > 0 && videoMode !== null) {
      setIsPrizeModalOpen(true);
      setCollectionRefreshKey((prev) => prev + 1);
    }

    setVideoMode(null);
    setIsVideoMuted(true);
  };

  const handlePrizeClose = () => {
    setIsPrizeModalOpen(false);
    replayBackgroundVideo();
  };

  const blindboxResults: GachaPrize[] = wonPrizes.map(p => ({
    id: p.id,
    name: p.name,
    rarity: p.grade,
    image_url: p.image_url,
    grade: p.grade,
    is_last_one: p.is_last_one,
  }));

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
      <div className="max-w-7xl mx-auto px-0 pb-2 sm:px-2 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6 items-start">
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
                      ref={bgVideoRef}
                      src={bgVideos[bgVariantIndex]}
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
        <div className="fixed inset-0 z-[2100] bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={openingVideoRef}
              src="/videos/blindbox_op.mp4"
              className="w-full h-full object-contain"
              autoPlay
              muted={isVideoMuted}
              playsInline
              onEnded={handleVideoEnd}
              onError={handleVideoError}
            />
            <button
              type="button"
              className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white"
              onClick={() => {
                setIsVideoMuted((prev) => {
                  const next = !prev;
                  const el = openingVideoRef.current;
                  if (el) {
                    el.muted = next;
                    if (!next) {
                      el.play().catch(() => undefined);
                    }
                  }
                  return next;
                });
              }}
            >
              {isVideoMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-16 px-4 border-t border-white/10 bg-black/80 flex items-center justify-center z-10">
              <button
                type="button"
                className="w-full max-w-xs h-11 rounded-full bg-white/90 text-black text-base font-black tracking-[0.2em]"
                onClick={handleVideoEnd}
              >
                跳過
              </button>
            </div>
          </div>
        </div>
      )}
      {isPrizeModalOpen && (
        <GachaResultModal
          isOpen={isPrizeModalOpen}
          onClose={handlePrizeClose}
          results={blindboxResults}
        />
      )}
    </div>
  );
}
