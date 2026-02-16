import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';

import { X, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useAlert } from '@/components/ui/AlertDialog';
import Image from 'next/image';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  product: Database['public']['Tables']['products']['Row'];
  userPoints: number;
  isProcessing: boolean;
  onTopUp?: () => void;
}

export function PurchaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  product,
  userPoints,
  isProcessing,
  onTopUp
}: PurchaseConfirmationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { showAlert } = useAlert();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  const maxQuantity = Math.min(product.remaining, 10); // Limit to 10 per draw for safety/UX
  const totalPrice = product.price * quantity;
  const isInsufficient = userPoints < totalPrice;

  const handleConfirm = () => {
    if (!user) {
      showAlert({
        title: '提示',
        message: '請先登入會員',
        type: 'info',
        confirmText: '前往登入',
        onConfirm: () => router.push(`/auth/login?redirect=/shop/${product.id}`)
      });
      return;
    }
    
    if (isInsufficient) {
      onClose();
      showAlert({
        title: '餘額不足',
        message: '您的代幣餘額不足，是否前往儲值？',
        type: 'confirm',
        confirmText: '前往儲值',
        onConfirm: () => onTopUp?.()
      });
      return;
    }

    onConfirm(quantity);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />

          {/* Modal */}
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag={isDesktop ? false : "y"}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (!isDesktop && info.offset.y > 100) onClose();
            }}
            className={cn(
              "relative z-[2001] bg-white dark:bg-neutral-900 overflow-hidden flex flex-col",
              isDesktop 
                ? "rounded-[24px] w-[600px] max-h-[90vh] shadow-[0_8px_24px_rgba(0,0,0,0.15)]" 
                : "fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800",
              isDesktop ? "px-6 py-4" : "px-4 py-3"
            )}>
              <h3 className={cn("font-black text-neutral-900 dark:text-white", isDesktop ? "text-xl" : "text-base")}>購買確認</h3>
              <button 
                onClick={onClose}
                className="p-1 -mr-1 text-neutral-400 hover:text-neutral-600 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Product Info */}
              <div className={cn("flex gap-3", isDesktop ? "p-6 pb-4 gap-5" : "p-3 pb-2")}>
                <div className={cn(
                  "relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-700",
                  isDesktop ? "w-16 h-16" : "w-12 h-12"
                )}>
                  <Image 
                    src={product.image_url || '/images/item.png'} 
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                  <div>
                    <h3 className={cn("font-black text-neutral-900 dark:text-white leading-tight line-clamp-1", isDesktop ? "text-xl" : "text-base")}>
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex flex-col justify-end mt-1">
                    <div className="flex items-center gap-1">
                      <div className={cn("flex items-center justify-center rounded-full bg-accent-yellow shadow-sm", isDesktop ? "w-6 h-6" : "w-5 h-5")}>
                        <span className={cn("text-white font-black leading-none", isDesktop ? "text-[15px]" : "text-[13px]")}>G</span>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className={cn("font-black text-accent-red font-amount leading-none tracking-tighter", isDesktop ? "text-2xl" : "text-lg")}>{product.price.toLocaleString()}</span>
                        <span className={cn("font-black text-neutral-400 leading-none uppercase tracking-widest", isDesktop ? "text-[15px]" : "text-[13px]")}>/抽</span>
                        <span className={cn("font-black text-neutral-400 leading-none ml-1", isDesktop ? "text-[15px]" : "text-[13px]")}>
                          優惠前：<span className="line-through font-amount">{Math.round(product.price * 1.2).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn("space-y-2", isDesktop ? "px-6 pb-6 space-y-4" : "px-3")}>
                {/* Quantity Selector */}
                <div className={cn("bg-neutral-50 dark:bg-neutral-800/50 rounded-xl flex items-center justify-between", isDesktop ? "p-6" : "p-3")}>
                  <span className={cn("font-bold text-neutral-700 dark:text-neutral-300", isDesktop ? "text-[15px]" : "text-[13px]")}>購買數量</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className={cn(
                        "rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all text-neutral-600",
                        isDesktop ? "w-10 h-10" : "w-8 h-8"
                      )}
                    >
                      <Minus className={cn(isDesktop ? "w-4 h-4" : "w-3.5 h-3.5")} />
                    </button>
                    <span className={cn("w-6 text-center font-amount font-black text-neutral-900 dark:text-white", isDesktop ? "text-2xl" : "text-lg")}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className={cn(
                        "rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all text-neutral-600",
                        isDesktop ? "w-10 h-10" : "w-8 h-8"
                      )}
                    >
                      <Plus className={cn(isDesktop ? "w-4 h-4" : "w-3.5 h-3.5")} />
                    </button>
                  </div>
                </div>

                {/* Subtotal Block */}
                <div className={cn("bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-2 mb-3", isDesktop ? "p-6 space-y-4" : "p-3")}>
                  <div className={cn("flex justify-between items-center font-bold text-neutral-500", isDesktop ? "text-[15px]" : "text-[13px]")}>
                      <span>商品總額</span>
                      <span className="text-neutral-900"><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
                  </div>
                  <div className={cn("flex justify-between items-center font-bold text-neutral-400", isDesktop ? "text-[15px]" : "text-[13px]")}>
                      <span>代幣餘額</span>
                      <span><span className="font-amount">{userPoints.toLocaleString()}</span> 代幣</span>
                  </div>
                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 border-dashed w-full my-1" />
                  <div className="flex justify-between items-end text-base font-black text-accent-red">
                      <span className={cn(isDesktop ? "text-[15px]" : "text-[13px]")}>實付金額</span>
                      <span className={cn("leading-none", isDesktop ? "text-3xl" : "text-xl")}><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Payment Info & Button */}
            <div className={cn(
              "bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 z-10 flex items-center justify-center mt-auto",
              isDesktop ? "h-24 px-6 rounded-b-[24px]" : "h-16 px-4"
            )}>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing || product.remaining === 0}
                className={cn(
                  "w-full rounded-xl font-black shadow-xl transition-all active:scale-[0.98]",
                  isDesktop ? "h-[52px] text-lg" : "h-[44px] text-base",
                  isInsufficient 
                    ? "bg-neutral-200 text-neutral-400 shadow-none cursor-not-allowed"
                    : "bg-accent-red text-white shadow-accent-red/20 hover:bg-accent-red/90"
                )}
                variant="danger"
              >
                {isProcessing ? '處理中...' : isInsufficient ? '餘額不足' : `確認支付 ${totalPrice.toLocaleString()} 代幣`}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
