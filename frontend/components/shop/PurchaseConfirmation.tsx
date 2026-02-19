import { Button } from '@/components/ui';
import { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { Ticket, ChevronRight } from 'lucide-react';
import { useAlert } from '@/components/ui/AlertDialog';
import Image from 'next/image';

interface PurchaseConfirmationProps {
  product: Database['public']['Tables']['products']['Row'];
  selectedTickets: number[];
  totalPrice: number;
  userPoints: number;
  onConfirm: () => void;
  onCancel?: () => void;
  onTopUp?: () => void;
  isProcessing?: boolean;
  isLoggedIn?: boolean;
  onLogin?: () => void;
}

export function PurchaseConfirmation({
  product,
  selectedTickets,
  totalPrice,
  userPoints,
  onConfirm,
  onTopUp,
  isProcessing = false,
  isLoggedIn = false,
  onLogin,
  className
}: PurchaseConfirmationProps & { className?: string }) {
  const { showAlert } = useAlert();
  const isInsufficient = userPoints < totalPrice;
  const currentCount = selectedTickets.length;

  return (
    <div className={cn("w-full bg-white dark:bg-neutral-900 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300", className)}>
      
      <div className="flex-1 min-h-0">
        {/* Header: Product Info */}
        <div className="p-3 md:p-6 pb-2 md:pb-4 flex gap-3 md:gap-5">
          <div className="relative w-12 h-12 md:w-16 md:h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <Image 
              src={`/images/item/${product.id.toString().padStart(5, '0')}.jpg`} 
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-neutral-900 dark:text-white leading-tight line-clamp-1 text-base md:text-xl">
                {product.name}
              </h3>
            </div>
            <div className="flex flex-col justify-end mt-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-accent-yellow shadow-sm">
                  <span className="text-[13px] md:text-[15px] text-white font-black leading-none">G</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg md:text-2xl font-black text-accent-red font-amount leading-none tracking-tighter">{product.price.toLocaleString()}</span>
                  <span className="text-[13px] md:text-[15px] font-black text-neutral-400 leading-none uppercase tracking-widest">/抽</span>
                  <span className="text-[13px] md:text-[15px] font-black text-neutral-400 leading-none ml-1">
                    優惠前：<span className="line-through font-amount">{Math.round(product.price * 1.2).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Tickets */}
        <div className="px-3 md:px-6 pb-2 md:pb-4">
          <div className="text-[13px] md:text-[15px] font-black text-neutral-400 mb-1 uppercase tracking-widest">已選擇票券:</div>
          <div className="w-full max-h-[150px] md:max-h-[260px] overflow-y-auto custom-scrollbar pr-1 md:pr-2">
            <div className="grid grid-cols-10 gap-1 md:gap-2 w-full">
            {selectedTickets.map(num => (
              <div 
                key={num} 
                className="aspect-square bg-primary text-white rounded-md flex items-center justify-center font-amount font-black text-[13px] md:text-[15px] shadow-sm shadow-primary/30 leading-none"
              >
                {num.toString().padStart(2, '0')}
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Summary Text */}
        <div className="text-center text-[13px] md:text-[15px] font-bold text-neutral-500 dark:text-neutral-400 mb-1 px-3 md:px-6">
           總計: <span className="font-amount">{currentCount.toLocaleString()}</span> 張票券
           <span className="text-[13px] md:text-[15px] text-neutral-400 ml-2">購買後扣除代幣並抽選</span>
        </div>

        {/* Divider */}
        <div className="h-1 bg-neutral-100/50 dark:bg-neutral-800/50 w-full shrink-0" />

        {/* Options Rows */}
        <div className="px-3 md:px-6 py-2 md:py-4 space-y-2 md:space-y-4">
           {/* Coupons */}
           <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2 text-[13px] md:text-[15px] font-black text-neutral-700 dark:text-neutral-300">
                 <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent-yellow" />
                 優惠券
              </div>
              <button className="flex items-center gap-1 text-[13px] md:text-[15px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors group">
                 選擇優惠券 <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
           </div>

           {/* Subtotal Block */}
           <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 md:p-6 mt-2 space-y-2 md:space-y-4">
              <div className="flex justify-between items-center text-[13px] md:text-[15px] font-bold text-neutral-500">
                 <span>商品總額</span>
                 <span className="text-neutral-900"><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
              </div>
              <div className="flex justify-between items-center text-[13px] md:text-[15px] font-bold text-neutral-400">
                 <span>代幣餘額</span>
                 <span><span className="font-amount">{userPoints.toLocaleString()}</span> 代幣</span>
              </div>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 border-dashed w-full my-1" />
              <div className="flex justify-between items-end text-base font-black text-accent-red">
                 <span className="text-[13px] md:text-[15px]">實付金額</span>
                 <span className="text-xl md:text-3xl leading-none"><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Payment Info & Button */}
      <div className="h-16 md:h-20 px-4 md:px-6 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 z-10 flex items-center justify-center mt-auto rounded-b-3xl">
         <Button 
          onClick={() => {
            if (!isLoggedIn) {
              showAlert({
                title: '提示',
                message: '請先登入會員',
                type: 'info',
                confirmText: '前往登入',
                onConfirm: () => onLogin?.()
              });
              return;
            }
            if (isInsufficient) {
              showAlert({
                title: '餘額不足',
                message: '您的代幣餘額不足，是否前往儲值？',
                type: 'confirm',
                confirmText: '前往儲值',
                onConfirm: () => onTopUp?.()
              });
            } else {
              onConfirm();
            }
          }}
          disabled={selectedTickets.length === 0 || isProcessing}
          className="w-full h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black bg-accent-red hover:bg-accent-red/90 text-white shadow-xl shadow-accent-red/20 transition-all active:scale-[0.98]"
          variant="danger"
        >
           {isProcessing ? '處理中...' : `確認支付 ${totalPrice.toLocaleString()} 代幣`}
         </Button>
      </div>
    </div>
  );
}
