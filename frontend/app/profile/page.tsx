'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Truck, 
  Trophy, 
  Settings, 
  Bell,
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Info,
  FileText,
  Shield,
  RefreshCcw,
  Wallet,
  Plus,
  Clock,
  Heart,
  User,
  Lock,
  ChevronDown,
  X,
  Loader2,
  CreditCard,
  Copy,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast, Toaster } from 'sonner';
import { ProfileSkeleton } from '@/components/Skeletons';

// --- Interfaces ---
interface WarehouseItem {
  id: string;
  name: string;
  series: string;
  grade: string;
  status: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged';
  image: string;
  date: string;
  ticketNo: string;
}

interface DeliveryOrder {
  id: string;
  itemsCount: number;
  items: { grade: string; name: string }[];
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  date: string;
  tracking: string;
  method: string;
  arrivalDate: string;
}

interface DrawHistoryItem {
  id: string;
  product: string;
  date: string;
  tickets: string[];
  cost: number;
  items: { grade: string; name: string }[];
}

interface FollowedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  status: 'selling' | 'soldout' | 'coming_soon';
}

interface Coupon {
  id: string;
  title: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minSpend: number;
  expiryDate: string;
  status: 'unused' | 'used' | 'expired';
  code?: string;
}

type TabType = 'warehouse' | 'delivery' | 'draw-history' | 'topup-history' | 'follows' | 'coupons' | 'settings';

