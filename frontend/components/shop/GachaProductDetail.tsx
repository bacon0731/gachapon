import React, { useState } from 'react';
import { Database } from '@/types/database.types';
import { GachaMachineVisual } from './GachaMachineVisual';
import { GachaCollectionList } from './GachaCollectionList';
import { GachaResultModal } from './GachaResultModal';
import { Prize } from '@/components/GachaMachine';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { PurchaseConfirmationModal } from '@/components/shop/PurchaseConfirmationModal';
import { Loader2 } from 'lucide-react';

interface GachaProductDetailProps {
  product: Database['public']['Tables']['products']['Row'];
  prizes: Database['public']['Tables']['product_prizes']['Row'][];
}

export function GachaProductDetail({ product, prizes }: GachaProductDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  // States
  const [machineState, setMachineState] = useState<'idle' | 'shaking' | 'spinning' | 'dropping' | 'waiting' | 'result'>('idle');
  const [shakeRepeats, setShakeRepeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<Prize[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [hasPendingResult, setHasPendingResult] = useState(false);
  const [isMachineLoaded, setIsMachineLoaded] = useState(false);

  const handlePush = () => {
    if (machineState !== 'idle') return;
    setShakeRepeats(1);
    setMachineState('shaking');
    setTimeout(() => {
      setMachineState('idle');
    }, 200);
  };

  const handlePurchaseClick = () => {
    if (machineState !== 'idle' || isProcessing) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product || product.remaining === 0) {
      showToast('已完抽', 'info');
      return;
    }
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!product || !user) return;
    
    setIsProcessing(true);
    setIsPurchaseModalOpen(false);
    try {
      const { data, error } = await supabase.rpc('play_gacha', {
        p_product_id: product.id,
        p_count: quantity
      });

      if (error) throw error;

      interface PlayGachaResult {
        name: string;
        grade: string;
        image_url: string;
        ticket_number?: number;
        is_last_one?: boolean;
      }

      const rawResults = data as unknown as PlayGachaResult[];
      const results = rawResults.map((item, index) => ({
        id: item.ticket_number !== undefined ? String(item.ticket_number) : `${product.id}-${index}`,
        name: item.name,
        rarity: item.grade,
        image_url: item.image_url,
        grade: item.grade,
        is_last_one: item.is_last_one,
        ticket_number: item.ticket_number
      }));

      setWonPrizes(results);
      runGachaAnimation();

    } catch (error: unknown) {
      console.error('Purchase error:', error);
      const msg = error instanceof Error ? error.message : '購買失敗，請稍後再試';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const runTrialAnimation = () => {
    setShakeRepeats(3);
    setMachineState('shaking');
    setTimeout(() => {
      setMachineState('dropping');
      setTimeout(() => {
        setMachineState('waiting');
        setHasPendingResult(true);
      }, 800);
    }, 3000);
  };

  const runGachaAnimation = () => {
    runTrialAnimation();
  };

  const handleResultClose = () => {
    setShowResultModal(false);
    setMachineState('idle');
    setWonPrizes([]);
    setHasPendingResult(false);
  };

  const handleTrial = () => {
    if (machineState !== 'idle') return;
    
    if (prizes.length > 0) {
      const index = Math.floor(Math.random() * prizes.length);
      const sample = prizes[index];
      setWonPrizes([
        {
          id: String(sample.id),
          name: sample.name,
          rarity: sample.level,
          image_url: sample.image_url || undefined,
          grade: sample.level,
          is_last_one: false,
        }
      ]);
    }

    runTrialAnimation();
  };

  const handleHoleClick = () => {
    if (!hasPendingResult || wonPrizes.length === 0) return;
    setShowResultModal(true);
    setMachineState('result');
  };

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-black">
      <div className="w-full max-w-[750px] mx-auto">
        <div className="w-full">
          <div className="relative w-full" style={{ aspectRatio: '750/1036' }}>
            <GachaMachineVisual
              state={machineState}
              shakeRepeats={shakeRepeats}
              onPush={handlePush}
              onPurchase={handlePurchaseClick}
              onTrial={handleTrial}
              onHoleClick={handleHoleClick}
              onLoaded={() => setIsMachineLoaded(true)}
            />
            {!isMachineLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-black tracking-widest">載入機台中...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full">
          <GachaCollectionList productId={product.id} prizes={prizes} />
        </div>
      </div>

      <GachaResultModal
        isOpen={showResultModal}
        onClose={handleResultClose}
        results={wonPrizes}
      />

      <PurchaseConfirmationModal
        isOpen={isPurchaseModalOpen}
        onClose={() => !isProcessing && setIsPurchaseModalOpen(false)}
        onConfirm={handlePurchaseConfirm}
        product={product}
        userPoints={user?.tokens || 0}
        isProcessing={isProcessing}
        onTopUp={() => router.push('/wallet')}
      />
    </div>
  );
}
