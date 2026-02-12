'use client';

import { useRouter } from 'next/navigation';
import { TicketSelectionFlow } from '@/components/shop/TicketSelectionFlow';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

export default function SelectTicketPage() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const router = useRouter();

  return (
    <div className="min-h-screen relative bg-neutral-900 flex items-center justify-center md:fixed md:inset-0 md:z-[100]">
      {/* Page Background (Visible on Desktop as backdrop context) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/images/gacha_bg.png" 
          alt="" 
          className="w-full h-full object-cover filter brightness-[0.85] blur-[3px] scale-105"
        />
        <div className="absolute inset-0 bg-neutral-900/50" />
      </div>

      {/* Content */}
      <div className={cn(
        "relative z-10 w-full",
        isDesktop ? "px-4 flex items-center justify-center h-screen" : "min-h-screen"
      )}>
        {/* Modal Backdrop for Desktop */}
        {isDesktop && (
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => router.back()}
          />
        )}

        {/* Ticket Flow Component */}
        <div className={cn(
          "transition-all duration-300",
          isDesktop ? "relative z-20 w-full max-w-[640px]" : "w-full min-h-screen"
        )}>
          <TicketSelectionFlow 
            isModal={isDesktop} 
            onClose={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
