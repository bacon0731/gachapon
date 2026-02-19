'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Truck, 
  Trophy, 
  Settings, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Info,
  FileText,
  Shield,
  RefreshCcw,
  RefreshCw,
  Wallet,
  Clock,
  Heart,
  User,
  Lock,
  ChevronDown,
  X,
  Loader2,
  CreditCard,
  Copy,
  Ticket,
  Tag,
  CalendarCheck,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast, Toaster } from 'sonner';
import { ProfileSkeleton } from '@/components/Skeletons';
import { WarehouseItemDetailModal } from '@/components/warehouse/WarehouseItemDetailModal';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';

import DailyCheckInTab from '@/components/profile/DailyCheckInTab';

// --- Interfaces ---
interface MarketListing {
  id: string;
  draw_record_id: number;
  price: number;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    image: string;
    grade: string;
    series: string;
  };
  buyer?: {
    name: string;
  };
}

interface DismantledItem {
  id: string;
  name: string;
  series: string;
  grade: string;
  image: string;
  dismantled_at: string;
  recycleValue: number;
}

interface WarehouseItem {
  id: string;
  name: string;
  series: string;
  grade: string;
  status: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged';
  image: string;
  date: string;
  ticketNo: string;
  recycleValue: number;
}

interface DeliveryOrder {
  id: string;
  order_number?: string;
  itemsCount: number;
  items: { grade: string; name: string }[];
  status: 'submitted' | 'processing' | 'picked_up' | 'shipping' | 'delivered' | 'cancelled' | string;
  date: string;
  tracking: string;
  method: string;
  arrivalDate: string;
}

interface DrawHistoryItem {
  id: string;
  productId: number;
  product: string;
  date: string;
  tickets: string[];
  cost: number;
  items: { grade: string; name: string; ticket_number: string; txid_hash?: string }[];
}

interface FollowedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  status: 'selling' | 'soldout' | 'coming_soon';
}

const MAJOR_LEVELS = ['SP賞', 'S賞', 'A賞', 'B賞', 'C賞', 'LAST ONE', '最後賞'];

const isMajorGrade = (grade: string | undefined | null) => {
  if (!grade) return false;
  const trimmed = grade.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'LAST ONE' || trimmed === '最後賞') return true;
  return MAJOR_LEVELS.includes(trimmed) || MAJOR_LEVELS.includes(upper);
};

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

interface TopupHistoryItem {
  id: string;
  order_number: string;
  payment_method: string;
  amount: number;
  points: number;
  status: string;
  created_at: string;
}

type TabType = 'check-in' | 'warehouse' | 'market' | 'delivery' | 'draw-history' | 'topup-history' | 'follows' | 'coupons' | 'settings';

interface DbListing {
  id: number;
  draw_records: {
    id: number;
    product_prizes: { name: string; level: string; image_url: string };
    products: { name: string };
  };
  price: number;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
  marketplace_transactions: {
    buyer_id: string;
    users: { name: string };
  }[];
}

interface DbOrder {
  id: string;
  order_number?: string;
  created_at: string;
  tracking_number: string | null;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  draw_records: {
    product_prizes: {
      level: string;
      name: string;
    } | null;
  }[];
}

interface DbFollow {
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    status: 'selling' | 'soldout' | 'coming_soon';
  };
}

interface DbCoupon {
  id: string;
  status: 'unused' | 'used' | 'expired';
  expiry_date: string;
  coupons: {
    id: string;
    title: string;
    description: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    min_spend: number;
    code: string;
  };
}

interface DbTopup {
  id: string;
  order_number: string;
  amount: number;
  bonus: number;
  status: string;
  created_at: string;
}

