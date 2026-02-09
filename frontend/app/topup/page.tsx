'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  ArrowLeft,
  Zap,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TOPUP_PLANS = [
  { id: 'p1', amount: 100, points: 100, bonus: 0, isHot: false },
  { id: 'p2', amount: 500, points: 500, bonus: 25, isHot: false },
  { id: 'p3', amount: 1000, points: 1000, bonus: 80, isHot: true },
  { id: 'p4', amount: 3000, points: 3000, bonus: 300, isHot: false },
  { id: 'p5', amount: 5000, points: 5000, bonus: 600, isHot: false },
  { id: 'p6', amount: 10000, points: 10000, bonus: 1500, isHot: false },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', name: '信用卡 / 金融卡', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'line_pay', name: 'LINE Pay', icon: <Smartphone className="w-5 h-5 text-[#00C300]" /> },
  { id: 'bank_transfer', name: '銀行轉帳', icon: <Banknote className="w-5 h-5" /> },
];

export default function TopupPage() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const [selectedPlan, setSelectedPlan] = useState(TOPUP_PLANS[2]);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const handleTopup = async () => {
    if (selectedMethod === 'credit_card' && (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvc)) {
      showToast('請填寫完整的信用卡資訊', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (!user) throw new Error('User not found');

      const totalPoints = selectedPlan.points + selectedPlan.bonus;
      
      // 1. Create Order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amount: selectedPlan.amount,
          points: totalPoints,
          payment_method: selectedMethod,
          status: 'paid' // Simulating instant success
        });

      if (orderError) throw orderError;

      // 2. Update User Points
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          points: user.points + totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Refresh local profile state
      await refreshProfile();
      
      showToast(<span>成功儲值 <span className="font-amount">{totalPoints.toLocaleString()}</span> G幣！</span>, 'success');
      
      setTimeout(() => {
        router.push('/profile?tab=topup-history');
      }, 1000);
      
    } catch (error: any) {
      console.error('Topup Error:', error);
      showToast(error.message || '儲值失敗，請稍後再試', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 tracking-tight">儲值代幣(G)</h1>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start relative">
            {/* Left: Plans & Methods */}
            <div className="md:col-span-7 space-y-3 md:space-y-8">
              {/* Balance Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="space-y-0.5 md:space-y-1">
                <span className="text-[11px] md:text-sm font-black text-neutral-400 uppercase tracking-widest">目前餘額</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-3.5 h-3.5 md:w-4 h-4 rounded-full bg-accent-yellow shadow-sm">
                    <span className="text-[10px] md:text-[11px] text-white font-black leading-none">G</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-accent-red font-amount leading-none">
                    {user?.points.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <section className="space-y-2 md:space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] md:text-sm font-black text-neutral-400 uppercase tracking-widest">選擇儲值金額</h2>
                <span className="text-[11px] md:text-sm font-black text-primary bg-primary/5 px-2 py-0.5 md:py-1 rounded-lg"><span className="font-amount">1 TWD = 1 G</span>幣</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                {TOPUP_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "relative p-3 md:p-5 rounded-2xl md:rounded-3xl border-2 transition-all text-left flex flex-col gap-1 md:gap-1.5 group",
                      selectedPlan.id === plan.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                        : "border-neutral-100 bg-white hover:border-neutral-200"
                    )}
                  >
                    {plan.isHot && (
                      <div className="absolute -top-2 -right-1 z-10">
                        <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-accent-red text-white text-[10px] md:text-sm font-black rounded-full shadow-lg flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                          推薦
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] md:text-sm font-bold text-neutral-400 group-hover:text-neutral-500 transition-colors font-amount">
                      NT$ {plan.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xl md:text-2xl font-black font-amount leading-none",
                        selectedPlan.id === plan.id ? "text-primary" : "text-neutral-900"
                      )}>
                        {plan.points.toLocaleString()}
                      </span>
                      <span className="text-[11px] md:text-sm font-black text-neutral-400">G</span>
                    </div>
                    {plan.bonus > 0 && (
                      <div className="mt-0.5 md:mt-1">
                        <span className="text-[10px] md:text-sm font-black text-accent-emerald bg-accent-emerald/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          <span className="font-amount">+{plan.bonus.toLocaleString()}</span> 贈點
                        </span>
                      </div>
                    )}
                    {selectedPlan.id === plan.id && (
                      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4">
                        <CheckCircle2 className="w-4 h-4 md:w-5 h-5 text-primary fill-current bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Payment Methods */}
            <section className="space-y-2 md:space-y-4 pb-6 md:pb-12">
              <h2 className="text-[11px] md:text-sm font-black text-neutral-400 uppercase tracking-widest px-1">選擇付款方式</h2>
              <div className="space-y-2 md:space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="space-y-2 md:space-y-3">
                    <button
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "w-full p-3 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group",
                        selectedMethod === method.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-neutral-100 bg-white hover:border-neutral-200"
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-colors shrink-0",
                          selectedMethod === method.id ? "bg-primary text-white" : "bg-neutral-100 text-neutral-400 group-hover:text-neutral-600"
                        )}>
                          {React.cloneElement(method.icon as React.ReactElement, { className: 'w-4.5 h-4.5 md:w-5 md:h-5' })}
                        </div>
                        <span className={cn(
                          "text-sm md:text-base font-black",
                          selectedMethod === method.id ? "text-neutral-900" : "text-neutral-600"
                        )}>
                          {method.name}
                        </span>
                      </div>
                      <div className={cn(
                        "w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        selectedMethod === method.id ? "border-primary bg-primary" : "border-neutral-200"
                      )}>
                        {selectedMethod === method.id && <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-white rounded-full" />}
                      </div>
                    </button>

                    {/* Credit Card Info Form */}
                    {selectedMethod === 'credit_card' && method.id === 'credit_card' && (
                      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-primary/10 shadow-soft space-y-3 md:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5 md:space-y-2">
                          <label className="text-[11px] md:text-sm font-black text-neutral-500 uppercase tracking-widest">卡號</label>
                          <Input 
                            placeholder="0000 0000 0000 0000" 
                            className="text-sm md:text-base font-bold tracking-widest h-10 md:h-12 font-amount"
                            value={cardInfo.number}
                            onChange={(e) => setCardInfo({...cardInfo, number: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className="space-y-1.5 md:space-y-2">
                            <label className="text-[11px] md:text-sm font-black text-neutral-500 uppercase tracking-widest">有效期限</label>
                            <Input 
                              placeholder="MM/YY" 
                              className="text-sm md:text-base font-bold h-10 md:h-12 font-amount"
                              value={cardInfo.expiry}
                              onChange={(e) => setCardInfo({...cardInfo, expiry: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1.5 md:space-y-2">
                            <label className="text-[11px] md:text-sm font-black text-neutral-500 uppercase tracking-widest">安全碼 (CVC)</label>
                            <Input 
                              placeholder="123" 
                              className="text-sm md:text-base font-bold h-10 md:h-12 font-amount"
                              value={cardInfo.cvc}
                              onChange={(e) => setCardInfo({...cardInfo, cvc: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                          <label className="text-[11px] md:text-sm font-black text-neutral-500 uppercase tracking-widest">持卡人姓名</label>
                          <Input 
                            placeholder="NAME ON CARD" 
                            className="text-sm md:text-base font-bold h-10 md:h-12"
                            value={cardInfo.name}
                            onChange={(e) => setCardInfo({...cardInfo, name: e.target.value.toUpperCase()})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Summary Card */}
          <div className="md:col-span-5 md:h-full">
            <div className="md:sticky md:top-24 bg-white rounded-2xl md:rounded-4xl p-5 md:p-8 shadow-modal border border-neutral-100 space-y-5 md:space-y-8">
              <h3 className="text-lg md:text-xl font-black text-neutral-900 tracking-tight">訂單摘要</h3>
              
              <div className="space-y-3 md:space-y-5">
                <div className="flex justify-between items-center text-sm md:text-base whitespace-nowrap">
                  <span className="text-neutral-500 font-bold">儲值代幣</span>
                  <span className="text-neutral-900 font-black font-amount">{selectedPlan.points.toLocaleString()} G</span>
                </div>
                {selectedPlan.bonus > 0 && (
                  <div className="flex justify-between items-center text-sm md:text-base whitespace-nowrap">
                    <span className="text-neutral-500 font-bold">額外贈點</span>
                    <span className="text-accent-emerald font-black font-amount">+{selectedPlan.bonus.toLocaleString()} G</span>
                  </div>
                )}
                <div className="h-px bg-neutral-100" />
                <div className="flex justify-between items-end whitespace-nowrap">
                  <span className="text-sm md:text-base text-neutral-500 font-bold">應付總額</span>
                  <div className="text-right">
                    <span className="text-[10px] md:text-sm font-black text-neutral-400 mr-1.5 uppercase font-amount">TWD</span>
                    <span className="text-2xl md:text-4xl font-black text-neutral-900 font-amount tracking-tighter">
                      ${selectedPlan.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl md:rounded-2xl p-4 md:p-5 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 text-[11px] md:text-sm font-black text-neutral-400 uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent-emerald" />
                  儲值即表示您同意
                </div>
                <div className="text-[11px] md:text-sm text-neutral-500 font-bold leading-relaxed">
                  點擊確認付款即視為您已閱讀並同意 <Link href="/terms" className="text-primary hover:underline">服務條款</Link> 與 <Link href="/return-policy" className="text-primary hover:underline">退款政策</Link>。
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <Button 
                  onClick={handleTopup}
                  isLoading={isProcessing}
                  size="lg"
                  className="w-full py-6 md:py-8 text-lg md:text-xl font-black rounded-xl md:rounded-2xl shadow-xl shadow-primary/20"
                >
                  前往付款
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] md:text-sm text-neutral-400 font-bold">
                  <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>採用 256 位元 SSL 安全加密</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
