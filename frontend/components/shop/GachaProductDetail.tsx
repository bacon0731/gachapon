import React, { useState } from 'react';
import { Database } from '@/types/database.types';
import { GachaMachineVisual } from './GachaMachineVisual';
import { GachaCollectionList } from './GachaCollectionList';
import { GachaResultModal } from './GachaResultModal';
import { PurchaseConfirmationModal } from './PurchaseConfirmationModal';
import { Button } from '@/components/ui';
import { ImageButton } from '@/components/ui/ImageButton';
import { Prize } from '@/components/GachaMachine';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface GachaProductDetailProps {
  product: Database['public']['Tables']['products']['Row'];
  prizes: Database['public']['Tables']['product_prizes']['Row'][];
  isFollowed: boolean;
  onFollowToggle: () => void;
}

export function GachaProductDetail({ product, prizes, isFollowed, onFollowToggle }: GachaProductDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  // States
  const [machineState, setMachineState] = useState<'idle' | 'shaking' | 'spinning' | 'result'>('idle');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<Prize[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

  // Actions
  const handleShake = () => {
    if (machineState !== 'idle') return;
    setMachineState('shaking');
    setTimeout(() => setMachineState('idle'), 1500); // Shake for 1.5s
  };

  const handleTrial = () => {
    if (machineState !== 'idle') return;
    
    // Pick a random prize for demo
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    const demoPrize: Prize = {
      id: 'demo',
      name: randomPrize.name,
      rarity: randomPrize.level,
      image_url: randomPrize.image_url || undefined,
      grade: randomPrize.level
    };

    setWonPrizes([demoPrize]);
    runGachaAnimation();
  };

  const handlePurchaseClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!product || !user) return;
    
    setIsProcessing(true);
    try {
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
        is_last_one?: boolean;
      }

      const rawResults = data as unknown as PlayGachaResult[];
      const results = rawResults.map(item => ({
        id: item.id,
        name: item.name,
        rarity: item.grade,
        image_url: item.image_url,
        grade: item.grade,
        is_last_one: item.is_last_one,
        ticket_number: item.ticket_number
      }));

      setWonPrizes(results);
      setIsPurchaseModalOpen(false);
      
      // Run animation
      runGachaAnimation();

    } catch (error: unknown) {
      console.error('Purchase error:', error);
      const msg = error instanceof Error ? error.message : '購買失敗，請稍後再試';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const runGachaAnimation = () => {
    setMachineState('spinning');
    // Spin for 2s then show result
    setTimeout(() => {
      setMachineState('result');
      setShowResultModal(true);
    }, 2000);
  };

  const handleResultClose = () => {
    setShowResultModal(false);
    setMachineState('idle');
    setWonPrizes([]);
  };

  const handleGoToWarehouse = () => {
    router.push(`/profile?tab=warehouse&product_id=${product.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32 md:pb-12 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-12">
        
        {/* Upper Part: Machine Area */}
        <div className="flex flex-col items-center">
          {/* Wrap machine and place controls as overlay on the console panel */}
          <div className="relative w-full max-w-[500px] mx-auto">
            <GachaMachineVisual state={machineState} />
            {/* Overlay controls - positioned to match console buttons in main.png */}
            <div className="absolute inset-0 z-20">
              {/* Left: Shake */}
              <ImageButton 
                src="/images/button.png"
                alt="搖一下"
                text="搖一下"
                onClick={handleShake}
                disabled={machineState !== 'idle'}
                className="absolute left-[12%] top-[67%] w-[18%] aspect-square pointer-events-auto"
                textClassName="text-sm font-black text-shadow-sm"
              />
              {/* Center: Purchase */}
              <ImageButton 
                src="/images/buybutton.png"
                alt="立即轉蛋"
                text={product.remaining === 0 ? '已完抽' : '立即轉蛋'}
                onClick={handlePurchaseClick}
                disabled={machineState !== 'idle' || product.remaining === 0}
                className="absolute left-[36%] top-[60%] w-[28%] aspect-[2.4/1] pointer-events-auto"
                textClassName="text-xl font-black text-shadow-md"
              />
              {/* Right: Trial */}
              <ImageButton 
                src="/images/button.png"
                alt="試轉一下"
                text="試轉一下"
                onClick={handleTrial}
                disabled={machineState !== 'idle'}
                className="absolute right-[12%] top-[67%] w-[18%] aspect-square pointer-events-auto"
                textClassName="text-sm font-black text-shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Lower Part: Collection List */}
        <GachaCollectionList productId={product.id} prizes={prizes} />

      </div>

      {/* Modals */}
      <PurchaseConfirmationModal
        isOpen={isPurchaseModalOpen}
        onClose={() => !isProcessing && setIsPurchaseModalOpen(false)}
        onConfirm={handlePurchaseConfirm}
        product={product}
        userPoints={user?.tokens || 0}
        isProcessing={isProcessing}
        onTopUp={() => router.push('/wallet')}
      />

      <GachaResultModal
        isOpen={showResultModal}
        onClose={handleResultClose}
        onGoToWarehouse={handleGoToWarehouse}
        results={wonPrizes}
      />
    </div>
  );
}
