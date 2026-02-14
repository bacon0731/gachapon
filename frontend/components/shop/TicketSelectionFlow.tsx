'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { TicketSelector, Ticket } from '@/components/shop/TicketSelector';
import { Button } from '@/components/ui';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseConfirmation } from '@/components/shop/PurchaseConfirmation';
import { IchibanTicket } from '@/components/IchibanTicket';
import { LastOneCelebrationModal } from '@/components/shop/LastOneCelebrationModal';
import { PrizeResultModal } from '@/components/shop/PrizeResultModal';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface TicketSelectionFlowProps {
  isModal?: boolean;
  onClose?: () => void;
}

interface PlayIchibanResult {
  grade: string;
  name: string;
  image_url: string;
  is_last_one: boolean;
  ticket_number: number;
}

export function TicketSelectionFlow({ isModal = false, onClose }: TicketSelectionFlowProps) {
  const params = useParams();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const { user, refreshProfile } = useAuth();
  
  const [product, setProduct] = useState<Database['public']['Tables']['products']['Row'] | null>(null);
  const [soldTickets, setSoldTickets] = useState<number[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirmation & Purchase State
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPrizeDetails, setShowPrizeDetails] = useState(false);
  const [showLastOneCelebration, setShowLastOneCelebration] = useState(false);
  const [drawnResults, setDrawnResults] = useState<{
    grade: string;
    name: string;
    isOpened: boolean;
    image_url: string;
    is_last_one: boolean;
    ticket_number: number;
  }[]>([]);
  
  // Full results for Last One winner
  const [fullResults, setFullResults] = useState<{
    grade: string;
    name: string;
    isOpened: boolean;
    image_url: string;
    is_last_one: boolean;
    ticket_number: number;
  }[]>([]);
  const [isFetchingFullResults, setIsFetchingFullResults] = useState(false);

  const handleShowFullResults = async () => {
    if (!product) return;
    
    setIsFetchingFullResults(true);
    setShowResultModal(true);
    
    try {
      const { data, error } = await supabase
        .from('draw_records')
        .select('ticket_number, prize_level, prize_name, image_url, is_last_one')
        .eq('product_id', product.id)
        .order('ticket_number', { ascending: true });

      if (error) throw error;

      // Sort results: Normal tickets by number, Last One at the end (or handled by Modal sorting)
      // The Modal expects normal array. It has its own sorting.
      // But we should format it correctly.
      const formattedResults = data.map(record => ({
        grade: record.prize_level,
        name: record.prize_name,
        isOpened: true, // All opened in history view
        image_url: record.image_url || '',
        is_last_one: record.is_last_one || false,
        ticket_number: record.ticket_number
      }));

      // Fallback: 若查無最後賞記錄，但普通獎已為 0，補上一筆最後賞供顯示
      if (!formattedResults.some(r => r.is_last_one)) {
        const { data: prizeRows } = await supabase
          .from('product_prizes')
          .select('level, name, image_url, remaining')
          .eq('product_id', product.id);
        const normalRemaining = (prizeRows || [])
          .filter(p => !(p.level?.toLowerCase?.().includes('last one') || p.level?.includes?.('最後賞')))
          .reduce((sum, p) => sum + (p.remaining || 0), 0);
        if (normalRemaining === 0) {
          const loPrize = (prizeRows || []).find(p => p.level?.toLowerCase?.().includes('last one') || p.level?.includes?.('最後賞'));
          if (loPrize) {
            formattedResults.push({
              grade: loPrize.level || 'Last One',
              name: loPrize.name || '最後賞',
              isOpened: true,
              image_url: loPrize.image_url || '',
              is_last_one: true,
              ticket_number: 0
            });
          }
        }
      }

      setFullResults(formattedResults);
    } catch (err) {
      console.error(err);
      toast.error('無法載入抽獎結果');
      setShowResultModal(false);
    } finally {
      setIsFetchingFullResults(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productId = parseInt(params.id as string);
        if (isNaN(productId)) return;

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productError) throw productError;
        setProduct(productData);

        const { data: historyData, error: historyError } = await supabase
          .from('draw_records')
          .select('ticket_number')
          .eq('product_id', productId);
        
        if (historyError) throw historyError;
        
        const sold = historyData
          .map(h => h.ticket_number || 0)
          .filter(n => n > 0);
        setSoldTickets(sold);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, supabase]);

  const totalTicketsCount = product?.total_count || 80;
  
  const tickets: Ticket[] = useMemo(() => {
    return Array.from({ length: totalTicketsCount }, (_, i) => ({
      number: i + 1,
      isSold: soldTickets.includes(i + 1)
    }));
  }, [totalTicketsCount, soldTickets]);

  const toggleTicket = (num: number) => {
    if (soldTickets.includes(num)) return;
    setSelectedTickets(prev => 
      prev.includes(num) ? prev.filter(n => n !== num).sort((a, b) => a - b) : 
      prev.length >= 10 ? prev : [...prev, num].sort((a, b) => a - b)
    );
  };

  const [showRandomMenu, setShowRandomMenu] = useState(false);

  const handleRandomSelect = (count: number) => {
    const allAvailable = tickets
      .filter(t => !t.isSold)
      .map(t => t.number);
    
    if (allAvailable.length === 0) return;
    
    const actualCount = Math.min(count, 10, allAvailable.length);
    
    if (actualCount <= 0) return;

    const shuffled = [...allAvailable].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, actualCount);
    
    setSelectedTickets(selected.sort((a, b) => a - b));
    setShowRandomMenu(false);
  };

  const handleBuyAll = () => {
    const allAvailable = tickets
      .filter(t => !t.isSold)
      .map(t => t.number);
    
    if (allAvailable.length === 0) {
        toast.error('已無剩餘籤號');
        return;
    }
    
    setSelectedTickets(allAvailable);
    setShowConfirm(true);
  };

  const handlePurchase = async () => {
    if (!user) { router.push('/login'); return; }
    if (!product) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('play_ichiban', {
        p_product_id: product.id,
        p_ticket_numbers: selectedTickets
      });
      
      if (error) throw error;
      
      const results = (data as unknown as PlayIchibanResult[]).map((r) => ({
        grade: r.grade,
        name: r.name,
        isOpened: r.is_last_one ? true : false, // Last One starts as 'visually opened' but hidden content
        image_url: r.image_url,
        is_last_one: r.is_last_one,
        ticket_number: r.ticket_number
      }));
      
      setDrawnResults(results);
      if (refreshProfile) refreshProfile();
      
      // Check for Last One and trigger celebration
      if (results.some(r => r.is_last_one)) {
        setShowLastOneCelebration(true);
      } else {
        // Fallback: 若後端未回傳但庫存已經只剩最後賞，補取最後賞記錄
        try {
          const { data: prizeRows } = await supabase
            .from('product_prizes')
            .select('level, name, image_url, remaining')
            .eq('product_id', product.id);
          
          const normalRemaining = (prizeRows || [])
            .filter(p => !(p.level?.toLowerCase?.().includes('last one') || p.level?.includes?.('最後賞')))
            .reduce((sum, p) => sum + (p.remaining || 0), 0);
          
          if (normalRemaining === 0) {
            // 嘗試從抽獎紀錄取最後賞
            const { data: loRecord } = await supabase
              .from('draw_records')
              .select('ticket_number, prize_level, prize_name, image_url, is_last_one')
              .eq('product_id', product.id)
              .eq('ticket_number', 0)
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (loRecord) {
              const lastOne = {
                grade: loRecord.prize_level,
                name: loRecord.prize_name,
                isOpened: true,
                image_url: loRecord.image_url || '',
                is_last_one: true,
                ticket_number: 0
              };
              const augmented = [...results, lastOne];
              setDrawnResults(augmented);
              setShowLastOneCelebration(true);
            } else {
              // 仍找不到，從獎池資料補一筆 UI 資料，確保流程與按鈕狀態正確
              const loPrize = (prizeRows || []).find(p => p.level?.toLowerCase?.().includes('last one') || p.level?.includes?.('最後賞'));
              if (loPrize) {
                const lastOne = {
                  grade: loPrize.level || 'Last One',
                  name: loPrize.name || '最後賞',
                  isOpened: true,
                  image_url: loPrize.image_url || '',
                  is_last_one: true,
                  ticket_number: 0
                };
                const augmented = [...results, lastOne];
                setDrawnResults(augmented);
                setShowLastOneCelebration(true);
              }
            }
          }
        } catch (e) {
          console.warn('Last One fallback check failed', e);
        }
      }
      
      setShowConfirm(false); // Close confirmation modal
      
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert(err.message || '購買失敗');
      } else {
        alert('購買失敗');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAll = () => {
    // Only open tickets that are NOT Last One (Last One is already opened state)
    setDrawnResults(prev => prev.map(r => r.is_last_one ? r : { ...r, isOpened: true }));
  };

  // If we are showing results, render the result flow (New: Inline, Old: Modal)
  // Logic moved to inside the Reveal View block to prevent intercepting Last One full results

  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!product) return <div className="min-h-[50vh] flex items-center justify-center">Product not found</div>;

  // Prize Reveal View (Full Screen Overlay)
  if (drawnResults.length > 0) {
    const allOpened = drawnResults.every(r => r.isOpened);
    const hasLastOne = drawnResults.some(r => r.is_last_one);
    const normalTickets = drawnResults.filter(r => !r.is_last_one);
    const allNormalOpened = normalTickets.length === 0 || normalTickets.every(r => r.isOpened);

    return (
      <div className="fixed inset-0 z-[2000] bg-neutral-900 flex flex-col items-center justify-center p-3 pb-safe overflow-hidden pt-1 md:pt-24">
        {/* Last One Celebration Modal */}
        <AnimatePresence>
          {showLastOneCelebration && (
            <LastOneCelebrationModal onClose={() => setShowLastOneCelebration(false)} />
          )}
        </AnimatePresence>

        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image 
            src="/images/gacha_bg.png" 
            alt="" 
            fill
            className="object-cover filter brightness-[0.85] scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-neutral-900/50" />
        </div>
        
        <div className="relative z-10 flex-1 w-full max-w-5xl mx-auto overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div 
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar pb-28 md:pb-32 mt-2 md:mt-12 lg:mt-24"
            >
               <div className={cn(
                "grid gap-3 md:gap-x-12 md:gap-y-14 w-full",
                showPrizeDetails 
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
               )}>
                {drawnResults.map((result, idx) => {
                  const isLastOne = result.is_last_one;
                  const isHidden = isLastOne && !allNormalOpened;
                  const displayImage = isHidden ? '/images/last_one_hidden.png' : result.image_url;
                  
                  return (
                  <div key={idx} className={cn(
                    "animate-in fade-in zoom-in duration-300 w-full flex justify-center relative",
                    isLastOne && "order-last" // Ensure Last One is always last
                  )} style={{ animationDelay: `${idx * 100}ms` }}>
                    {isLastOne && isHidden && (
                       <div className="absolute inset-0 bg-yellow-500/20 rounded-xl blur-xl animate-pulse z-0 pointer-events-none" />
                    )}
                    <IchibanTicket 
                      grade={result.grade}
                      prizeName={result.name}
                      isOpened={isLastOne ? true : result.isOpened} // Last One is always visually opened
                      isLastOne={result.is_last_one}
                      ticketNumber={result.ticket_number}
                      imageUrl={displayImage}
                      coverImageUrl={undefined} // No cover for Last One
                      showPrizeDetail={showPrizeDetails}
                      className={cn(isLastOne && "z-10")}
                      onOpen={() => {
                        if (isLastOne) return; // Last One is already opened
                        const newResults = [...drawnResults];
                        newResults[idx].isOpened = true;
                        setDrawnResults(newResults);
                      }}
                    />
                  </div>
                )})}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 z-50 pb-safe">
        <div className="h-16 px-4 md:px-6 flex items-center justify-center w-full max-w-md mx-auto">
          {!allOpened ? (
            <Button 
              onClick={handleOpenAll} 
              className="w-full h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xl shadow-blue-500/20"
            >
              全部開啟
            </Button>
          ) : (
            <div className="flex gap-3 w-full">
              <Button 
                onClick={() => router.push('/profile?tab=warehouse')} 
                className="flex-1 h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black bg-neutral-200 hover:bg-neutral-300 text-neutral-700 shadow-sm"
              >
                前往倉庫
              </Button>
              <Button 
                onClick={() => setShowPrizeDetails(!showPrizeDetails)} 
                className="flex-1 h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black bg-neutral-200 hover:bg-neutral-300 text-neutral-700 shadow-sm"
              >
                {showPrizeDetails ? "顯示籤號" : "顯示獎項"}
              </Button>
              <Button 
                onClick={() => {
                  handleShowFullResults();
                }} 
                className={cn(
                  "flex-1 h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black shadow-xl transition-colors",
                  hasLastOne 
                    ? "bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/20" 
                    : "bg-accent-red hover:bg-accent-red/90 text-white shadow-accent-red/20"
                )}
              >
                {hasLastOne ? "查看結果" : "繼續抽獎"}
              </Button>
            </div>
          )}
        </div>
      </div>

        {/* Prize Result Modal for Variant A */}
        {showResultModal && (
          <PrizeResultModal 
            results={(fullResults.length > 0 ? fullResults : drawnResults)}
            onClose={() => setShowResultModal(false)}
            onPlayAgain={() => window.location.reload()}
            onGoToWarehouse={() => router.push('/profile?tab=warehouse')}
            isLoading={isFetchingFullResults}
            skipRevealAnimation={hasLastOne || fullResults.some(r => r.is_last_one)}
          />
        )}
      </div>
    );
  }

  // Modal Layout (Desktop) or Full Page (Mobile/Fallback)
  return (
    <div className={cn(
      "relative flex flex-col pb-safe bg-white dark:bg-neutral-900", 
      isModal 
        ? "w-full max-w-[640px] max-h-[80vh] h-full rounded-2xl overflow-hidden shadow-2xl mx-auto" 
        : "h-screen overflow-hidden pt-0" // Fixed height for page view to support internal scrolling, added padding for fixed header
    )}>
      {/* Background Image */}
      {!isModal && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image 
            src="/images/gacha_bg.png" 
            alt="" 
            fill
            className="object-cover filter brightness-[0.85] blur-[3px] scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-neutral-50/80 dark:bg-neutral-900/80" />
        </div>
      )}

      {/* Header for Modal */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 fixed top-0 left-0 right-0 z-10 shrink-0 md:sticky md:top-0">
        <h3 className="text-lg font-black text-neutral-900 dark:text-white">選擇籤號</h3>
        <button 
          onClick={() => onClose ? onClose() : router.back()}
          className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-neutral-500" />
        </button>
      </div>

      <div className={cn(
        "flex-1 flex flex-col overflow-hidden relative z-0",
        "pt-[60px] md:pt-0" // Add padding for fixed header on mobile modal
      )}>
        <div className="text-center py-2 text-sm text-neutral-500 font-bold bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          點擊號碼進行抽獎 (可複選，滿十抽送一抽活動進行中)
        </div>
        <TicketSelector 
          tickets={tickets} 
          selectedTickets={selectedTickets} 
          onToggle={toggleTicket}
          className={cn("p-4 overflow-y-auto flex-1 custom-scrollbar", isModal ? "pb-24" : "pb-32")}
        />
      </div>

      {/* Footer Action Bar */}
      <div className={cn("bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 pb-safe z-40 shadow-modal shrink-0", isModal ? "absolute bottom-0 left-0 right-0" : "fixed bottom-0 left-0 right-0")}>
        <div className="flex items-center gap-4 h-16 px-4">
          <div className="flex flex-col shrink-0 pl-1 justify-center h-full">
            <span className="text-[13px] text-neutral-400 font-black uppercase tracking-widest leading-none mb-0.5">已選 <span className="font-amount">{selectedTickets.length.toLocaleString()}</span> 張</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-accent-red font-amount leading-none">{(selectedTickets.length * product.price).toLocaleString()}</span>
              <span className="text-[13px] font-bold text-neutral-900 leading-none font-amount">元</span>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2 h-[44px]">
            <button 
              onClick={() => setSelectedTickets([])}
              className="px-3 h-[44px] bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-xl font-black text-sm flex items-center justify-center transition-colors shrink-0"
            >
              重置
            </button>
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowRandomMenu(!showRandomMenu)}
                className="px-3 h-[44px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-black text-sm flex items-center justify-center transition-colors shadow-lg shadow-neutral-900/20"
              >
                隨機
              </button>
              {showRandomMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRandomMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {[1, 5, 10].map(num => (
                      <button
                        key={num}
                        onClick={() => handleRandomSelect(num)}
                        className="py-3 px-4 text-center font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                      >
                        隨機 <span className="font-amount">{num.toLocaleString()}</span> 張
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={handleBuyAll}
              disabled={tickets.every(t => t.isSold)}
              className="px-3 h-[44px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm flex items-center justify-center transition-colors shadow-lg shadow-purple-600/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              包套
            </button>
            <Button 
              onClick={() => setShowConfirm(true)}
              disabled={selectedTickets.length === 0}
              className="flex-1 h-full text-base font-black rounded-xl shadow-lg shadow-accent-red/30 bg-accent-red hover:bg-accent-red/90 text-white transition-all active:scale-[0.98]"
            >
              購買
            </Button>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Overlay */}
      {showConfirm && (
        <div className={cn("fixed inset-0 z-50 flex justify-center animate-in fade-in duration-200", isModal ? "items-center p-4" : "items-end pb-0")}>
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             onClick={() => setShowConfirm(false)} 
           />
           
           {/* Bottom Sheet (Mobile) or Modal (Desktop/Modal Mode) */}
           <div className={cn("relative w-full mx-auto z-10 transition-all", isModal ? "max-w-[600px]" : "max-w-lg")}>
             <PurchaseConfirmation
              product={product}
              selectedTickets={selectedTickets}
              totalPrice={selectedTickets.length * product.price}
              userPoints={user?.points || 0}
              onConfirm={handlePurchase}
              onCancel={() => setShowConfirm(false)}
              onTopUp={() => router.push('/topup')}
              isProcessing={isProcessing}
              isLoggedIn={!!user}
      onLogin={() => router.push('/login')}
    />
           </div>
        </div>
      )}
    </div>
  );
}
