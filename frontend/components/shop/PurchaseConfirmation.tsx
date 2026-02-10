import { Button } from '@/components/ui';
import { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { Wallet, Ticket, Gift, ChevronRight } from 'lucide-react';
import { useAlert } from '@/components/ui/AlertDialog';

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
  onCancel,
  onTopUp,
  isProcessing = false,
  isLoggedIn = false,
  onLogin,
  className
}: PurchaseConfirmationProps & { className?: string }) {
  const { showAlert } = useAlert();
  const isInsufficient = userPoints < totalPrice;
  const bonusThreshold = 10;
  // Simple logic: how many more to reach next 10 (assuming accumulative or batch bonus)
  // For display purposes, mimicking the "Buy 10 Get 1 Free" style
  const currentCount = selectedTickets.length;
  const remainder = currentCount % bonusThreshold;
  const neededForFree = bonusThreshold - remainder; 

  return (
    <div className={cn("w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300", className)}>
      
      <div className="flex-1 min-h-0">
        {/* Header: Product Info */}
        <div className="p-3 pb-2 flex gap-3">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <img 
              src={product.image_url || '/images/item.png'} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-neutral-900 dark:text-white leading-tight line-clamp-1 text-base">
                {product.name}
              </h3>
            </div>
            <div className="flex flex-col justify-end mt-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-yellow shadow-sm">
                  <span className="text-[13px] text-white font-black leading-none">G</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black text-accent-red font-amount leading-none tracking-tighter">{product.price.toLocaleString()}</span>
                  <span className="text-[13px] font-black text-neutral-400 leading-none uppercase tracking-widest">/抽</span>
                  <span className="text-[13px] font-black text-neutral-400 leading-none ml-1">
                    優惠前：<span className="line-through font-amount">{Math.round(product.price * 1.2).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Text */}
        <div className="px-3 py-1">
          <div className="text-[13px] font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
             活動進度：已選 <span className="text-neutral-900 font-black font-amount">{currentCount.toLocaleString()}</span> 張，再抽 <span className="text-accent-red font-black font-amount">{neededForFree.toLocaleString()}</span> 抽，送 1 抽
          </div>
        </div>

        {/* Selected Tickets */}
        <div className="px-3 pb-2">
          <div className="text-[13px] font-black text-neutral-400 mb-1 uppercase tracking-widest">已選擇票券:</div>
          <div className="grid grid-cols-10 gap-1 w-full">
            {selectedTickets.map(num => (
              <div 
                key={num} 
                className="aspect-square bg-primary text-white rounded-md flex items-center justify-center font-amount font-black text-[13px] shadow-sm shadow-primary/30 leading-none"
              >
                {num.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Text */}
        <div className="text-center text-[13px] font-bold text-neutral-500 dark:text-neutral-400 mb-1 px-3">
           總計: <span className="font-amount">{currentCount.toLocaleString()}</span> 張票券
           <span className="text-[13px] text-neutral-400 ml-2">購買後扣除代幣並抽選</span>
        </div>

        {/* Divider */}
        <div className="h-1 bg-neutral-100/50 dark:bg-neutral-800/50 w-full shrink-0" />

        {/* Options Rows */}
        <div className="px-3 py-2 space-y-2">
           {/* Points Offset */}
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[13px] font-black text-neutral-700 dark:text-neutral-300">
                 <Gift className="w-3.5 h-3.5 text-accent-red" />
                 積分折抵
              </div>
              <span className="text-[13px] font-bold text-neutral-400">積分不足</span>
           </div>

           {/* Coupons */}
           <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-2">
              <div className="flex items-center gap-2 text-[13px] font-black text-neutral-700 dark:text-neutral-300">
                 <Ticket className="w-3.5 h-3.5 text-accent-yellow" />
                 優惠券
              </div>
              <button className="flex items-center gap-1 text-[13px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors group">
                 選擇優惠券 <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
           </div>

           {/* Subtotal Block */}
           <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 mt-2 space-y-2">
              <div className="flex justify-between items-center text-[13px] font-bold text-neutral-500">
                 <span>商品總額</span>
                 <span className="text-neutral-900"><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-bold text-neutral-400">
                 <span>代幣餘額</span>
                 <span><span className="font-amount">{userPoints.toLocaleString()}</span> 代幣</span>
              </div>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 border-dashed w-full my-1" />
              <div className="flex justify-between items-end text-base font-black text-accent-red">
                 <span className="text-[13px]">實付金額</span>
                 <span className="text-xl leading-none"><span className="font-amount">{totalPrice.toLocaleString()}</span> 元</span>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Payment Info & Button */}
      <div className="h-16 px-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 z-10 flex items-center justify-between gap-4 mt-auto">
         <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-1">
               <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">實付:</span>
               <span className="text-xl font-black text-accent-red leading-none"><span className="font-amount">{totalPrice.toLocaleString()}</span>元</span>
            </div>
            <div className="text-[13px] text-neutral-400 font-bold">餘額: <span className="font-amount">{userPoints.toLocaleString()}</span></div>
         </div>

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
          className="h-[44px] px-8 rounded-xl text-base font-black bg-accent-red hover:bg-accent-red/90 text-white shadow-xl shadow-accent-red/20 transition-all active:scale-[0.98]"
          variant="danger"
        >
           {isProcessing ? '處理中...' : '確認購買'}
         </Button>
      </div>
    </div>
  );
}
