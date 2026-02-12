'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { TicketSelector, Ticket } from '@/components/shop/TicketSelector';
import { Button } from '@/components/ui';
import { RotateCcw, Shuffle, X, LayoutGrid, Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseConfirmation } from '@/components/shop/PurchaseConfirmation';
import { IchibanTicket } from '@/components/IchibanTicket';
import { PrizeResultModal } from '@/components/shop/PrizeResultModal';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const HIGH_TIER_GRADES = ['A', 'B', 'C', 'Last One', 'LAST ONE', 'SP'];

interface TicketSelectionFlowProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function TicketSelectionFlow({ isModal = false, onClose }: TicketSelectionFlowProps) {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, refreshProfile } = useAuth();
  
  const [product, setProduct] = useState<Database['public']['Tables']['products']['Row'] | null>(null);
  const [soldTickets, setSoldTickets] = useState<number[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirmation & Purchase State
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isWaitingForReveal, setIsWaitingForReveal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPrizeDetails, setShowPrizeDetails] = useState(false);
  const [drawnResults, setDrawnResults] = useState<any[]>([]);
  const [abVariant, setAbVariant] = useState<'A' | 'B'>('B'); // A: Modal Flow (Old), B: Inline Flow (New)

  // A/B Test Randomization
  useEffect(() => {
    // Randomize on client-side mount
    setAbVariant(Math.random() > 0.5 ? 'A' : 'B');
  }, []);

  // Removed separate isRevealing effect since loading is now handled inside the modal

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
  }, [params.id]);

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
      
      const results = (data as any[]).map((r: any) => ({
        grade: r.grade + '賞',
        name: r.name,
        isOpened: false,
        image_url: r.image_url,
        is_last_one: r.is_last_one,
        ticket_number: r.ticket_number
      }));
      
      setDrawnResults(results);
      if (refreshProfile) refreshProfile();
      setShowConfirm(false); // Close confirmation modal
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || '購買失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAll = () => {
    setDrawnResults(prev => prev.map(r => ({ ...r, isOpened: true })));
  };

  const isHighTier = (grade: string) => HIGH_TIER_GRADES.some(t => grade.includes(t));

  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!product) return <div className="min-h-[50vh] flex items-center justify-center">Product not found</div>;

  // Prize Reveal View (Full Screen Overlay)
  if (drawnResults.length > 0) {
    const allOpened = drawnResults.every(r => r.isOpened);
    
    return (
      <div className="fixed inset-0 z-[2000] bg-neutral-900 flex flex-col items-center justify-center p-3 pb-safe overflow-hidden pt-1 md:pt-24">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/images/gacha_bg.png" 
            alt="" 
            className="w-full h-full object-cover filter brightness-[0.85] blur-[3px] scale-105"
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
              className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar pb-28 md:pb-32 mt-2 md:mt-24"
            >
               <div className={cn(
                "grid gap-3 md:gap-4 w-full",
                showPrizeDetails 
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
               )}>
                {drawnResults.map((result, idx) => (
                  <div key={idx} className="animate-in fade-in zoom-in duration-300 w-full flex justify-center" style={{ animationDelay: `${idx * 100}ms` }}>
                    <IchibanTicket 
                      grade={result.grade}
                      prizeName={result.name}
                      isOpened={result.isOpened}
                      isLastOne={result.is_last_one}
                      ticketNumber={result.ticket_number}
                      imageUrl={result.image_url}
                      showPrizeDetail={showPrizeDetails}
                      onOpen={() => {
                        const newResults = [...drawnResults];
                        newResults[idx].isOpened = true;
                        setDrawnResults(newResults);
                      }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-[#1A202C]/90 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 z-50 min-h-16 flex items-center">
          <div className="px-4 w-full max-w-md mx-auto h-full flex items-center">
            {!allOpened ? (
               <Button 
                 onClick={handleOpenAll} 
                 className="w-full bg-white text-neutral-900 hover:bg-neutral-100 font-black h-11 rounded-xl text-base"
               >
                 全部開啟
               </Button>
            ) : (
               <div className="flex gap-2 w-full h-11">
                 <Button 
                   onClick={() => router.push('/profile?tab=warehouse')} 
                   className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black rounded-xl text-sm"
                 >
                   前往倉庫
                 </Button>
                 <Button 
                  onClick={() => setShowPrizeDetails(!showPrizeDetails)} 
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black rounded-xl text-sm"
                >
                  {showPrizeDetails ? "顯示籤號" : "顯示獎項"}
                </Button>
                 <Button 
                   onClick={() => window.location.reload()} 
                   className="flex-1 bg-accent-red hover:bg-accent-red/90 text-white font-black rounded-xl text-sm shadow-lg shadow-accent-red/30"
                 >
                   繼續抽獎
                 </Button>
               </div>
            )}
          </div>
        </div>

        {/* Prize Result Modal for Variant A */}
        <PrizeResultModal 
          isOpen={showResultModal} 
          onClose={() => setShowResultModal(false)}
          prizes={drawnResults.map((r, i) => ({
            id: String(i),
            name: r.name,
            grade: r.grade,
            image_url: r.image_url,
            is_last_one: r.is_last_one
          }))}
          onGoToWarehouse={() => router.push('/profile?tab=warehouse')}
          onPlayAgain={() => window.location.reload()}
        />
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
          <img 
            src="/images/gacha_bg.png" 
            alt="" 
            className="w-full h-full object-cover filter brightness-[0.85] blur-[3px] scale-105"
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