interface GroupedDrawHistoryItem {
  _rawDate: string;
  id: number;
  productId: number;
  product: string;
  date: string;
  tickets: string[];
  cost: number;
  items: { grade: string; name: string; ticket_number: string; txid_hash?: string }[];
}

  interface DbDrawRecord {
    id: number;
    product_id: number;
    ticket_number: number;
    created_at: string;
    status: string;
    txid_hash?: string | null;
    prize_level?: string | null;
    prize_name?: string | null;
    product_prizes: {
      level: string;
      name: string;
      image_url: string;
      recycle_value: number;
      total?: number;
    } | null;
    products: {
      name: string;
      price?: number;
    } | null;
  }

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'submitted':
      return { label: '已提交', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    case 'processing':
      return { label: '處理中', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
    case 'picked_up':
      return { label: '物流已收取', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    case 'shipping':
      return { label: '配送中', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    case 'delivered':
      return { label: '已送達', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    case 'cancelled':
      return { label: '已取消', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    default:
      return { label: '未知狀態', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
  }
};

function ProfileContent() {
  const { user, logout, refreshProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const [activeTab, setActiveTab] = useState<TabType>('warehouse');
  const [activeWarehouseTab, setActiveWarehouseTab] = useState<'all' | 'dismantled'>('all');
  const [activeMarketTab, setActiveMarketTab] = useState<'listing' | 'sold'>('listing');
  
  // Data States
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [dismantledItems, setDismantledItems] = useState<DismantledItem[]>([]);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [soldItems, setSoldItems] = useState<MarketListing[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryOrder[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>([]);
  const [topupHistory, setTopupHistory] = useState<TopupHistoryItem[]>([]); 
  const [followedProducts, setFollowedProducts] = useState<FollowedProduct[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // UI States
  const [selectedForDelivery, setSelectedForDelivery] = useState<string[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDismantleModal, setShowDismantleModal] = useState(false);
  const [dismantleSummary, setDismantleSummary] = useState({ count: 0, totalValue: 0 });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [isSubmittingDismantle, setIsSubmittingDismantle] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Market Sell Modal State
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingItem, setSellingItem] = useState<WarehouseItem | null>(null);
  const [viewingItem, setViewingItem] = useState<WarehouseItem | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [isSubmittingSell, setIsSubmittingSell] = useState(false);

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
    if (tab && ['check-in', 'warehouse', 'market', 'delivery', 'draw-history', 'topup-history', 'follows', 'coupons', 'settings'].includes(tab)) {
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
  const fetchUserData = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);

    try {
      if (activeTab === 'warehouse') {
        if (activeWarehouseTab === 'all') {
          const { data, error } = await supabase
            .from('draw_records')
            .select(`
              id,
              ticket_number,
              created_at,
              status,
              prize_level,
              prize_name,
              product_prizes ( level, name, image_url, recycle_value, total ),
              products ( name, price )
            `)
            .eq('user_id', user.id)
            .eq('status', 'in_warehouse')
            .order('created_at', { ascending: false });
            
          if (error) throw error;

          const items = (data as unknown as DbDrawRecord[]).map((item) => {
            let recycleValue = item.product_prizes?.recycle_value || 0;
            const price = item.products?.price || 0;
            const quantity = item.product_prizes?.total || 0;

            const grade = item.product_prizes?.level || item.prize_level || '?';
            const name = item.product_prizes?.name || item.prize_name || '未知獎品';

            if (price > 0) {
              if (quantity >= 1 && quantity <= 4) {
                recycleValue = Math.floor(price / 2);
              } else {
                recycleValue = 50;
              }
            }

            return {
              id: item.id.toString(),
              name,
              series: item.products?.name || '未知系列',
              grade,
              status: item.status as WarehouseItem['status'],
              image: item.product_prizes?.image_url || 'https://placehold.co/400',
              date: new Date(item.created_at).toLocaleString('zh-TW'),
              ticketNo: item.ticket_number?.toString() || '',
              recycleValue
            };
          });
          setWarehouseItems(items);
        } else if (activeWarehouseTab === 'dismantled') {
           const { data, error } = await supabase
            .from('draw_records')
            .select(`
              id,
              created_at,
              status,
              prize_level,
              prize_name,
              product_prizes ( level, name, image_url, recycle_value ),
              products ( name )
            `)
            .eq('user_id', user.id)
            .eq('status', 'dismantled')
            .order('created_at', { ascending: false });
            
          if (error) throw error;

          const items = (data as unknown as DbDrawRecord[]).map((item) => {
            const grade = item.product_prizes?.level || item.prize_level || '?';
            const name = item.product_prizes?.name || item.prize_name || '未知獎品';

            return {
              id: item.id.toString(),
              name,
              series: item.products?.name || '未知系列',
              grade,
              image: item.product_prizes?.image_url || 'https://placehold.co/400',
              dismantled_at: new Date(item.created_at).toLocaleDateString('zh-TW'),
              recycleValue: item.product_prizes?.recycle_value || 0
            };
          });
          setDismantledItems(items);
        }
      } 
      else if (activeTab === 'market') {
        const query = supabase
          .from('marketplace_listings')
          .select(`
            id,
            price,
            status,
            created_at,
            updated_at,
            draw_records (
               id,
               product_prizes ( name, level, image_url ),
               products ( name )
            ),
            marketplace_transactions (
              buyer_id,
              users:buyer_id ( name )
            )
          `)
          .eq('seller_id', user.id)
          .in('status', ['active', 'sold'])
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        const allListings = (data as unknown as DbListing[]).map((item) => ({
          id: item.id.toString(),
          draw_record_id: item.draw_records?.id,
          price: item.price,
          status: item.status,
          created_at: new Date(item.created_at).toLocaleString('zh-TW'),
          updated_at: new Date(item.updated_at).toLocaleString('zh-TW'),
          product: {
            name: item.draw_records?.product_prizes?.name || '未知',
            image: item.draw_records?.product_prizes?.image_url || 'https://placehold.co/400',
            grade: item.draw_records?.product_prizes?.level || '?',
            series: item.draw_records?.products?.name || '未知'
          },
          buyer: item.marketplace_transactions?.[0]?.users?.name ? { name: item.marketplace_transactions[0].users.name } : undefined
        }));

        setMarketListings(allListings.filter(item => item.status === 'active'));
        setSoldItems(allListings.filter(item => item.status === 'sold'));
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

        const orders = (data as unknown as DbOrder[]).map((order) => ({
          id: order.id,
          order_number: order.order_number,
          itemsCount: order.draw_records?.length || 0,
          items: order.draw_records?.map((dh) => ({
            grade: dh.product_prizes?.level || '?',
            name: dh.product_prizes?.name || '未知'
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
            product_id,
            ticket_number,
            created_at,
            prize_level,
            prize_name,
            txid_hash,
            product_prizes ( level, name ),
            products ( name, price )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Group records by created_at (transaction time)
        const groupedHistory: GroupedDrawHistoryItem[] = [];
        
        const records = data as unknown as DbDrawRecord[];
        records.forEach((item) => {
          const currentTimestamp = item.created_at;
          const lastGroup = groupedHistory.length > 0 ? groupedHistory[groupedHistory.length - 1] : null;
          
          const grade = item.product_prizes?.level || item.prize_level || '?';
          const name = item.product_prizes?.name || item.prize_name || '未知';

          if (lastGroup && lastGroup._rawDate === currentTimestamp && lastGroup.product === item.products?.name) {
            lastGroup.tickets.push(item.ticket_number?.toString());
            lastGroup.cost += (item.products?.price || 0);
            lastGroup.items.push({ grade, name, ticket_number: item.ticket_number?.toString(), txid_hash: item.txid_hash || undefined });
          } else {
            groupedHistory.push({
              _rawDate: currentTimestamp,
              id: item.id,
              productId: item.product_id,
              product: item.products?.name || '未知',
              date: new Date(item.created_at).toLocaleString('zh-TW'),
              tickets: [item.ticket_number?.toString()],
              cost: item.products?.price || 0,
              items: [{ grade, name, ticket_number: item.ticket_number?.toString(), txid_hash: item.txid_hash || undefined }]
            });
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const history = groupedHistory.map(({ _rawDate, ...rest }) => rest);
        setDrawHistory(history as unknown as DrawHistoryItem[]);
      }
      else if (activeTab === 'topup-history') {
        const { data, error } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const history = (data as unknown as DbTopup[]).map((item) => ({
          id: item.id,
          order_number: item.order_number,
          payment_method: '系統儲值', // Default since not in recharge_records
          amount: item.amount,
          points: (item.amount || 0) + (item.bonus || 0),
          status: item.status,
          created_at: item.created_at
        }));

        setTopupHistory(history);
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

        const follows = (data as unknown as DbFollow[]).map((item) => ({
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

        const myCoupons = (data as unknown as DbCoupon[]).map((item) => ({
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
  }, [user, activeTab, activeWarehouseTab, activeMarketTab, supabase]);

  const handleRedeemCoupon = async () => {
    if (!user) return;
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('請輸入折價券代碼');
      return;
    }

    setIsRedeemingCoupon(true);
    try {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('id, is_active, min_spend')
        .eq('code', code)
        .maybeSingle();

      if (couponError) throw couponError;
      if (!coupon) {
        toast.error('找不到此折價券代碼');
        return;
      }
      if (!coupon.is_active) {
        toast.error('此折價券已停用');
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        toast.error('此折價券您已領取過');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_coupons')
        .insert({
          user_id: user.id,
          coupon_id: coupon.id,
          status: 'unused',
        });

      if (insertError) throw insertError;

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'coupon',
        title: '折價券領取成功',
        body: '您成功領取一張新的優惠券，可至「我的優惠券」查看詳情。',
        link: '/profile?tab=coupons',
        meta: {
          coupon_id: coupon.id,
          code,
        },
      });

      toast.success('折價券領取成功');
      setCouponCode('');
      await fetchUserData();
    } catch (error) {
      console.error('Redeem coupon error:', error);
      toast.error('折價券領取失敗，請稍後再試');
    } finally {
      setIsRedeemingCoupon(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, activeTab, activeWarehouseTab, activeMarketTab, fetchUserData]);

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
      const date = new Date();
      const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `DEL-${dateStr}-${random}`;

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

      await supabase.from('notifications').insert({
        user_id: user!.id,
        type: 'order_status',
        title: '配送申請已提交',
        body: `您的配送申請已提交，訂單編號：${order.order_number}`,
        link: '/profile?tab=delivery',
        meta: {
          order_id: order.id,
          order_number: order.order_number,
          status: 'submitted',
        },
      });

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

  const handleDismantleClick = () => {
    if (selectedForDelivery.length === 0) return;
    
    const selectedItems = warehouseItems.filter(item => selectedForDelivery.includes(item.id));
    const totalValue = selectedItems.reduce((sum, item) => sum + (item.recycleValue || 0), 0);
    const count = selectedItems.length;
    
    setDismantleSummary({ count, totalValue });
    setShowDismantleModal(true);
  };

  const handleConfirmDismantle = async () => {
    if (selectedForDelivery.length === 0) return;
    setIsSubmittingDismantle(true);

    try {
      const { error } = await supabase.rpc('dismantle_prizes', {
        p_record_ids: selectedForDelivery.map(id => Number(id)),
        p_user_id: user!.id
      });

      if (error) throw error;

      toast.success(`成功分解 ${dismantleSummary.count} 件獎項，獲得 ${dismantleSummary.totalValue} 代幣！`);
      setShowDismantleModal(false);
      setSelectedForDelivery([]);
      fetchUserData(); // Refresh list and balance
      // Refresh user balance in context if needed, but fetchUserData updates the local state? 
      // Wait, fetchUserData updates warehouseItems and other lists. 
      // Does it update user balance? 
      // The user balance is usually in the layout or context. 
      // Checking fetchUserData... it calls fetchUserOrders etc.
      // I might need to refresh the user profile to get the new balance.
      // Line 434 calls refreshProfile(). I should call that too.
      await refreshProfile();
      
    } catch (error) {
      console.error('Dismantle Error:', error);
      toast.error('分解失敗，請稍後再試');
    } finally {
      setIsSubmittingDismantle(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const updates = {
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

  const handleSellClick = (item: WarehouseItem) => {
    setSellingItem(item);
    setSellPrice(0);
    setShowSellModal(true);
  };

  const handleConfirmSell = async () => {
    if (!sellingItem || !sellPrice || sellPrice <= 0) return;
    setIsSubmittingSell(true);

    try {
      const { data, error } = await supabase.rpc('create_listing', {
        p_record_id: Number(sellingItem.id),
        p_price: sellPrice,
        p_user_id: user!.id
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast.success('上架成功！');
      setShowSellModal(false);
      setSellingItem(null);
      setSelectedForDelivery([]); // Clear selection
      fetchUserData(); // Refresh list
    } catch (error) {
      console.error('Sell Error:', error);
      toast.error((error as Error).message || '上架失敗，請稍後再試');
    } finally {
      setIsSubmittingSell(false);
    }
  };

  const cancelListing = async (listingId: string) => {
    try {
      const { data, error } = await supabase.rpc('cancel_listing', {
        p_listing_id: Number(listingId),
        p_user_id: user!.id
      });

      if (error) throw error;
      if (data.success) {
        toast.success(data.message);
        fetchUserData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Cancel listing error:', error);
      toast.error((error as Error).message || '取消上架失敗');
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
    { id: 'market', label: '市集管理', icon: Store, color: 'text-purple-500' },
    { id: 'check-in', label: '每日簽到', icon: CalendarCheck, color: 'text-orange-500' },
    { id: 'follows', label: '我的關注', icon: Heart, color: 'text-accent-red' },
    { id: 'delivery', label: '配送訂單', icon: Truck, color: 'text-accent-emerald' },
    { id: 'draw-history', label: '抽獎紀錄', icon: Trophy, color: 'text-accent-yellow' },
    { id: 'topup-history', label: '儲值紀錄', icon: Wallet, color: 'text-blue-500' },
    { id: 'coupons', label: '我的優惠券', icon: Ticket, color: 'text-pink-500' },
    { id: 'settings', label: '設定', icon: Settings, color: 'text-neutral-500' },
  ];

  const renderTabContent = () => {
    // Determine if we should show a full page skeleton (e.g., initial load or non-warehouse tabs)
    // For warehouse tab, we want to keep the header visible during sub-tab switches
    if (isLoadingData && activeTab !== 'warehouse') {
      return (
        <div className="p-3 lg:p-8">
          <ProfileSkeleton />
        </div>
      );
    }

    switch (activeTab) {
      case 'check-in':
        return (
          <div className="p-3 lg:p-8">
            <DailyCheckInTab />
          </div>
        );
      case 'warehouse':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">我的倉庫</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您獲得的獎項，隨時申請出貨</p>
              </div>
              <div className="flex items-center gap-3">
                {activeWarehouseTab === 'all' && selectedForDelivery.length > 0 && (
                  <>
                    {/* Desktop Bulk Actions */}
                    <div className="hidden md:flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedForDelivery([])}
                        className="px-3 py-2 text-neutral-400 hover:text-neutral-600 text-[13px] font-black transition-colors"
                      >
                        重選
                      </button>
                      <button 
                        onClick={handleDismantleClick}
                        className="flex items-center justify-center bg-accent-red text-white px-4 py-2 rounded-xl lg:rounded-2xl shadow-lg shadow-accent-red/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                      >
                        <span className="text-[13px] font-black">分解 ({selectedForDelivery.length})</span>
                      </button>
                      {(() => {
                        if (selectedForDelivery.length !== 1) return null;
                        const item = warehouseItems.find(i => i.id === selectedForDelivery[0]);
                        if (!item || !isMajorGrade(item.grade)) return null;
                        return (
                          <button
                            onClick={() => handleSellClick(item)}
                            className="flex items-center justify-center bg-accent-yellow text-white px-4 py-2 rounded-xl lg:rounded-2xl shadow-lg shadow-accent-yellow/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                          >
                            <span className="text-[13px] font-black">上架市集</span>
                          </button>
                        );
                      })()}
                      <button 
                        onClick={() => setShowDeliveryModal(true)}
                        className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-xl lg:rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                      >
                        <span className="text-[13px] font-black">申請配送 ({selectedForDelivery.length})</span>
                      </button>
                    </div>

                    {/* Mobile Fixed Bulk Actions Bar */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800 h-16 px-4 flex items-center justify-between md:hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-neutral-900 dark:text-white">已選 {selectedForDelivery.length}</span>
                         <button 
                           onClick={() => setSelectedForDelivery([])} 
                           className="text-xs text-neutral-400 font-bold px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                         >
                           重選
                         </button>
                      </div>
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={handleDismantleClick} 
                           className="bg-accent-red text-white px-3 py-2 rounded-xl shadow-lg shadow-accent-red/20 text-xs font-black"
                         >
                           分解
                         </button>
                         {(() => {
                           if (selectedForDelivery.length !== 1) return null;
                           const item = warehouseItems.find(i => i.id === selectedForDelivery[0]);
                           if (!item || !isMajorGrade(item.grade)) return null;
                           return (
                             <button
                               onClick={() => handleSellClick(item)}
                               className="bg-accent-yellow text-white px-3 py-2 rounded-xl shadow-lg shadow-accent-yellow/20 text-xs font-black"
                             >
                               上架
                             </button>
                           );
                         })()}
                         <button 
                           onClick={() => setShowDeliveryModal(true)} 
                           className="bg-primary text-white px-3 py-2 rounded-xl shadow-lg shadow-primary/20 text-xs font-black"
                         >
                           配送
                         </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveWarehouseTab('all')}
                className={cn("px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap", activeWarehouseTab === 'all' ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 dark:bg-white dark:text-neutral-900" : "bg-white text-neutral-400 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700")}
              >
                全部獎項 ({warehouseItems.length})
              </button>
              <button 
                onClick={() => setActiveWarehouseTab('dismantled')}
                className={cn("px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap", activeWarehouseTab === 'dismantled' ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 dark:bg-white dark:text-neutral-900" : "bg-white text-neutral-400 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700")}
              >
                已分解 ({dismantledItems.length})
              </button>
            </div>

            {isLoadingData ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl animate-pulse">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      <div className="h-3 w-1/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
                    </div>
                    <div className="h-8 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : activeWarehouseTab === 'all' ? (
              <>
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
                            className={cn("bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm relative overflow-hidden transition-all active:scale-95", isSelected ? "border-accent-emerald ring-2 ring-accent-emerald/20" : "border-neutral-100 dark:border-neutral-800")}
                          >
                            <div className="aspect-square bg-[#28324E] relative">
                              <Image 
                                src={item.image || '/images/item.png'} 
                                alt={item.name} 
                                fill 
                                className="object-cover" 
                                unoptimized
                              />
                              <div 
                                className="absolute top-2 right-2 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDeliverySelection(item.id);
                                }}
                              >
                                 <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-white", isSelected ? "border-accent-emerald bg-accent-emerald" : "border-neutral-200")}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2">
                                <span className="px-2 py-0.5 bg-accent-red text-white text-[10px] font-black rounded-md uppercase">{item.grade}</span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="text-[13px] font-black text-neutral-900 dark:text-white leading-tight line-clamp-2 min-h-[2.5em]">{item.name}</h4>
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
                          <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-100 dark:border-neutral-800 text-[12px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                            <th className="w-12 lg:w-16 px-3 lg:px-4 py-2 lg:py-3"></th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">賞別</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">獎項內容</th>
                            <th className="hidden xl:table-cell px-3 lg:px-4 py-2 lg:py-3">獲得日期</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3 text-right">籤號</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {warehouseItems.map((item) => {
                            const isSelected = selectedForDelivery.includes(item.id);
                            return (
                              <tr key={item.id} onClick={() => toggleDeliverySelection(item.id)} className={cn("transition-all group cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50", isSelected && "bg-accent-emerald/5 hover:bg-accent-emerald/10")}>
                                <td 
                                  className="px-3 lg:px-4 py-2 lg:py-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDeliverySelection(item.id);
                                  }}
                                >
                                  <div className={cn("w-5 h-5 lg:w-6 lg:h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 shadow-sm", isSelected ? "bg-accent-emerald border-accent-emerald" : "border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800")}>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 h-4 text-white stroke-[3]" />}
                                  </div>
                                </td>
                                <td className="px-3 lg:px-4 py-2 lg:py-3">
                                  <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-accent-red/10 text-accent-red text-[12px] lg:text-[13px] font-black rounded-lg border border-accent-red/10 uppercase tracking-wider">{item.grade}</span>
                                </td>
                                <td className="px-3 lg:px-4 py-2 lg:py-3">
                                  <div className="flex items-center gap-3 lg:gap-4">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#28324E] overflow-hidden flex-shrink-0 shadow-soft relative">
                                      <Image 
                                        src={item.image || '/images/item.png'} 
                                        alt={item.name} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                                        unoptimized
                                      />
                                    </div>
                                    <div className="space-y-0.5 lg:space-y-1 min-w-0">
                                      <div className="text-[13px] lg:text-[14px] font-black text-neutral-900 dark:text-white leading-tight truncate tracking-tight">{item.name}</div>
                                      <div className="text-[11px] lg:text-[13px] text-neutral-400 font-black uppercase tracking-widest truncate">{item.series}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden xl:table-cell px-3 lg:px-4 py-2 lg:py-3"><div className="text-[12px] lg:text-[13px] font-black text-neutral-400 flex items-center gap-2">{item.date}</div></td>
                                <td className="px-3 lg:px-4 py-2 lg:py-3 text-right">
                                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-[8px] text-xs font-black font-amount border border-neutral-100 dark:border-neutral-800">
                                    {item.ticketNo}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {dismantledItems.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black text-sm uppercase tracking-widest">尚無分解紀錄</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Grid for Dismantled */}
                    <div className="md:hidden grid grid-cols-2 gap-3">
                      {dismantledItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 space-y-3 shadow-sm relative overflow-hidden opacity-75 grayscale-[0.5]">
                          <div className="aspect-square bg-[#28324E] rounded-xl overflow-hidden relative">
                            <Image 
                              src={item.image || '/images/item.png'} 
                              alt={item.name} 
                              fill 
                              className="object-cover" 
                              unoptimized
                            />
                            <div className="absolute bottom-2 left-2">
                              <span className="px-2 py-0.5 bg-neutral-600 text-white text-[10px] font-black rounded-md uppercase">{item.grade}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black text-neutral-900 dark:text-white leading-tight line-clamp-2 min-h-[2.5em]">{item.name}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] text-neutral-400 font-bold">{item.dismantled_at}</span>
                              <span className="text-[11px] font-black text-accent-red">+{item.recycleValue} G</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table for Dismantled */}
                    <div className="hidden md:block overflow-x-auto -mx-3 lg:-mx-8 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[550px] lg:min-w-[600px]">
                        <thead>
                          <tr className="bg-neutral-50/50 border-y border-neutral-50 text-[12px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                            <th className="px-3 lg:px-4 py-2 lg:py-3">賞別</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">獎項內容</th>
                            <th className="hidden xl:table-cell px-3 lg:px-4 py-2 lg:py-3">分解日期</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3 text-right">獲得代幣</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                          {dismantledItems.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50 transition-all opacity-75 hover:opacity-100">
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-accent-red/10 text-accent-red text-[12px] lg:text-[13px] font-black rounded-lg border border-accent-red/10 uppercase tracking-wider">{item.grade}</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <div className="flex items-center gap-3 lg:gap-4">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#28324E] overflow-hidden flex-shrink-0 shadow-soft relative">
                                    <Image 
                                      src={item.image || '/images/item.png'} 
                                      alt={item.name} 
                                      fill 
                                      className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                                      unoptimized
                                    />
                                  </div>
                                  <div className="space-y-0.5 lg:space-y-1 min-w-0">
                                    <div className="text-[13px] lg:text-[14px] font-black text-neutral-900 dark:text-white leading-tight truncate tracking-tight">{item.name}</div>
                                    <div className="text-[11px] lg:text-[13px] text-neutral-400 font-black uppercase tracking-widest truncate">{item.series}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden xl:table-cell px-3 lg:px-4 py-2 lg:py-3"><div className="text-[12px] lg:text-[13px] font-black text-neutral-400 flex items-center gap-2">{item.dismantled_at}</div></td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3 text-right">
                                <span className="flex items-center justify-end gap-1 text-sm lg:text-base font-black text-accent-red tracking-tighter">
                                  +{item.recycleValue} G
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}


            {/* Delivery Modal */}
            <AnimatePresence>
              {showDeliveryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white">確認配送資訊</h3>
                      <button onClick={() => setShowDeliveryModal(false)} className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 dark:text-neutral-400 font-bold">配送件數</span>
                          <span className="font-black text-neutral-900 dark:text-white">{selectedForDelivery.length.toLocaleString()} 件</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 dark:text-neutral-400 font-bold">運費</span>
                          <span className="font-black text-primary">免運費</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-black text-neutral-900 dark:text-white">收件人資訊</p>
                         <div className="grid grid-cols-1 gap-3">
                           <input 
                             value={settingsForm.recipientName} 
                             onChange={e => setSettingsForm({...settingsForm, recipientName: e.target.value})}
                             placeholder="收件人姓名" 
                             className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                           <input 
                             value={settingsForm.recipientPhone}
                             onChange={e => setSettingsForm({...settingsForm, recipientPhone: e.target.value})}
                             placeholder="聯絡電話" 
                             className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                           <input 
                             value={settingsForm.recipientAddress}
                             onChange={e => setSettingsForm({...settingsForm, recipientAddress: e.target.value})}
                             placeholder="收件地址" 
                             className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                           />
                         </div>
                         {!settingsForm.recipientName || !settingsForm.recipientPhone || !settingsForm.recipientAddress ? (
                           <p className="text-xs text-accent-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 請填寫完整收件資訊</p>
                         ) : null}
                      </div>
                    </div>
                    <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex gap-3">
                      <button onClick={() => setShowDeliveryModal(false)} className="flex-1 py-3 rounded-xl font-black text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">取消</button>
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
            {/* Dismantle Modal */}
            <AnimatePresence>
              {showDismantleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white">確認分解項目</h3>
                      <button onClick={() => setShowDismantleModal(false)} className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 dark:text-neutral-400 font-bold">分解數量</span>
                          <span className="font-black text-neutral-900 dark:text-white">{dismantleSummary.count.toLocaleString()} 件</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500 dark:text-neutral-400 font-bold">預計獲得代幣</span>
                          <span className="font-black text-accent-red flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" />
                            {dismantleSummary.totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-accent-red/5 dark:bg-accent-red/10 rounded-xl border border-accent-red/10 dark:border-accent-red/20">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-black text-accent-red">注意：分解後無法復原</p>
                            <p className="text-xs text-accent-red/80 font-bold leading-relaxed">
                              確認分解後，獎項將會從倉庫移除並轉換為代幣。代幣可用於再次抽獎或兌換其他商品。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex gap-3">
                      <button onClick={() => setShowDismantleModal(false)} className="flex-1 py-3 rounded-xl font-black text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">取消</button>
                      <button 
                        onClick={handleConfirmDismantle}
                        disabled={isSubmittingDismantle}
                        className="flex-1 py-3 bg-accent-red text-white rounded-xl font-black shadow-lg shadow-accent-red/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSubmittingDismantle ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>處理中...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>確認分解</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            {/* Sell Modal */}
            <AnimatePresence>
              {showSellModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white">上架市集</h3>
                      <button onClick={() => setShowSellModal(false)} className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {sellingItem && (
                        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl flex items-center gap-4">
                          <Image 
                            src={sellingItem.image || '/images/item.png'} 
                            alt={sellingItem.name} 
                            width={64} 
                            height={64} 
                            className="object-cover rounded-lg bg-white dark:bg-neutral-700" 
                            unoptimized
                          />
                          <div>
                            <span className="px-2 py-0.5 bg-accent-red text-white text-[10px] font-black rounded-md uppercase">{sellingItem.grade}</span>
                            <h4 className="text-sm font-black text-neutral-900 dark:text-white mt-1 line-clamp-1">{sellingItem.name}</h4>
                            <p className="text-xs text-neutral-400 font-bold mt-0.5">{sellingItem.series}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-black text-neutral-500 dark:text-neutral-400">設定價格 (代幣)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1"
                            value={sellPrice === 0 ? '' : sellPrice} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setSellPrice(0);
                                return;
                              }
                              let num = parseInt(val);
                              if (!isNaN(num)) {
                                if (num > 50000) {
                                  num = 50000;
                                }
                                setSellPrice(num);
                                // Remove leading zeros immediately if the input differs from the parsed number
                                if (val !== num.toString()) {
                                  e.target.value = num.toString();
                                }
                              }
                            }}
                            className="w-full h-12 pl-4 pr-12 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-black text-neutral-900 dark:text-white"
                            placeholder="輸入價格"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-black text-sm">代幣</div>
                        </div>
                      </div>

                      <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-black text-neutral-900 dark:text-white">上架須知</p>
                            <ul className="text-xs text-neutral-500 dark:text-neutral-400 font-bold leading-relaxed list-disc list-inside">
                              <li>平台將收取 5% 手續費</li>
                              <li>實際上架後，獎項將從倉庫中暫時移除</li>
                              <li>成交後獎項將綁定買家，無法再次交易</li>
                            </ul>
                            <div className="pt-2 flex justify-between text-sm font-black text-neutral-700 dark:text-neutral-300 border-t border-neutral-200 dark:border-neutral-700 mt-2">
                              <span>預計手續費 (5%)</span>
                              <span>{Math.floor(sellPrice * 0.05).toLocaleString()} 代幣</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-neutral-900 dark:text-white">
                              <span>預計實收</span>
                              <span>{(sellPrice - Math.floor(sellPrice * 0.05)).toLocaleString()} 代幣</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex gap-3">
                      <button onClick={() => setShowSellModal(false)} className="flex-1 py-3 rounded-xl font-black text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">取消</button>
                      <button 
                        onClick={handleConfirmSell}
                        disabled={isSubmittingSell || sellPrice <= 0}
                        className="flex-1 py-3 bg-accent-yellow text-white rounded-xl font-black shadow-lg shadow-accent-yellow/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSubmittingSell ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>處理中...</span>
                          </>
                        ) : (
                          <>
                            <Tag className="w-4 h-4" />
                            <span>確認上架</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Warehouse Item Detail Modal */}
            <WarehouseItemDetailModal
              item={viewingItem}
              isOpen={!!viewingItem}
              onClose={() => setViewingItem(null)}
            />
          </div>
        );
      case 'market':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">市集管理</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您的上架獎項與交易紀錄</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveMarketTab('listing')}
                className={cn("px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap", activeMarketTab === 'listing' ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20" : "bg-white dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700")}
              >
                上架中 ({marketListings.length})
              </button>
              <button 
                onClick={() => setActiveMarketTab('sold')}
                className={cn("px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap", activeMarketTab === 'sold' ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20" : "bg-white dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700")}
              >
                已售出 ({soldItems.length})
              </button>
            </div>

            {activeMarketTab === 'listing' ? (
              <>
                {marketListings.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black text-sm uppercase tracking-widest">目前沒有上架獎項</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Style */}
                    <div className="md:hidden space-y-3">
                      {marketListings.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 space-y-3 shadow-sm relative overflow-hidden">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-[#28324E] rounded-xl overflow-hidden flex-shrink-0 relative">
                               <Image 
                                 src={item.product.image} 
                                 alt={item.product.name} 
                                 fill 
                                 className="object-cover" 
                                 unoptimized
                               />
                               <div className="absolute bottom-1 left-1">
                                 <span className="px-1.5 py-0.5 bg-accent-red text-white text-[9px] font-black rounded uppercase">{item.product.grade}</span>
                               </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                               <div>
                                 <h4 className="text-[13px] font-black text-neutral-900 dark:text-white leading-tight line-clamp-2">{item.product.name}</h4>
                                 <p className="text-[10px] text-neutral-400 font-bold mt-1 truncate">{item.product.series}</p>
                               </div>
                               <div className="flex items-center justify-between">
                                 <span className="text-accent-yellow font-black font-amount text-sm">{item.price.toLocaleString()} G</span>
                                <span className="text-[10px] text-neutral-400 font-bold">{item.created_at}</span>
                               </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-neutral-50 dark:border-neutral-800">
                            <button 
                              onClick={() => cancelListing(item.id)}
                              className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-lg text-xs font-black transition-colors"
                            >
                              取消上架
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto -mx-3 lg:-mx-8 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-50 dark:border-neutral-800 text-[12px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                            <th className="px-3 lg:px-4 py-2 lg:py-3">賞別</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">獎項資訊</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">售價</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">上架時間</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                          {marketListings.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50 transition-all group">
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-accent-red/10 text-accent-red text-[12px] lg:text-[13px] font-black rounded-lg border border-accent-red/10 uppercase tracking-wider">{item.product.grade}</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <div className="flex items-center gap-3 lg:gap-4">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#28324E] overflow-hidden flex-shrink-0 shadow-soft relative">
                                    <Image 
                                      src={item.product.image} 
                                      alt={item.product.name} 
                                      fill 
                                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                      unoptimized
                                    />
                                  </div>
                                  <div className="space-y-0.5 lg:space-y-1 min-w-0">
                                    <div className="text-[13px] lg:text-[14px] font-black text-neutral-900 dark:text-white leading-tight truncate tracking-tight">{item.product.name}</div>
                                    <div className="text-[11px] lg:text-[13px] text-neutral-400 font-black uppercase tracking-widest truncate">{item.product.series}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="text-sm lg:text-base font-black text-accent-yellow font-amount">{item.price.toLocaleString()} G</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="text-[12px] lg:text-[13px] font-black text-neutral-400">{item.created_at}</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3 text-right">
                                <button 
                                  onClick={() => cancelListing(item.id)}
                                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded-lg text-xs font-black transition-colors"
                                >
                                  取消上架
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {soldItems.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black text-sm uppercase tracking-widest">尚無售出紀錄</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Style */}
                    <div className="md:hidden space-y-3">
                      {soldItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 space-y-3 shadow-sm relative overflow-hidden opacity-75 grayscale-[0.5]">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-[#28324E] rounded-xl overflow-hidden flex-shrink-0 relative">
                               <Image 
                                 src={item.product.image} 
                                 alt={item.product.name} 
                                 fill 
                                 className="object-cover" 
                                 unoptimized
                               />
                               <div className="absolute bottom-1 left-1">
                                 <span className="px-1.5 py-0.5 bg-neutral-600 text-white text-[9px] font-black rounded uppercase">{item.product.grade}</span>
                               </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                               <div>
                                 <h4 className="text-[13px] font-black text-neutral-900 dark:text-white leading-tight line-clamp-2">{item.product.name}</h4>
                                 <p className="text-[10px] text-neutral-400 font-bold mt-1 truncate">{item.product.series}</p>
                                 {item.buyer && (
                                   <p className="text-[10px] text-neutral-500 font-bold mt-1 flex items-center gap-1">
                                     <User className="w-3 h-3" /> 買家: {item.buyer.name}
                                   </p>
                                 )}
                               </div>
                               <div className="flex items-center justify-between">
                                <span className="text-accent-yellow font-black font-amount text-sm">{item.price.toLocaleString()} G</span>
                                <span className="text-[10px] text-neutral-400 font-bold">{item.updated_at}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto -mx-3 lg:-mx-8 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-50 dark:border-neutral-800 text-[12px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                            <th className="px-3 lg:px-4 py-2 lg:py-3">賞別</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">獎項資訊</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">買家</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">成交價</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3">售出時間</th>
                            <th className="px-3 lg:px-4 py-2 lg:py-3 text-right">實收代幣</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                          {soldItems.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50 transition-all group opacity-75 hover:opacity-100">
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-neutral-100 text-neutral-500 text-[12px] lg:text-[13px] font-black rounded-lg border border-neutral-200 uppercase tracking-wider">{item.product.grade}</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <div className="flex items-center gap-3 lg:gap-4">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#28324E] overflow-hidden flex-shrink-0 border border-neutral-100 p-0.5 shadow-soft">
                                    <Image 
                                      src={item.product.image} 
                                      alt={item.product.name} 
                                      width={48} 
                                      height={48} 
                                      className="w-full h-full object-cover rounded-[10px] lg:rounded-[14px] grayscale-[0.5]" 
                                      unoptimized
                                    />
                                  </div>
                                  <div className="space-y-0.5 lg:space-y-1 min-w-0">
                                    <div className="text-[13px] lg:text-[14px] font-black text-neutral-900 dark:text-white leading-tight truncate tracking-tight">{item.product.name}</div>
                                    <div className="text-[11px] lg:text-[13px] text-neutral-400 font-black uppercase tracking-widest truncate">{item.product.series}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="text-[13px] font-black text-neutral-600 dark:text-neutral-400">
                                  {item.buyer?.name || '-'}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="text-sm lg:text-base font-black text-accent-yellow font-amount">{item.price.toLocaleString()} G</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3">
                                <span className="text-[12px] lg:text-[13px] font-black text-neutral-400">{item.updated_at}</span>
                              </td>
                              <td className="px-3 lg:px-4 py-2 lg:py-3 text-right">
                                <span className="text-sm lg:text-base font-black text-accent-emerald font-amount">
                                  +{Math.floor(item.price * 0.95).toLocaleString()} G
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      case 'delivery':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">配送訂單</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">追蹤您的獎項配送狀態</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
              <button 
                className="px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
              >
                全部訂單 ({deliveryHistory.length})
              </button>
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
                    <div key={order.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-neutral-400 font-amount tracking-widest truncate max-w-[200px]">{order.order_number || `#${String(order.id).slice(0,8)}`}</span>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{order.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const config = getStatusConfig(order.status);
                              return (
                                <span className={cn("text-[11px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest flex items-center gap-1", config.color, config.bg, config.border)}>
                                  {config.label}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-[13px] font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> {order.method}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-neutral-400 font-black uppercase mb-0.5">預計到貨</div>
                          <div className="text-[13px] font-black font-amount">{order.arrivalDate}</div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-neutral-50 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                              <span className="text-[10px] font-black text-accent-red uppercase">{item.grade}</span>
                              <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 truncate max-w-[100px]">{item.name}</span>
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
                      <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-50 dark:border-neutral-800 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="w-16 px-4 py-3"></th>
                        <th className="px-4 py-3">訂單編號 / 日期</th>
                        <th className="px-4 py-3">目前狀態</th>
                        <th className="px-4 py-3">物流資訊</th>
                        <th className="px-4 py-3 text-right">到貨日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {deliveryHistory.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <React.Fragment key={order.id}>
                            <tr onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="hover:bg-neutral-50/50 transition-all cursor-pointer group">
                              <td className="px-4 py-3"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-neutral-100 text-neutral-400 transition-all group-hover:bg-white group-hover:shadow-soft", isExpanded && "rotate-180 bg-primary text-white")}><ChevronDown className="w-4 h-4 stroke-[3]" /></div></td>
                              <td className="px-4 py-3"><div className="text-sm font-black text-neutral-900 dark:text-white tracking-tight">{order.order_number || `#${String(order.id).slice(0,8)}...`}</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{order.date}</div></td>
                              <td className="px-4 py-3">
                                {(() => {
                                  const config = getStatusConfig(order.status);
                                  return (
                                    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest", config.color, config.bg, config.border)}>
                                      {config.label}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-3"><div className="text-sm font-amount text-neutral-900 dark:text-white font-black tracking-widest uppercase">{order.tracking}</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{order.method}</div></td>
                              <td className="px-4 py-3 text-right text-sm font-black text-neutral-900 dark:text-white font-amount tracking-tighter">{order.arrivalDate}</td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} className="px-0 py-0">
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-neutral-50/30 dark:bg-neutral-800/30">
                                      <div className="py-6 px-8 lg:px-24 border-y border-neutral-100/50 dark:border-neutral-800/50">
                                        <div className="text-[13px] font-black text-neutral-400 uppercase tracking-widest mb-4">配送獎項內容</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-soft">
                                              <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[13px] font-black rounded-md border border-accent-red/10 uppercase">{item.grade}</span>
                                              <span className="text-sm font-black text-neutral-700 dark:text-neutral-300 truncate">{item.name}</span>
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

            {/* Sell Modal Removed from here */}
            
          </div>
        );
      case 'draw-history':
        return (
          <div className="p-3 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
              <div className="hidden md:block">
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">抽獎紀錄</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">回顧您的所有抽獎歷程</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
              <button 
                className="px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
              >
                全部紀錄 ({drawHistory.length})
              </button>
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
                    <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-[14px] font-black text-neutral-900 dark:text-white leading-tight tracking-tight">{item.product}</h4>
                          <div className="text-[11px] text-neutral-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm">
                            <span className="text-[10px] text-white font-black">G</span>
                          </div>
                          <span className="text-base font-black text-accent-red font-amount tracking-tighter">{item.cost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full max-h-[120px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {item.tickets.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-100 rounded text-[10px] font-black font-sans border border-neutral-100 dark:border-neutral-700">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono leading-snug space-y-0.5">
                          {item.items.map((r, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-[8px] text-[10px] font-black font-sans border border-neutral-100 dark:border-neutral-700">
                                  {r.ticket_number}
                                </span>
                              <button
                                  type="button"
                                  onClick={() => {
                                    if (!r.txid_hash) return;
                                    navigator.clipboard?.writeText(r.txid_hash)
                                      .then(() => toast.success('已複製 TXID Hash'))
                                      .catch(() => toast.error('複製失敗，請再試一次'));
                                  }}
                                  className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                  <span className="max-w-[160px] truncate">
                                    {r.txid_hash ? `TXID Hash：${r.txid_hash}` : 'TXID Hash：尚未提供'}
                                  </span>
                                  {r.txid_hash && (
                                    <Copy className="w-3 h-3 shrink-0" />
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!r.txid_hash) return;
                                  window.location.href = `/fairness/${item.productId}?nonce=${encodeURIComponent(r.ticket_number)}&txid_hash=${encodeURIComponent(r.txid_hash)}`;
                                }}
                                className="self-end inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 text-[10px] font-black text-primary hover:bg-primary/10 transition-colors"
                              >
                                前往驗證
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-neutral-50 dark:border-neutral-800">
                        <div className="w-full max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                          <div className="grid grid-cols-1 gap-2">
                            {item.items.map((result, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-accent-red/10 text-accent-red text-[10px] font-black rounded uppercase">{result.grade}</span>
                                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 truncate">{result.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-8 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-50 dark:border-neutral-800 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="w-16 px-4 py-3"></th>
                        <th className="px-4 py-3">獎項名稱 / 日期</th>
                        <th className="px-4 py-3">所選籤號</th>
                        <th className="px-4 py-3 text-right">消耗代幣(G)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {drawHistory.map((item) => {
                        const isExpanded = expandedDrawId === item.id;
                        return (
                          <React.Fragment key={item.id}>
                            <tr onClick={() => setExpandedDrawId(isExpanded ? null : item.id)} className="hover:bg-neutral-50/50 transition-all cursor-pointer group">
                              <td className="px-4 py-3"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-neutral-100 text-neutral-400 transition-all group-hover:bg-white group-hover:shadow-soft", isExpanded && "rotate-180 bg-primary text-white")}><ChevronDown className="w-4 h-4 stroke-[3]" /></div></td>
                              <td className="px-4 py-3"><div className="text-sm font-black text-neutral-900 dark:text-white leading-tight tracking-tight">{item.product}</div><div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest mt-1">{item.date}</div></td>
                              <td className="px-4 py-3">
                                <div className="max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.tickets.map(t => (
                                      <span key={t} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-100 rounded-lg text-xs font-black font-sans border border-neutral-100 dark:border-neutral-700">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><div className="w-4 h-4 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm"><span className="text-[11px] text-white font-black leading-none">G</span></div><span className="text-xl font-black text-accent-red font-amount tracking-tighter leading-none">{item.cost.toLocaleString()}</span></div></td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={4} className="px-0 py-0">
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-neutral-50/40 dark:bg-neutral-800/40">
                                      <div className="py-4 px-8 lg:px-20 border-y border-neutral-100/50 dark:border-neutral-800/50">
                                        <div className="max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                                          <div className="grid grid-cols-1 gap-2.5">
                                            {item.items.map((result, idx) => (
                                              <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 px-3 py-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-soft h-14">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                  <span className="px-2 py-0.5 bg-accent-red/10 text-accent-red text-[12px] font-black rounded-md border border-accent-red/10 uppercase shrink-0">{result.grade}</span>
                                                  <span className="text-sm font-black text-neutral-700 dark:text-neutral-300 truncate">{result.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 max-w-[420px] justify-end">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (!result.txid_hash) return;
                                                      navigator.clipboard?.writeText(result.txid_hash)
                                                        .then(() => toast.success('已複製 TXID Hash'))
                                                        .catch(() => toast.error('複製失敗，請再試一次'));
                                                    }}
                                                    className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors max-w-[260px]"
                                                  >
                                                    <span className="font-mono text-right truncate">
                                                    {result.txid_hash ? `TXID Hash：${result.txid_hash}` : 'TXID Hash：尚未提供'}
                                                    </span>
                                                    {result.txid_hash && (
                                                      <Copy className="w-3.5 h-3.5 shrink-0" />
                                                    )}
                                                  </button>
                                                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-100 rounded-[8px] text-[11px] font-black font-sans border border-neutral-100 dark:border-neutral-700">
                                                    {result.ticket_number}
                                                  </span>
                                                  {result.txid_hash && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        window.location.href = `/fairness/${item.productId}?nonce=${encodeURIComponent(result.ticket_number)}&txid_hash=${encodeURIComponent(result.txid_hash!)}`;
                                                      }}
                                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 text-[11px] font-black text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                      前往驗證
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
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
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">儲值紀錄</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您的代幣儲值明細</p>
              </div>
            </div>
            
            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
              <button 
                className="px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20"
              >
                全部紀錄 ({topupHistory.length})
              </button>
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
                    <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                            {item.payment_method === 'credit_card' ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-[13px] font-black text-neutral-900 dark:text-white">儲值 <span className="font-amount">{item.points.toLocaleString()} G</span></div>
                            <div className="text-[11px] text-neutral-400 font-bold">{new Date(item.created_at).toLocaleString('zh-TW')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-neutral-900 dark:text-white font-amount">NT$ {item.amount.toLocaleString()}</div>
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
                      <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-y border-neutral-50 dark:border-neutral-800 text-[13px] font-black text-neutral-400 uppercase tracking-widest">
                        <th className="px-4 py-3">交易日期</th>
                        <th className="px-4 py-3">儲值方案</th>
                        <th className="px-4 py-3">付款方式</th>
                        <th className="px-4 py-3">交易金額</th>
                        <th className="px-4 py-3 text-right">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {topupHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50/50 transition-all">
                          <td className="px-4 py-3">
                            <div className="text-[13px] text-neutral-400 font-black uppercase tracking-widest">{new Date(item.created_at).toLocaleString('zh-TW')}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center shadow-sm">
                                <span className="text-[10px] text-white font-black">G</span>
                              </div>
                              <span className="text-sm font-black text-neutral-900 dark:text-white font-amount">{item.points.toLocaleString()} G</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-bold text-neutral-500 flex items-center gap-2">
                              {item.payment_method === 'credit_card' ? '信用卡支付' : item.payment_method}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-black text-neutral-900 dark:text-white font-amount">NT$ {item.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
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
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">我的關注</h3>
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
                 {followedProducts.map(product => (
                    <div key={product.id} className="h-full">
                       <ProductCard
                         id={product.id}
                         name={product.name}
                         image={product.image}
                         price={product.price}
                       />
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
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">我的優惠券</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">查看與使用您的優惠券</p>
              </div>
              <div className="px-3 py-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl lg:rounded-2xl border border-neutral-100 dark:border-neutral-800 text-[11px] lg:text-[13px] font-black text-neutral-400 uppercase tracking-widest w-fit">
                共 {coupons.length} 張優惠券
              </div>
            </div>

            <div className="mb-4 lg:mb-6">
              <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-3 lg:p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="w-4 h-4 text-accent-yellow" />
                    <span className="text-[13px] font-black text-neutral-800 dark:text-neutral-100 uppercase tracking-widest">輸入折價券代碼</span>
                  </div>
                  <p className="text-[12px] lg:text-[13px] text-neutral-400 font-bold">
                    輸入活動或實體卡上的折價券代碼，領取對應優惠券。
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2 lg:mt-0 w-full lg:w-auto">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="例如：SPRING50"
                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={handleRedeemCoupon}
                    disabled={isRedeemingCoupon}
                    className="px-4 py-2.5 rounded-xl text-sm font-black bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isRedeemingCoupon ? '處理中...' : '領取折價券'}
                  </button>
                </div>
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
                  <div key={coupon.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all" />
                    
                    <div className="relative z-10">
                      <span className={cn(
                        "absolute top-0 right-0 px-2 py-1 rounded-lg text-[13px] font-black uppercase tracking-wider",
                        coupon.status === 'unused' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
                      )}>
                        {coupon.status === 'unused' ? '可使用' : coupon.status === 'used' ? '已使用' : '已過期'}
                      </span>
                      
                      <h4 className="text-lg font-black text-neutral-900 dark:text-white mb-1 pr-16 pt-1">{coupon.title}</h4>
                      <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-bold mb-3">{coupon.description}</p>
                      
                      <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-neutral-400 font-black uppercase tracking-wider">折扣內容</span>
                          <span className="text-lg font-black text-pink-500 font-amount">
                            {coupon.discountType === 'fixed' ? `$${coupon.discountValue}` : `${coupon.discountValue}% OFF`}
                          </span>
                        </div>
                         <div className="flex flex-col text-right">
                          <span className="text-[13px] text-neutral-400 font-black uppercase tracking-wider">有效期限</span>
                          <span className="text-[13px] font-bold text-neutral-600 dark:text-neutral-400 font-mono">
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
                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">帳戶設定</h3>
                <p className="text-sm text-neutral-400 font-black uppercase tracking-widest mt-2">管理您的個人資料與配送資訊</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
              {/* Profile Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <User className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900 dark:text-white">基本資料</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">顯示暱稱</label>
                    <input 
                      type="text" 
                      value={settingsForm.nickname}
                      onChange={(e) => setSettingsForm({...settingsForm, nickname: e.target.value})}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">電子信箱</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled 
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 font-bold text-neutral-500 dark:text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <Truck className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900 dark:text-white">預設配送資訊</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">收件人姓名</label>
                    <input 
                      type="text" 
                      value={settingsForm.recipientName}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientName: e.target.value})}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">聯絡電話</label>
                    <input 
                      type="tel" 
                      value={settingsForm.recipientPhone}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientPhone: e.target.value})}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">收件地址</label>
                    <input 
                      type="text" 
                      value={settingsForm.recipientAddress}
                      onChange={(e) => setSettingsForm({...settingsForm, recipientAddress: e.target.value})}
                      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <Lock className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-black text-neutral-900 dark:text-white">帳號安全</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">修改密碼</label>
                  <input 
                    type="password" 
                    placeholder="輸入新密碼 (若不修改請留空)"
                    value={settingsForm.password}
                    onChange={(e) => setSettingsForm({...settingsForm, password: e.target.value})}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
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
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white dark:border-neutral-800 shadow-soft relative">
                  <Image 
                    src={user.avatar_url || 'https://github.com/shadcn.png'} 
                    alt={user.name || 'User'} 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-neutral-900 dark:text-white leading-tight">{user.name}</h2>
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5" onClick={() => {
                    if (user.invite_code) {
                      navigator.clipboard.writeText(user.invite_code);
                      toast.success('邀請碼已複製');
                    }
                  }}>
                    <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg active:scale-95 transition-transform cursor-pointer">
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
                  className="w-9 h-9 rounded-full bg-white dark:bg-neutral-900 shadow-soft flex items-center justify-center text-neutral-400 hover:text-primary transition-colors border border-neutral-100 dark:border-neutral-800"
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
                  <Link href="/topup" className="bg-accent-yellow text-white px-3 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-accent-yellow/30 hover:scale-105 active:scale-95 transition-all text-sm font-black">
                    <span>儲值</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Menu List */}
            <div className="mx-0 bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-50 dark:divide-neutral-800">
              {navItems.filter(item => item.id !== 'topup-history' && item.id !== 'settings').map((item) => (
                <button key={item.id} onClick={() => handleTabChange(item.id as TabType)} className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[14px] font-black text-neutral-700 dark:text-neutral-200">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* Info Menu List */}
            <div className="mx-0 bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-50 dark:divide-neutral-800">
              {[
                { id: 'faq', label: '常見問題', icon: HelpCircle, color: 'text-neutral-400', href: '/faq' },
                { id: 'about', label: '關於我們', icon: Info, color: 'text-neutral-400', href: '/about' },
                { id: 'terms', label: '會員條款', icon: FileText, color: 'text-neutral-400', href: '/terms' },
                { id: 'privacy', label: '隱私權政策', icon: Shield, color: 'text-neutral-400', href: '/privacy' },
                { id: 'return-policy', label: '退換貨資訊', icon: RefreshCcw, color: 'text-neutral-400', href: '/return-policy' },
              ].map((item) => (
                <Link key={item.id} href={item.href} className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
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
                className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group border border-neutral-100 dark:border-neutral-800 shadow-card"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-400">
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
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 min-h-[500px] overflow-hidden">
              {renderTabContent()}
            </div>
          </div>

          {/* 3. Desktop View (Hidden on mobile) */}
          <div className="hidden md:grid md:col-span-12 grid-cols-12 gap-4 lg:gap-6 w-full items-start">
            <div className="md:col-span-3 lg:col-span-3 space-y-3 sticky top-24">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 p-3">
              <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl overflow-hidden border-2 border-neutral-50 dark:border-neutral-800 shadow-soft p-0.5 bg-white dark:bg-neutral-800">
                        <Image 
                          src={user.avatar_url || 'https://github.com/shadcn.png'} 
                          alt={user.name || 'User'} 
                          fill 
                          className="rounded-[8px] object-cover" 
                          unoptimized
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-accent-emerald border-2 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h2 className="text-sm lg:text-base font-black text-neutral-900 dark:text-white truncate tracking-tight">{user.name}</h2>
                        <CheckCircle2 className="w-3 h-3 text-accent-emerald flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                         <div className="flex items-center gap-1.5 cursor-pointer group/invite" onClick={() => {
                           if (user.invite_code) {
                             navigator.clipboard.writeText(user.invite_code);
                             toast.success('邀請碼已複製');
                           }
                        }}>
                          <span className="text-[13px] font-black text-neutral-400 uppercase tracking-wider">邀請碼</span>
                          <span className="text-[13px] font-mono font-black text-primary group-hover/invite:text-primary/80 transition-colors">{user.invite_code || '-'}</span>
                          <Copy className="w-3.5 h-3.5 text-neutral-300 group-hover/invite:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-yellow shadow-sm">
                        <span className="text-[13px] text-white font-black leading-none">G</span>
                      </div>
                      <span className="text-lg font-black text-accent-red font-amount leading-none tracking-tighter">{user.points.toLocaleString()}</span>
                    </div>
                    <Link href="/topup" className="text-[13px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest bg-white dark:bg-neutral-800 px-2 py-1 rounded border border-primary/10 shadow-sm">儲值</Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 p-3 overflow-hidden">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => handleTabChange(item.id as TabType)} 
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all group text-left", 
                      activeTab === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 stroke-[2.5]", activeTab === item.id ? "text-white" : "text-neutral-300 group-hover:text-primary transition-colors")} />
                    <span className="truncate">{item.label}</span>
                    <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform hidden sm:block", activeTab === item.id ? "text-white/50" : "text-neutral-200 group-hover:text-neutral-400")} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-9 lg:col-span-9 w-full">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl lg:rounded-3xl shadow-card border border-neutral-100 dark:border-neutral-800 min-h-[600px] lg:min-h-[700px] overflow-hidden">
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