function ProfileContent() {
  const { user, logout, refreshProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const [activeTab, setActiveTab] = useState<TabType>('warehouse');
  
  // Data States
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryOrder[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>([]);
  const [topupHistory, setTopupHistory] = useState<any[]>([]); 
  const [followedProducts, setFollowedProducts] = useState<FollowedProduct[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // UI States
  const [selectedForDelivery, setSelectedForDelivery] = useState<string[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Forms
  const [settingsForm, setSettingsForm] = useState({
    nickname: '',
    password: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: ''
  });

  // Handle Tab Change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDetailOpen(true);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Sync with URL on load
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['warehouse', 'delivery', 'draw-history', 'topup-history', 'follows', 'coupons', 'settings'].includes(tab)) {
      setActiveTab(tab as TabType);
      setIsMobileDetailOpen(true);
    } else {
      setIsMobileDetailOpen(false);
    }
  }, [searchParams]);

  // Sync Settings Form with User Data
  useEffect(() => {
    if (user) {
      setSettingsForm(prev => ({
        ...prev,
        nickname: user.name || '',
        recipientName: user.recipient_name || '',
        recipientPhone: user.recipient_phone || '',
        recipientAddress: user.recipient_address || ''
      }));
    }
  }, [user]);

  // Fetch Data when Tab Changes
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, activeTab]);

  const fetchUserData = async () => {
    if (!user) return;
    setIsLoadingData(true);

    try {
      if (activeTab === 'warehouse') {
        const { data, error } = await supabase
          .from('draw_records')
          .select(`
            id,
            ticket_number,
            created_at,
            status,
            product_prizes ( level, name, image_url ),
            products ( name )
          `)
          .eq('user_id', user.id)
          .eq('status', 'in_warehouse')
          .order('created_at', { ascending: false });
          
        if (error) throw error;

        const items = data.map((item: any) => ({
          id: item.id,
          name: item.product_prizes?.name || '未知獎品',
          series: item.products?.name || '未知系列',
          grade: item.product_prizes?.level || '?',
          status: item.status,
          image: item.product_prizes?.image_url || 'https://placehold.co/400',
          date: new Date(item.created_at).toLocaleDateString('zh-TW'),
          ticketNo: item.ticket_number?.toString() || ''
        }));
        setWarehouseItems(items);
      } 
      else if (activeTab === 'delivery') {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            draw_records (
              product_prizes ( level, name )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const orders = data.map((order: any) => ({
          id: order.id,
          itemsCount: order.draw_records?.length || 0,
          items: order.draw_records?.map((dh: any) => ({
            grade: dh.product_prizes?.level,
            name: dh.product_prizes?.name
          })) || [],
          status: order.status,
          date: new Date(order.created_at).toLocaleDateString('zh-TW'),
          tracking: order.tracking_number || '-',
          method: '標準配送',
          arrivalDate: order.status === 'completed' ? '已送達' : '-'
        }));
        setDeliveryHistory(orders);
      }
      else if (activeTab === 'draw-history') {
         const { data, error } = await supabase
          .from('draw_records')
          .select(`
            id,
            ticket_number,
            created_at,
            product_prizes ( level, name ),
            products ( name )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const history = data.map((item: any) => ({
          id: item.id,
          product: item.products?.name,
          date: new Date(item.created_at).toLocaleString('zh-TW'),
          tickets: [item.ticket_number?.toString()],
          cost: 0,
          items: [{ grade: item.product_prizes?.level, name: item.product_prizes?.name }]
        }));
        setDrawHistory(history);
      }
      else if (activeTab === 'topup-history') {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setTopupHistory(data || []);
      }
      else if (activeTab === 'follows') {
        const { data, error } = await supabase
          .from('product_follows')
          .select(`
            product_id,
            products ( id, name, price, image_url, status )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const follows = data.map((item: any) => ({
          id: item.products.id,
          name: item.products.name,
          image: item.products.image_url,
          price: item.products.price,
          status: item.products.status
        }));
        setFollowedProducts(follows);
      }
      else if (activeTab === 'coupons') {
        const { data, error } = await supabase
          .from('user_coupons')
          .select(`
            id,
            status,
            expiry_date,
            coupons ( id, title, description, discount_type, discount_value, min_spend, code )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const myCoupons = data.map((item: any) => ({
          id: item.id,
          title: item.coupons.title,
          description: item.coupons.description,
          discountType: item.coupons.discount_type,
          discountValue: item.coupons.discount_value,
          minSpend: item.coupons.min_spend,
          expiryDate: item.expiry_date,
          status: item.status,
          code: item.coupons.code
        }));
        setCoupons(myCoupons);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // toast.error('無法載入資料'); // Suppress error for now as tables might not exist yet
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleDeliverySelection = (id: string) => {
    setSelectedForDelivery(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDelivery = async () => {
    if (selectedForDelivery.length === 0) return;
    setIsSubmittingDelivery(true);

    try {
      // Generate Order Number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Create Delivery Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user!.id,
          recipient_name: settingsForm.recipientName,
          recipient_phone: settingsForm.recipientPhone,
          address: settingsForm.recipientAddress,
          status: 'submitted',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Update Draw Records
      const { error: updateError } = await supabase
        .from('draw_records')
        .update({ 
          status: 'pending_delivery',
          order_id: order.id 
        })
        .in('id', selectedForDelivery);

      if (updateError) throw updateError;

      toast.success('配送申請已提交！');
      setShowDeliveryModal(false);
      setSelectedForDelivery([]);
      fetchUserData(); // Refresh list
    } catch (error) {
      console.error('Delivery Error:', error);
      toast.error('申請失敗，請稍後再試');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const updates: any = {
        name: settingsForm.nickname,
        recipient_name: settingsForm.recipientName,
        recipient_phone: settingsForm.recipientPhone,
        address: settingsForm.recipientAddress,
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('個人資料已更新');
    } catch (error) {
      console.error('Update Error:', error);
      toast.error('更新失敗');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('確定要登出您的帳號嗎？')) {
      await logout();
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { id: 'warehouse', label: '我的倉庫', icon: Box, color: 'text-primary' },
    { id: 'follows', label: '我的關注', icon: Heart, color: 'text-accent-red' },
    { id: 'delivery', label: '配送訂單', icon: Truck, color: 'text-accent-emerald' },
    { id: 'draw-history', label: '抽獎紀錄', icon: Trophy, color: 'text-accent-yellow' },
    { id: 'topup-history', label: '儲值紀錄', icon: Wallet, color: 'text-blue-500' },
    { id: 'coupons', label: '我的優惠券', icon: Ticket, color: 'text-pink-500' },
    { id: 'settings', label: '設定', icon: Settings, color: 'text-neutral-500' },
  ];

  const renderTabContent = () => {
    if (isLoadingData) {
      return (
        <div className="p-3 lg:p-8">
          <ProfileSkeleton />
        </div>
      );
    }

    switch (activeTab) {
      case 'warehouse':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">我的倉庫</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您獲得的獎項，隨時申請出貨</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-neutral-50 rounded-xl lg:rounded-2xl border border-neutral-100 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                  庫存 {warehouseItems.length} 件
                </div>
                {selectedForDelivery.length > 0 && (
                  <button 
                    onClick={() => setShowDeliveryModal(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl lg:rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-[13px] font-black">申請配送 ({selectedForDelivery.length})</span>
                  </button>
                )}
              </div>
            </div>

            {warehouseItems.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">倉庫目前是空的</p>
              </div>
            ) : (
              <>
                {/* Mobile Grid */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  {warehouseItems.map((item) => {
                    const isSelected = selectedForDelivery.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleDeliverySelection(item.id)}
                        className={cn("bg-white rounded-2xl border p-3 space-y-3 shadow-sm relative overflow-hidden transition-all active:scale-95", isSelected ? "border-accent-emerald ring-2 ring-accent-emerald/20" : "border-neutral-100")}
                      >
                        <div className="aspect-square bg-[#28324E] rounded-xl overflow-hidden relative">
                          <img src={item.image || '/images/item.png'} alt={item.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2">
                             <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-white", isSelected ? "border-accent-emerald bg-accent-emerald" : "border-neutral-200")}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-0.5 bg-accent-red text-white text-[10px] font-black rounded-md uppercase">{item.grade}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[13px] font-black text-neutral-900 leading-tight line-clamp-2 min-h-[2.5em]">{item.name}</h4>
                          <p className="text-[10px] text-neutral-400 font-bold mt-1 truncate">{item.series}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-3 lg:-mx-8 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[550px] lg:min-w-[600px]">
                    <thead>
                      <tr className="bg-neutral-50/50 border-y border-neutral-50 text-[12px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="w-12 lg:w-16 px-4 lg:px-6 py-4"></th>
                        <th className="px-4 lg:px-6 py-4">賞別</th>
                        <th className="px-4 lg:px-6 py-4">獎項內容</th>
                        <th className="hidden xl:table-cell px-4 lg:px-6 py-4">獲得日期</th>
                        <th className="px-4 lg:px-6 py-4 text-right">籤號</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {warehouseItems.map((item) => {
                        const isSelected = selectedForDelivery.includes(item.id);
                        return (
                          <tr key={item.id} onClick={() => toggleDeliverySelection(item.id)} className={cn("transition-all group cursor-pointer hover:bg-neutral-50/50", isSelected && "bg-accent-emerald/5 hover:bg-accent-emerald/10")}>
                            <td className="px-4 lg:px-6 py-4 lg:py-5">
                              <div className={cn("w-5 h-5 lg:w-6 lg:h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 shadow-sm", isSelected ? "bg-accent-emerald border-accent-emerald" : "border-neutral-100 bg-white")}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 h-4 text-white stroke-[3]" />}
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-4 lg:py-5">
                              <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-accent-red/10 text-accent-red text-[12px] lg:text-[13px] font-black rounded-lg border border-accent-red/10 uppercase tracking-wider">{item.grade}</span>
                            </td>
                            <td className="px-4 lg:px-6 py-4 lg:py-5">
                              <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#28324E] overflow-hidden flex-shrink-0 border border-neutral-100 p-0.5 shadow-soft">
                                  <img src={item.image || '/images/item.png'} alt={item.name} className="w-full h-full object-cover rounded-[10px] lg:rounded-[14px] group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                </div>
                                <div className="space-y-0.5 lg:space-y-1 min-w-0">
                                  <div className="text-[13px] lg:text-[14px] font-black text-neutral-900 leading-tight truncate tracking-tight">{item.name}</div>
                                  <div className="text-[11px] lg:text-[13px] text-neutral-400 font-black uppercase tracking-widest truncate">{item.series}</div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden xl:table-cell px-4 lg:px-6 py-4 lg:py-5"><div className="text-[12px] lg:text-[13px] font-black text-neutral-400 flex items-center gap-2">{item.date}</div></td>
                            <td className="px-4 lg:px-6 py-4 lg:py-5 text-right font-amount text-sm lg:text-base font-black text-neutral-900 tracking-tighter">{item.ticketNo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Delivery Modal */}
            <AnimatePresence>
              {showDeliveryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                      <h3 className="text-xl font-black text-neutral-900">確認配送資訊</h3>
                      <button onClick={() => setShowDeliveryModal(false)} className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition-colors">
                        <X className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="bg-neutral-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 font-bold">配送件數</span>
                          <span className="font-black text-neutral-900">{selectedForDelivery.length.toLocaleString()} 件</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 font-bold">運費</span>
                          <span className="font-black text-primary">免運費</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-black text-neutral-900">收件人資訊</p>
                         <div className="grid grid-cols-1 gap-3">
                           <input 
                             value={settingsForm.recipientName} 
                             onChange={e => setSettingsForm({...settingsForm, recipientName: e.target.value})}
                             placeholder="收件人姓名" 
                             className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                           <input 
                             value={settingsForm.recipientPhone}
                             onChange={e => setSettingsForm({...settingsForm, recipientPhone: e.target.value})}
                             placeholder="聯絡電話" 
                             className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                           <input 
                             value={settingsForm.recipientAddress}
                             onChange={e => setSettingsForm({...settingsForm, recipientAddress: e.target.value})}
                             placeholder="收件地址" 
                             className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                         </div>
                         {!settingsForm.recipientName || !settingsForm.recipientPhone || !settingsForm.recipientAddress ? (
                           <p className="text-xs text-accent-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 請填寫完整收件資訊</p>
                         ) : null}
                      </div>
                    </div>
                    <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
                      <button onClick={() => setShowDeliveryModal(false)} className="flex-1 py-3 rounded-xl font-black text-neutral-500 hover:bg-neutral-100 transition-colors">取消</button>
                      <button 
                        onClick={handleConfirmDelivery}
                        disabled={isSubmittingDelivery || !settingsForm.recipientName || !settingsForm.recipientPhone || !settingsForm.recipientAddress}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                      >
                        {isSubmittingDelivery ? '處理中...' : '確認配送'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      case 'delivery':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">配送訂單</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">追蹤您的獎項配送狀態</p>
              </div>
              <div className="px-3 py-1 bg-neutral-50 rounded-xl lg:rounded-2xl border border-neutral-100 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest w-fit">
                共 {deliveryHistory.length.toLocaleString()} 筆訂單
              </div>
            </div>

            {deliveryHistory.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">尚無配送訂單</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Style */}
                <div className="md:hidden space-y-3">
                  {deliveryHistory.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-neutral-100 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-neutral-400 font-amount tracking-widest truncate max-w-[120px]">#{order.id.slice(0,8)}</span>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{order.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            {order.status === 'shipping' && <span className="text-accent-emerald text-[11px] font-black px-2 py-0.5 bg-accent-emerald/5 rounded-md border border-accent-emerald/10 uppercase tracking-widest">已發貨</span>}
                            {order.status === 'pending' && <span className="text-accent-yellow text-[11px] font-black px-2 py-0.5 bg-accent-yellow/5 rounded-md border border-accent-yellow/10 uppercase tracking-widest">待處理</span>}
                          </div>
                          <div className="text-[13px] font-black text-neutral-900 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> {order.method}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-neutral-400 font-black uppercase mb-0.5">預計到貨</div>
                          <div className="text-[13px] font-black font-amount">{order.arrivalDate}</div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-neutral-50">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-lg">
                              <span className="text-[10px] font-black text-accent-red uppercase">{item.grade}</span>
                              <span className="text-[11px] font-bold text-neutral-600 truncate max-w-[100px]">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-8 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-neutral-50/50 border-y border-neutral-50 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="w-16 px-6 py-4"></th>
                        <th className="px-6 py-4">訂單編號 / 日期</th>
                        <th className="px-6 py-4">目前狀態</th>
                        <th className="px-6 py-4">物流資訊</th>
                        <th className="px-6 py-4 text-right">到貨日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {deliveryHistory.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <React.Fragment key={order.id}>
                            <tr onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="hover:bg-neutral-50/50 transition-all cursor-pointer group">
                              <td className="px-6 py-5"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-neutral-100 text-neutral-400 transition-all group-hover:bg-white group-hover:shadow-soft", isExpanded && "rotate-180 bg-primary text-white")}><ChevronDown className="w-4 h-4 stroke-[3]" /></div></td>
                              <td className="px-6 py-5"><div className="text-sm font-black text-neutral-900 tracking-tight">#{order.id.slice(0,8)}...</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{order.date}</div></td>
                              <td className="px-6 py-5">
                                {order.status === 'shipping' && <span className="inline-flex items-center gap-1.5 text-accent-emerald text-[13px] font-black px-2.5 py-1 bg-accent-emerald/5 rounded-lg border border-accent-emerald/10 uppercase tracking-widest"><Truck className="w-3 h-3" /> 已發貨</span>}
                                {order.status === 'pending' && <span className="inline-flex items-center gap-1.5 text-accent-yellow text-[13px] font-black px-2.5 py-1 bg-accent-yellow/5 rounded-lg border border-accent-yellow/10 uppercase tracking-widest"><AlertCircle className="w-3 h-3" /> 待處理</span>}
                              </td>
                              <td className="px-6 py-5"><div className="text-sm font-amount text-neutral-900 font-black tracking-widest uppercase">{order.tracking}</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{order.method}</div></td>
                              <td className="px-6 py-5 text-right text-sm font-black text-neutral-900 font-amount tracking-tighter">{order.arrivalDate}</td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} className="px-0 py-0">
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-neutral-50/30">
                                      <div className="py-6 px-8 lg:px-24 border-y border-neutral-100/50">
                                        <div className="text-[13px] font-black text-neutral-400 uppercase tracking-widest mb-4">配送獎項內容</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-100 shadow-soft">
                                              <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[13px] font-black rounded-md border border-accent-red/10 uppercase">{item.grade}</span>
                                              <span className="text-sm font-black text-neutral-700 truncate">{item.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'draw-history':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">抽獎紀錄</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">回顧您的所有抽獎歷程</p>
              </div>
              <div className="px-3 py-1 bg-neutral-50 rounded-xl lg:rounded-2xl border border-neutral-100 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest w-fit">
                共 {drawHistory.length.toLocaleString()} 筆紀錄
              </div>
            </div>

            {drawHistory.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">尚無抽獎紀錄</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Style */}
                <div className="md:hidden space-y-3">
                  {drawHistory.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-neutral-100 p-4 space-y-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-[14px] font-black text-neutral-900 leading-tight tracking-tight">{item.product}</h4>
                          <div className="text-[11px] text-neutral-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm">
                            <span className="text-[10px] text-white font-black">G</span>
                          </div>
                          <span className="text-base font-black text-accent-red font-amount tracking-tighter">{item.cost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.tickets.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-neutral-50 text-neutral-500 rounded text-[10px] font-black font-amount border border-neutral-100">{t}</span>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-neutral-50">
                        <div className="grid grid-cols-1 gap-2">
                          {item.items.map((result, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-accent-red/10 text-accent-red text-[10px] font-black rounded uppercase">{result.grade}</span>
                              <span className="text-[11px] font-bold text-neutral-600 truncate">{result.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-8 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-neutral-50/50 border-y border-neutral-50 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="w-16 px-6 py-4"></th>
                        <th className="px-6 py-4">商品名稱 / 日期</th>
                        <th className="px-6 py-4">所選籤號</th>
                        <th className="px-6 py-4 text-right">消耗代幣(G)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {drawHistory.map((item) => {
                        const isExpanded = expandedDrawId === item.id;
                        return (
                          <React.Fragment key={item.id}>
                            <tr onClick={() => setExpandedDrawId(isExpanded ? null : item.id)} className="hover:bg-neutral-50/50 transition-all cursor-pointer group">
                              <td className="px-6 py-5"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-neutral-100 text-neutral-400 transition-all group-hover:bg-white group-hover:shadow-soft", isExpanded && "rotate-180 bg-primary text-white")}><ChevronDown className="w-4 h-4 stroke-[3]" /></div></td>
                              <td className="px-6 py-5"><div className="text-sm font-black text-neutral-900 leading-tight tracking-tight">{item.product}</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{item.date}</div></td>
                              <td className="px-6 py-5"><div className="flex flex-wrap gap-1.5">{item.tickets.map(t => (<span key={t} className="px-2 py-1 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-black font-amount border border-neutral-100">{t}</span>))}</div></td>
                              <td className="px-6 py-5 text-right"><div className="flex items-center justify-end gap-2"><div className="w-4 h-4 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm"><span className="text-[11px] text-white font-black leading-none">G</span></div><span className="text-xl font-black text-accent-red font-amount tracking-tighter leading-none">{item.cost.toLocaleString()}</span></div></td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={4} className="px-0 py-0">
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-neutral-50/30">
                                      <div className="py-6 px-8 lg:px-24 border-y border-neutral-100/50">
                                        <div className="text-[13px] font-black text-neutral-400 uppercase tracking-widest mb-4">獲得獎項明細</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {item.items.map((result, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-100 shadow-soft">
                                              <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[13px] font-black rounded-md border border-accent-red/10 uppercase">{result.grade}</span>
                                              <span className="text-sm font-black text-neutral-700 truncate">{result.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'topup-history':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">儲值紀錄</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您的代幣儲值明細</p>
              </div>
              <div className="px-3 py-1 bg-neutral-50 rounded-xl lg:rounded-2xl border border-neutral-100 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest w-fit">
                共 {topupHistory.length} 筆紀錄
              </div>
            </div>
            
            {topupHistory.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">尚無儲值紀錄</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Style */}
                <div className="md:hidden space-y-3">
                  {topupHistory.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-neutral-100 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400">
                            {item.payment_method === 'credit_card' ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-[13px] font-black text-neutral-900">儲值 <span className="font-amount">{item.points.toLocaleString()} G</span></div>
                            <div className="text-[11px] text-neutral-400 font-bold">{new Date(item.created_at).toLocaleString('zh-TW')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-neutral-900 font-amount">NT$ {item.amount.toLocaleString()}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-accent-emerald/10 text-accent-emerald uppercase tracking-wider">
                            {item.status === 'paid' ? '成功' : item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-8 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-neutral-50/50 border-y border-neutral-50 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="px-6 py-4">交易日期</th>
                        <th className="px-6 py-4">儲值方案</th>
                        <th className="px-6 py-4">付款方式</th>
                        <th className="px-6 py-4">交易金額</th>
                        <th className="px-6 py-4 text-right">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {topupHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50/50 transition-all">
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-neutral-900 font-amount">{new Date(item.created_at).toLocaleString('zh-TW')}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm">
                                <span className="text-[10px] text-white font-black">G</span>
                              </div>
                              <span className="text-sm font-black text-neutral-900 font-amount">{item.points.toLocaleString()} G</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[13px] font-bold text-neutral-500 flex items-center gap-2">
                              {item.payment_method === 'credit_card' ? '信用卡支付' : item.payment_method}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-neutral-900 font-amount">NT$ {item.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-black bg-accent-emerald/10 text-accent-emerald uppercase tracking-wider border border-accent-emerald/10">
                              {item.status === 'paid' ? '交易成功' : item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'follows':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">我的關注</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">您感興趣的商品清單</p>
              </div>
            </div>

            {followedProducts.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">尚無關注商品</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* Product Cards would go here */}
                 {followedProducts.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                       <img src={product.image || '/images/item.png'} className="w-full aspect-square object-cover rounded-xl mb-3 bg-neutral-100" />
                       <h4 className="font-black text-neutral-900 text-sm truncate">{product.name}</h4>
                    </div>
                 ))}
              </div>
            )}
          </div>
        );
      case 'coupons':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">我的優惠券</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">查看與使用您的優惠券</p>
              </div>
              <div className="px-3 py-1 bg-neutral-50 rounded-xl lg:rounded-2xl border border-neutral-100 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest w-fit">
                共 {coupons.length} 張優惠券
              </div>
            </div>

            {coupons.length === 0 ? (
              <div className="py-20 text-center text-neutral-400">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest">目前沒有可用的優惠券</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all" />
                    
                    <div className="relative z-10">
                      <span className={cn(
                        "absolute top-0 right-0 px-2 py-1 rounded-lg text-[13px] font-black uppercase tracking-wider",
                        coupon.status === 'unused' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                      )}>
                        {coupon.status === 'unused' ? '可使用' : coupon.status === 'used' ? '已使用' : '已過期'}
                      </span>
                      
                      <h4 className="text-lg font-black text-neutral-900 mb-1 pr-16 pt-1">{coupon.title}</h4>
                      <p className="text-[13px] text-neutral-500 font-bold mb-3">{coupon.description}</p>
                      
                      <div className="pt-3 border-t border-dashed border-neutral-200 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-neutral-400 font-black uppercase tracking-wider">折扣內容</span>
                          <span className="text-lg font-black text-pink-500 font-amount">
                            {coupon.discountType === 'fixed' ? `$${coupon.discountValue}` : `${coupon.discountValue}% OFF`}
                          </span>
                        </div>
                         <div className="flex flex-col text-right">
                          <span className="text-[13px] text-neutral-400 font-black uppercase tracking-wider">有效期限</span>
                          <span className="text-[13px] font-bold text-neutral-600 font-mono">
                             {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : '無期限'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tight">帳戶設定</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您的個人資料與配送資訊</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
              {/* Profile Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <User className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900">基本資料</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">顯示暱稱</label>
                    <input 
                      type="text" 
                      value={settingsForm.nickname}
                      onChange={(e) => setSettingsForm({...settingsForm, nickname: e.target.value})}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">電子信箱</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-bold text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <Truck className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900">預設配送資訊</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">收件人姓名</label>
                    <input 
                      type="text" 
                      value={settingsForm.recipientName}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientName: e.target.value})}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">聯絡電話</label>
                    <input 
                      type="tel" 
                      value={settingsForm.recipientPhone}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientPhone: e.target.value})}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">收件地址</label>
                    <input 
                      type="text" 
                      value={settingsForm.recipientAddress}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientAddress: e.target.value})}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <Lock className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900">帳號安全</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-wider">修改密碼</label>
                  <input 
                    type="password" 
                    placeholder="輸入新密碼 (若不修改請留空)"
                    value={settingsForm.password}
                    onChange={(e) => setSettingsForm({...settingsForm, password: e.target.value})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 hidden md:flex justify-end">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isUpdatingProfile ? '儲存中...' : '儲存變更'}
                </button>
              </div>

              {/* Mobile Fixed Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 h-16 px-4 flex items-center md:hidden z-50 shadow-modal">
                 <div className="w-full">
                   <button 
                      type="submit" 
                      disabled={isUpdatingProfile}
                      className="w-full h-[48px] bg-primary text-white text-lg rounded-xl font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
                    >
                      {isUpdatingProfile ? '儲存中...' : '儲存變更'}
                    </button>
                 </div>
              </div>
            </form>
          </div>
        );
      default:
        return (
          <div className="p-8 text-center text-neutral-400 font-black uppercase tracking-widest">
            頁面開發中...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-start relative">
          
          {/* 1. Mobile Menu View (Only shown on mobile when no tab is active) */}
          <div className={cn("md:hidden col-span-1 space-y-2.5", isMobileDetailOpen && "hidden")}>
            {/* User Info + Settings Icon */}
            <div className="flex items-center justify-between px-0 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-soft">
                  <img src={user.avatar_url || 'https://github.com/shadcn.png'} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-neutral-900 leading-tight">{user.name}</h2>
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5" onClick={() => {
                    if (user.invite_code) {
                      navigator.clipboard.writeText(user.invite_code);
                      toast.success('邀請碼已複製');
                    }
                  }}>
                    <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 rounded-lg active:scale-95 transition-transform cursor-pointer">
                      <span className="text-[13px] font-black text-neutral-400">邀請碼：</span>
                      <span className="text-[13px] font-mono font-black text-primary">{user.invite_code || '-'}</span>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleTabChange('settings')}
                  className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center text-neutral-400 hover:text-primary transition-colors border border-neutral-100"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="mx-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-3.5 shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 opacity-80">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-[14px] font-black uppercase tracking-widest">代幣餘額</span>
                  </div>
                  <button onClick={() => handleTabChange('topup-history')} className="flex items-center gap-0.5 text-[14px] font-black bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30 transition-colors">
                    儲值紀錄 <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center shadow-inner">
                      <span className="text-xs text-white font-black leading-none">G</span>
                    </div>
                    <span className="text-2xl font-black font-amount tracking-tighter leading-none">{user.points.toLocaleString()}</span>
                  </div>
                  <Link href="/topup" className="bg-accent-yellow text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-accent-yellow/30 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Menu List */}
            <div className="mx-0 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
              {navItems.filter(item => item.id !== 'topup-history').map((item) => (
                <button key={item.id} onClick={() => handleTabChange(item.id as TabType)} className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[14px] font-black text-neutral-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* Info Menu List */}
            <div className="mx-0 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
              {[
                { id: 'faq', label: '常見問題', icon: HelpCircle, color: 'text-neutral-400', href: '/faq' },
                { id: 'about', label: '關於我們', icon: Info, color: 'text-neutral-400', href: '/about' },
                { id: 'terms', label: '會員條款', icon: FileText, color: 'text-neutral-400', href: '/terms' },
                { id: 'privacy', label: '隱私權政策', icon: Shield, color: 'text-neutral-400', href: '/privacy' },
                { id: 'return-policy', label: '退換貨資訊', icon: RefreshCcw, color: 'text-neutral-400', href: '/return-policy' },
              ].map((item) => (
                <Link key={item.id} href={item.href} className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-7 h-7 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span className="text-[13px] font-bold text-neutral-500">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-200" />
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="mx-0">
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-between p-2.5 bg-white rounded-2xl hover:bg-neutral-50 transition-colors group border border-neutral-100 shadow-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-400">
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-500">登出</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-200" />
              </button>
            </div>

            {/* Mobile Footer Copyright */}
            <div className="py-6 text-center">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                © 2025 史萊姆股份有限公司 All Rights Reserved
              </p>
            </div>
          </div>

          {/* 2. Mobile Detail View (Only shown on mobile when a tab is active) */}
          <div className={cn("md:hidden col-span-1", !isMobileDetailOpen && "hidden")}>
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 min-h-[500px] overflow-hidden">
              {renderTabContent()}
            </div>
          </div>

          {/* 3. Desktop View (Hidden on mobile) */}
          <div className="hidden md:grid md:col-span-12 grid-cols-12 gap-4 lg:gap-8 w-full">
            <div className="md:col-span-4 lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl lg:rounded-4xl shadow-card border border-neutral-100 dark:border-neutral-800 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
                  <div className="relative flex-shrink-0 mx-auto lg:mx-0">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-3xl overflow-hidden border-2 border-neutral-50 dark:border-neutral-800 shadow-soft p-1 bg-white dark:bg-neutral-800">
                      <img src={user.avatar_url || 'https://github.com/shadcn.png'} alt={user.name} className="w-full h-full rounded-[20px] object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 h-5 bg-accent-emerald border-4 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0 text-center lg:text-left">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-center lg:justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h2 className="text-lg lg:text-xl font-black text-neutral-900 dark:text-white truncate tracking-tight">{user.name}</h2>
                          <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start">
                         <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-700 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group/invite" onClick={() => {
                           if (user.invite_code) {
                             navigator.clipboard.writeText(user.invite_code);
                             toast.success('邀請碼已複製');
                           }
                        }}>
                          <span className="text-[13px] font-black text-neutral-400 uppercase tracking-wider">邀請碼：</span>
                          <span className="text-[13px] font-mono font-black text-primary group-hover/invite:text-primary/80 transition-colors">{user.invite_code || '-'}</span>
                          <Copy className="w-3.5 h-3.5 text-neutral-300 group-hover/invite:text-primary transition-colors" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center lg:justify-between">
                        <div className="hidden lg:flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-2xl border border-neutral-100/50 dark:border-neutral-700/50 flex-shrink-0">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-accent-yellow shadow-sm">
                            <span className="text-[11px] text-white font-black leading-none">G</span>
                          </div>
                          <span className="text-lg font-black text-accent-red font-amount leading-none tracking-tighter">{user.points.toLocaleString()}</span>
                        </div>
                        <Link href="/topup" className="hidden lg:block text-sm font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">儲值</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-3xl lg:rounded-4xl shadow-card border border-neutral-100 dark:border-neutral-800 p-3 lg:p-4 overflow-hidden">
                <div className="flex items-center gap-3 mb-3 lg:mb-4 px-3 pt-2">
                  <h3 className="text-[12px] lg:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">帳戶選單</h3>
                </div>
                <div className="space-y-0.5 lg:space-y-1">
                  {navItems.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => handleTabChange(item.id as TabType)} 
                      className={cn(
                        "w-full flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-[13px] lg:text-sm font-black transition-all group text-left", 
                        activeTab === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 lg:w-5 h-5 stroke-[2.5]", activeTab === item.id ? "text-white" : "text-neutral-300 group-hover:text-primary transition-colors")} />
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className={cn("ml-auto w-3.5 h-3.5 lg:w-4 h-4 transition-transform hidden sm:block", activeTab === item.id ? "text-white/50" : "text-neutral-200 group-hover:text-neutral-400")} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-8 lg:col-span-8 w-full">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl lg:rounded-4xl shadow-card border border-neutral-100 dark:border-neutral-800 min-h-[600px] lg:min-h-[700px] overflow-hidden">
                {renderTabContent()}
              </div>
            </div>
          </div>

        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}
