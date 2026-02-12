'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui';
import ProductDetailSkeleton from '@/components/ProductDetailSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Share2, Heart, ShieldCheck, Info, Trophy, FileCheck, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Modal } from '@/components/ui/Modal';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ProductBadge from '@/components/ui/ProductBadge';
import Image from 'next/image';

import { PurchaseConfirmationModal } from '@/components/shop/PurchaseConfirmationModal';
import GachaMachine, { Prize } from '@/components/GachaMachine';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  const [product, setProduct] = useState<Database['public']['Tables']['products']['Row'] | null>(null);
  const [prizes, setPrizes] = useState<Database['public']['Tables']['product_prizes']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFollowed, setIsFollowed] = useState(false);
  const [viewingPrize, setViewingPrize] = useState<{ name: string; image_url?: string; level: string; total: number; remaining: number } | null>(null);
  const [recommendations, setRecommendations] = useState<Database['public']['Tables']['products']['Row'][]>([]);
  
  // Purchase Flow State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<Prize[]>([]);

  // Result Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [drawResults, setDrawResults] = useState<{ ticket_number: number; prize_level: string; prize_name: string }[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  useEffect(() => {
    if (!user || !product) return;

    const checkFollowStatus = async () => {
      const { count } = await supabase
        .from('product_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      
      setIsFollowed(!!count);
    };

    checkFollowStatus();
  }, [user, product, supabase]);

  const handleFollowToggle = async () => {
    if (!user || !product) {
      router.push('/login');
      return;
    }

    // Optimistic update
    const newStatus = !isFollowed;
    setIsFollowed(newStatus);

    try {
      if (newStatus) {
        const { error } = await supabase
          .from('product_follows')
          .insert({ user_id: user.id, product_id: product.id });
        if (error) throw error;
        showToast('已加入關注清單', 'success');
      } else {
        const { error } = await supabase
          .from('product_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) throw error;
        showToast('已取消關注', 'success');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowed(!newStatus);
      showToast('操作失敗，請稍後再試', 'error');
    }
  };

  const handleShowResults = async () => {
    setShowResultModal(true);
    if (drawResults.length > 0 || !product) return;

    setIsLoadingResults(true);
    try {
      const { data, error } = await supabase
        .from('draw_records')
        .select('ticket_number, prize_level, prize_name')
        .eq('product_id', product.id)
        .order('ticket_number', { ascending: true });

      if (error) throw error;
      
      // Sort results to put Last One at the end
      const sortedData = (data || []).sort((a, b) => {
        const isALastOne = a.prize_level.includes('Last One') || a.prize_level.includes('LAST ONE') || a.ticket_number === 0;
        const isBLastOne = b.prize_level.includes('Last One') || b.prize_level.includes('LAST ONE') || b.ticket_number === 0;
        
        if (isALastOne && !isBLastOne) return 1;
        if (!isALastOne && isBLastOne) return -1;
        return a.ticket_number - b.ticket_number;
      });

      setDrawResults(sortedData);
    } catch (error) {
      console.error('Error fetching results:', error);
      showToast('無法載入抽獎結果', 'error');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleDrawClick = () => {
    // Check product type for Ichiban flow
    if (product?.type === 'ichiban') {
      router.push(`/shop/${params.id}/select`);
      return;
    }

    // [GA] Track begin_checkout event
    console.log('[GA] event: begin_checkout', { items: [{ item_id: product?.id, item_name: product?.name }] });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!product || !user) return;
    
    setIsProcessing(true);
    try {
      // [GA] Track purchase attempt
      console.log('[GA] event: purchase_attempt', { item_id: product.id, quantity });
      
      const { data, error } = await supabase.rpc('play_gacha', {
        p_product_id: product.id,
        p_count: quantity
      });

      if (error) throw error;

      interface PlayGachaResult {
        id: string;
        name: string;
        grade: string;
        image_url: string;
        ticket_number?: number;
      }

      // Transform result to Prize format for GachaMachine
      const rawResults = data as unknown as PlayGachaResult[];
      const results = rawResults.map(item => ({
        id: item.id,
        name: item.name,
        rarity: item.grade, // Map grade to rarity
        image_url: item.image_url,
        grade: item.grade
      }));

      // [GA] Track purchase success
      console.log('[GA] event: purchase', { 
        transaction_id: rawResults[0]?.ticket_number, // using first ticket as ref
        value: product.price * quantity,
        currency: 'G',
        items: results.map(r => ({ item_id: r.id, item_name: r.name, item_category: r.grade }))
      });

      setWonPrizes(results);
      setIsPurchaseModalOpen(false);
      setIsGachaOpen(true);
      
      // Update local user points/tokens if possible, or wait for context update
      // The context usually updates on its own or we can force it if exposed
      
    } catch (error: unknown) {
      console.error('Purchase error:', error);
      // [GA] Track purchase error
      const errorMessage = error instanceof Error ? error.message : '購買失敗';
      console.log('[GA] event: purchase_error', { error: errorMessage });
      showToast(errorMessage || '購買失敗，請稍後再試', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGachaComplete = () => {
    // Navigate to warehouse with product filter
    router.push(`/warehouse?product_id=${params.id}`);
  };

  const handleGachaContinue = () => {
    setIsGachaOpen(false);
    setWonPrizes([]);
    // Optional: Refresh product data
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productId = parseInt(params.id as string);
        if (isNaN(productId)) return;

        // Fetch Product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .neq('status', 'pending')
          .single();
        
        if (productError) throw productError;
        setProduct(productData);

        // Fetch Prizes
        const { data: prizesData, error: prizesError } = await supabase
          .from('product_prizes')
          .select('*')
          .eq('product_id', productId)
          .order('level', { ascending: true });
        
        if (prizesError) throw prizesError;
        setPrizes(prizesData || []);

        // Fetch Recommendations
        const { data: recData } = await supabase
          .from('products')
          .select('*')
          .neq('id', productId)
          .eq('status', 'active')
          .limit(4);
        
        if (recData) setRecommendations(recData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, supabase]);

  // Realtime subscription for inventory updates
  useEffect(() => {
    const productId = parseInt(params.id as string);
    if (isNaN(productId)) return;

    console.log('Setting up realtime subscription for product:', productId);

    const channel = supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const newProduct = payload.new as Database['public']['Tables']['products']['Row'];
          setProduct((prev) => (prev ? { ...prev, ...newProduct } : null));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_prizes',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const newPrize = payload.new as Database['public']['Tables']['product_prizes']['Row'];
          
          setPrizes((prev) => {
            // Find the prize to compare remaining count
            const currentPrize = prev.find(p => p.id === newPrize.id);
            
            // If prize exists and remaining count decreased, show toast
            if (currentPrize && newPrize.remaining < currentPrize.remaining) {
              // Use setTimeout to avoid state update warning during render phase
              setTimeout(() => {
                showToast(
                  <span className="flex items-center gap-2">
                    <span className="bg-accent-red text-white text-[10px] px-1.5 py-0.5 rounded font-black">{newPrize.level}賞</span>
                    <span>被抽走了！剩餘 {newPrize.remaining} 個</span>
                  </span>,
                  'info'
                );
              }, 0);
            }

            return prev.map((prize) =>
              prize.id === newPrize.id ? { ...prize, ...newPrize } : prize
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, supabase, showToast]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mb-2">找不到商品</h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-bold mb-6">您查看的商品可能已經下架或不存在。</p>
        <Link href="/shop">
          <Button size="lg">返回商店</Button>
        </Link>
      </div>
    );
  }

  // Calculate total remaining items from real prizes
  // Filter out Last One prize from the count as it's a bonus, not a ticket
  const validPrizes = prizes.filter(p => 
    p.level !== 'Last One' && 
    p.level !== 'LAST ONE' && 
    !p.level.includes('最後賞')
  );
  
  // If no prizes found yet (loading or empty), fallback to product data
  // But usually we should trust prizes if loaded
  const totalRemaining = prizes.length > 0 
    ? validPrizes.reduce((acc, prize) => acc + prize.remaining, 0)
    : product.remaining;

  const totalItems = prizes.length > 0
    ? validPrizes.reduce((acc, prize) => acc + prize.total, 0)
    : product.total_count;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32 md:pb-12 pt-14 md:pt-0">
      <div className="max-w-7xl mx-auto px-2 py-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-6 items-start">
          {/* Left Column: Product Card (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-card border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              {/* Image Section */}
              <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800">
                <div className="w-full h-full flex items-center justify-center text-white/20 group-hover:scale-105 transition-transform duration-500">
                    <Image 
                      src={product.image_url || '/images/item.png'} 
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                </div>
                
                {/* Status Badges & Action Buttons */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between pointer-events-none">
                  <div className="flex flex-col gap-1.5">
                    {product.is_hot && <ProductBadge type="hot" />}
                  </div>
                  <div>
                    <ProductBadge type={product.type} />
                  </div>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-3 sm:p-6 space-y-2 sm:space-y-5">
                <h1 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 leading-tight tracking-tight">
                  {product.name}
                </h1>
                
                <div className="hidden lg:flex items-end justify-between gap-2 pb-5 border-b border-neutral-50 dark:border-neutral-800">
                  <div className="flex items-baseline gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-yellow shadow-sm">
                      <span className="text-sm text-white font-black leading-none">G</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-accent-red font-amount tracking-tighter leading-none">{product.price.toLocaleString()}</span>
                      <span className="text-sm text-neutral-400 font-black uppercase tracking-widest">/ 抽</span>
                    </div>
                  </div>
                  <div className="text-sm font-black text-neutral-500 leading-none mb-1 text-right">
                    優惠前：<span className="line-through font-amount">{Math.round(product.price * 1.2).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={totalRemaining === 0 ? handleShowResults : handleDrawClick}
                      size="lg"
                      className={cn(
                        "flex-1 h-[44px] text-lg font-black rounded-xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                        totalRemaining === 0 
                          ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-neutral-900/20"
                          : "shadow-accent-red/20"
                      )}
                      variant={totalRemaining === 0 ? "secondary" : "danger"}
                      disabled={false}
                    >
                      {totalRemaining === 0 ? '已完抽 (查看結果)' : (product.type === 'ichiban' ? '立即抽獎' : '立即轉蛋')}
                    </Button>

                    <button className="w-[44px] h-[44px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-primary hover:border-primary/50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95">
                      <Share2 className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    
                    <button 
                      onClick={handleFollowToggle}
                      className={cn(
                        "w-[44px] h-[44px] rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 border",
                        isFollowed 
                          ? "bg-accent-red text-white border-accent-red shadow-accent-red/20" 
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-accent-red hover:border-accent-red/50"
                      )}
                    >
                      <Heart className={cn("w-5 h-5 stroke-[2.5]", isFollowed && "fill-current")} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Odds, Fairness, Info, Recommendations */}
          <div className="lg:col-span-8 space-y-2 sm:space-y-5">
            {/* Store Odds Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-card border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="p-2 sm:p-4 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/30">
                <h2 className="text-sm sm:text-lg font-black text-neutral-900 dark:text-neutral-50 tracking-tight uppercase tracking-wider">店家配率表</h2>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50/50 dark:bg-neutral-800/50 text-[13px] sm:text-sm font-black text-neutral-400 dark:text-neutral-500 border-b border-neutral-50 dark:border-neutral-800">
                    <tr>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 uppercase tracking-widest">獎項名稱</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-right uppercase tracking-widest">剩餘 / 總數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                    {prizes.map((prize, index) => (
                      <tr 
                        key={index} 
                        className={cn(
                          "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer",
                          prize.remaining === 0 && "opacity-50"
                        )}
                        onClick={() => setViewingPrize({
                          name: prize.name,
                          image_url: prize.image_url || undefined,
                          level: prize.level,
                          total: prize.total,
                          remaining: prize.remaining
                        })}
                      >
                        <td className="px-2 sm:px-6 py-2 sm:py-3.5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-[13px] text-primary font-black uppercase tracking-widest bg-primary/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-primary/10 whitespace-nowrap">
                              {prize.level}賞
                            </span>
                            <div className="font-black text-neutral-900 dark:text-neutral-50 text-[13px] sm:text-sm leading-tight tracking-tight whitespace-nowrap">{prize.name}</div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-3.5 text-right">
                          <span className="font-black text-sm sm:text-base tracking-tighter text-neutral-900 dark:text-neutral-50">
                            {prize.remaining.toLocaleString()}<span className="text-neutral-200 dark:text-neutral-700 mx-1">/</span>{prize.total.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-neutral-50 dark:border-neutral-800">
                    <tr className="bg-accent-red/5 dark:bg-accent-red/10">
                      <td className="px-2 sm:px-6 py-2 sm:py-4 font-black text-accent-red text-sm sm:text-base tracking-widest uppercase">合計</td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-right">
                        <span className="text-lg sm:text-2xl font-black text-accent-red tracking-tighter">
                          {totalRemaining.toLocaleString()}<span className="text-accent-red/30 mx-1">/</span>{totalItems.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Fairness Verification Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-card border border-neutral-100 dark:border-neutral-800 p-3 sm:p-6 space-y-3 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 border-b border-neutral-50 dark:border-neutral-800 pb-3 sm:pb-5">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent-emerald/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-accent-emerald stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">公平性驗證</h2>
                  <p className="text-[13px] sm:text-sm text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-widest mt-0.5">確保抽獎過程的透明與公正</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-primary font-black text-[13px] sm:text-sm uppercase tracking-widest">
                  <Info className="w-3.5 h-3.5 stroke-[3]" />
                  第三方驗證工具
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Link href="#" className="text-[13px] sm:text-sm text-accent-red font-black hover:text-accent-red/80 transition-colors flex items-center gap-1.5 group">
                    SHA256 哈希驗證工具 
                    <Share2 className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <p className="text-[13px] sm:text-sm text-neutral-500 dark:text-neutral-400 font-bold leading-relaxed">
                    此工具可驗證 TXID 與 TXID Hash 的一致性，確保公平性，TXID 將於完抽後公布。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 pt-1 sm:pt-2">
                <div className="space-y-1.5 sm:space-y-2.5">
                  <div className="text-[13px] sm:text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5" /> 隨機種子 (TXID)
                  </div>
                  <div className={cn(
                    "bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-[13px] sm:text-sm font-black tracking-widest uppercase",
                    (totalRemaining === 0 && product.seed) ? "text-neutral-600 dark:text-neutral-400 font-amount break-all" : "text-neutral-400 dark:text-neutral-500"
                  )}>
                    {(totalRemaining === 0 && product.seed) ? product.seed : '完抽後公布'}
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2.5">
                  <div className="text-[13px] sm:text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5" /> 哈希值 (TXID Hash)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-[13px] sm:text-sm font-amount text-neutral-600 dark:text-neutral-400 truncate font-bold leading-relaxed">
                      {product.txid_hash || 'Hash generating...'}
                    </code>
                    <button className="p-3 sm:p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl text-neutral-400 dark:text-neutral-500 transition-colors shrink-0 group shadow-soft bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                      <Copy className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Meta Info */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-card border border-neutral-100 dark:border-neutral-800 p-3 sm:p-6 space-y-3 sm:space-y-6">
              <h3 className="font-black text-neutral-900 dark:text-neutral-50 text-base sm:text-xl tracking-tight border-b border-neutral-50 dark:border-neutral-800 pb-3 sm:pb-5">商品資訊</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-5 gap-x-12">
                <div className="flex justify-between items-center text-sm py-1 sm:py-2 border-b border-dashed border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[13px] sm:text-[13px]">上市時間</span>
                  <span className="text-neutral-900 dark:text-neutral-50 font-black">
                    {product.release_date ? new Date(product.release_date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }) : '未定'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 sm:py-2 border-b border-dashed border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[13px] sm:text-[13px]">代理商</span>
                  <span className="text-neutral-900 dark:text-neutral-50 font-black">萬代南夢宮娛樂</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 sm:py-2 border-b border-dashed border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[13px] sm:text-[13px]">稀有度</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-2 h-4 sm:w-2.5 sm:h-5 bg-accent-red rounded-sm shadow-sm shadow-accent-red/20" />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 sm:pt-6 mt-3 sm:mt-6 border-t border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 -mx-3 sm:-mx-6 px-3 sm:px-6 pb-3 sm:pb-6 rounded-b-[24px] sm:rounded-b-[32px]">
                <h4 className="text-[13px] sm:text-[13px] font-black text-neutral-900 dark:text-neutral-50 mb-2 sm:mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-yellow fill-current" />
                  抽獎注意事項
                </h4>
                <ul className="text-[13px] sm:text-sm text-neutral-500 dark:text-neutral-400 space-y-2 sm:space-y-3.5 font-bold">
                  <li className="flex gap-2 sm:gap-3">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent-red mt-1.5 shrink-0" />
                    <span>每抽價格為 <div className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-accent-yellow shadow-sm mx-0.5 sm:mx-1"><span className="text-[13px] sm:text-[11px] text-white font-black">G</span></div> <span className="text-neutral-900 dark:text-neutral-50 font-black font-amount text-sm sm:text-base leading-none">{product.price.toLocaleString()}</span>，抽獎結果隨機產生。</span>
                  </li>
                  <li className="flex gap-2 sm:gap-3">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent-red mt-1.5 shrink-0" />
                    <span>所有獎項均為正版授權商品，請放心抽選。</span>
                  </li>
                  <li className="flex gap-2 sm:gap-3">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent-red mt-1.5 shrink-0" />
                    <span>商品庫庫存會即時更新，售完為止。</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="pt-2 sm:pt-8">
              <div className="flex items-center justify-between mb-2 sm:mb-8 px-1">
                <h2 className="text-base sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">猜你喜歡</h2>
                <Link href="/shop" className="text-[13px] sm:text-sm font-black text-primary hover:text-primary/80 uppercase tracking-widest">查看更多</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-5">
                {recommendations.map((item) => (
                  <ProductCard 
                    key={item.id} 
                    id={item.id}
                    name={item.name}
                    image={item.image_url || ''}
                    price={item.price}
                    remaining={item.remaining}
                    total={item.total_count}
                    isHot={item.is_hot || false}
                    category={item.category || ''}
                    type={item.type}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Image Modal */}
      <Modal
        isOpen={!!viewingPrize}
        onClose={() => setViewingPrize(null)}
        title="獎項詳情"
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-card max-h-[50vh] mx-auto">
            <Image 
              src={viewingPrize?.image_url || '/images/item.png'} 
              alt={viewingPrize?.name || 'Prize'} 
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 bg-primary text-white text-[13px] font-black rounded-lg shadow-sm uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                  {viewingPrize?.level}賞
                </span>
                <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 truncate tracking-tight">
                  {viewingPrize?.name}
                </h3>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[13px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">剩餘 / 總數</div>
                <div className="text-xl font-black text-neutral-900 dark:text-white leading-none tracking-tighter">
                  {viewingPrize?.remaining?.toLocaleString()}<span className="text-neutral-300 mx-1">/</span>{viewingPrize?.total?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setViewingPrize(null)}
            className="w-full py-5 text-base font-black bg-neutral-900 dark:bg-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-600 rounded-2xl transition-all active:scale-[0.98]"
          >
            關閉視窗
          </Button>
        </div>
      </Modal>

      {/* Mobile Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 h-auto min-h-16 px-4 pb-safe pt-2 flex items-center lg:hidden z-50 shadow-modal">
        <div className="flex items-center gap-4 w-full pb-2">
          <div className="flex flex-col items-center justify-center pl-2">
            <div className="text-[13px] font-black text-neutral-500 dark:text-neutral-400 leading-none mb-1 whitespace-nowrap">
              優惠前：<span className="line-through font-amount">{Math.round(product.price * 1.2).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-accent-yellow shadow-sm">
                <span className="text-[13px] text-white font-black leading-none">G</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[28px] font-black text-accent-red font-amount leading-none tracking-tighter">{product.price.toLocaleString()}</span>
                <span className="text-sm font-black text-neutral-400 dark:text-neutral-500 leading-none uppercase tracking-widest">/抽</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={product.remaining === 0 ? handleShowResults : handleDrawClick}
            size="lg"
            className={cn(
              "flex-1 h-[44px] text-base font-black rounded-xl shadow-xl transition-all active:scale-[0.95]",
              product.remaining === 0 
                ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-neutral-900/20"
                : "shadow-accent-red/20"
            )}
            variant={product.remaining === 0 ? "secondary" : "danger"}
            disabled={false}
          >
            {product.remaining === 0 ? '已完抽 (查看結果)' : (product.type === 'ichiban' ? '立即抽獎' : '立即轉蛋')}
          </Button>
        </div>
      </div>

      {/* Draw Results Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="抽獎結果一覽"
        className="max-w-4xl"
      >
        <div className="min-h-[300px] max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-neutral-500">正在載入抽獎結果...</p>
            </div>
          ) : drawResults.length > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3 p-1">
              {drawResults.map((result) => {
                const isLastOne = result.ticket_number === 0 || result.prize_level.includes('Last One') || result.prize_level.includes('LAST ONE');
                return (
                  <div
                    key={result.ticket_number}
                    className="aspect-square rounded-[8px] border-2 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center gap-1 shadow-sm px-0.5"
                  >
                    {!isLastOne && (
                      <span className="text-[10px] sm:text-xs font-bold text-neutral-400 font-amount">
                        {result.ticket_number.toString().padStart(2, '0')}
                      </span>
                    )}
                    <span className={cn(
                      "font-black text-center",
                      ['A', 'B', 'C', 'Last One', 'LAST ONE'].some(t => result.prize_level.includes(t)) 
                        ? "text-accent-red" 
                        : "text-neutral-900 dark:text-neutral-200",
                      isLastOne ? "text-[10px] sm:text-xs whitespace-nowrap" : "text-xs sm:text-sm"
                    )}>
                      {result.prize_level}賞
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-neutral-500">
              <p>暫無抽獎記錄</p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
           <Button 
            onClick={() => setShowResultModal(false)}
            className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold"
          >
            關閉
          </Button>
        </div>
      </Modal>

      {/* Purchase Confirmation Modal */}
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

      {/* Gacha Machine Overlay */}
      <GachaMachine 
        isOpen={isGachaOpen}
        prizes={wonPrizes}
        onGoToWarehouse={handleGachaComplete}
        onContinue={handleGachaContinue}
      />
    </div>
  );
}
