'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, RefreshCw, CheckCircle2, AlertCircle, ChevronRight, Search, X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import Image from 'next/image'

// Types for our inventory items
interface InventoryItem {
  id: number
  ticket_number: number
  status: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
  created_at: string
  products: {
    name: string
    image_url: string | null
    price: number
  } | null
  product_prizes: {
    level: string
    name: string
    image_url: string | null
    recycle_value: number
    quantity: number
  } | null
}

type FilterType = 'all' | 'in_warehouse' | 'shipping' | 'history'

export default function InventoryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Shipment Selection State
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  
  // Shipment Form State
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dismantle State
  const [showDismantleModal, setShowDismantleModal] = useState(false)
  const [dismantleSummary, setDismantleSummary] = useState({ count: 0, totalValue: 0 })

  // Fetch Inventory Data
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('draw_records')
        .select(`
          *,
          products (
            name,
            image_url,
            price
          ),
          product_prizes (
            level,
            name,
            image_url,
            recycle_value,
            quantity
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setItems(data as unknown as InventoryItem[])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('無法載入背包資料')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchInventory()
      // Pre-fill user profile data if available
      if (user.recipient_name) setRecipientName(user.recipient_name)
      if (user.recipient_phone) setRecipientPhone(user.recipient_phone)
      if (user.recipient_address) setRecipientAddress(user.recipient_address)
    }
  }, [user, fetchInventory])

  // Filter items logic
  const filteredItems = items.filter((item) => {
    const productName = item.products?.name || ''
    const prizeName = item.product_prizes?.name || ''
    const prizeLevel = item.product_prizes?.level || ''
    
    const matchesSearch = 
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prizeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prizeLevel.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (activeFilter) {
      case 'in_warehouse':
        return item.status === 'in_warehouse'
      case 'shipping':
        return item.status === 'pending_delivery' || item.status === 'shipped'
      case 'history':
        return item.status === 'exchanged' || item.status === 'shipped'
      default:
        return true
    }
  })

  // Selection Logic
  const toggleSelection = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const handleSelectAll = () => {
    const availableItemIds = filteredItems
      .filter(item => item.status === 'in_warehouse')
      .map(item => item.id)
    
    if (selectedItems.length === availableItemIds.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(availableItemIds)
    }
  }

  // Shipment Submission
  const handleShipmentSubmit = async () => {
    if (!recipientName || !recipientPhone || !recipientAddress) {
      toast.error('請填寫完整收件資訊')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('請選擇要出貨的商品')
      return
    }

    try {
      setIsSubmitting(true)

      // Generate Order Number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          address: recipientAddress,
          status: 'submitted'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Update Draw Records
      const { error: updateError } = await supabase
        .from('draw_records')
        .update({
          status: 'pending_delivery',
          order_id: orderData.id
        })
        .in('id', selectedItems)

      if (updateError) throw updateError

      toast.success('出貨申請已提交！')
      setShowShipmentModal(false)
      setSelectedItems([])
      setIsSelectionMode(false)
      await fetchInventory() // Refresh list

    } catch (error: unknown) {
      console.error('Shipment error:', error)
      const message = error instanceof Error ? error.message : '申請失敗，請稍後再試'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dismantle Logic
  const handleDismantleClick = () => {
    if (selectedItems.length === 0) return;
    
    // Calculate summary
    let total = 0;
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item && item.product_prizes) {
        let value = item.product_prizes.recycle_value;
        // Fallback calculation if recycle_value is 0 or null
        if (!value && item.products?.price) {
          const quantity = item.product_prizes.quantity || 0;
          if (quantity >= 1 && quantity <= 4) {
            value = item.products.price * 2;
          } else {
            value = 50;
          }
        }
        total += value || 0;
      }
    });
    
    setDismantleSummary({ count: selectedItems.length, totalValue: total });
    setShowDismantleModal(true);
  }

  const handleDismantleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.rpc('dismantle_prizes', {
        p_record_ids: selectedItems,
        p_user_id: user?.id
      });
      
      if (error) throw error;
      
      toast.success(`成功分解 ${selectedItems.length} 個獎品，獲得 ${dismantleSummary.totalValue} 代幣`);
      setShowDismantleModal(false);
      setSelectedItems([]);
      setIsSelectionMode(false);
      fetchInventory();
      // Reload page to refresh user tokens in header
      window.location.reload(); 
    } catch (err) {
      console.error('Dismantle error:', err);
      toast.error('分解失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_warehouse':
        return <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">倉庫中</span>
      case 'pending_delivery':
        return <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">準備出貨</span>
      case 'shipped':
        return <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">已出貨</span>
      case 'exchanged':
        return <span className="bg-neutral-100 text-neutral-500 text-xs font-bold px-2 py-0.5 rounded-full">已交換</span>
      case 'dismantled':
        return <span className="bg-neutral-100 text-neutral-400 text-xs font-bold px-2 py-0.5 rounded-full">已分解</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-24 md:pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans">我的背包</h1>
          <div className="flex items-center gap-3">
            {activeFilter === 'in_warehouse' && filteredItems.length > 0 && (
              <Button 
                variant={isSelectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode)
                  setSelectedItems([])
                }}
              >
                {isSelectionMode ? '取消選擇' : '申請出貨'}
              </Button>
            )}
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              共 {items.length} 件
            </span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 h-12">
            {[
              { id: 'all', label: '全部' },
              { id: 'in_warehouse', label: '倉庫中' },
              { id: 'shipping', label: '出貨中/已出貨' },
              { id: 'history', label: '歷史紀錄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterType)}
                className={cn(
                  "relative h-full text-sm font-bold transition-colors whitespace-nowrap px-1",
                  activeFilter === tab.id
                    ? "text-primary dark:text-white"
                    : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
                )}
              >
                {tab.label}
                {activeFilter === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="搜尋商品、獎項名稱..." 
            className="pl-9 pr-10 bg-white dark:bg-neutral-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selection Bar (Mobile/Desktop) */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-40 bg-white dark:bg-neutral-800 shadow-xl rounded-2xl p-4 border border-neutral-100 dark:border-neutral-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
                  已選擇 <span className="text-primary">{selectedItems.length}</span> 件商品
                </div>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-neutral-400 hover:text-neutral-600 underline"
                >
                  全選本頁
                </button>
              </div>
              <Button 
                disabled={selectedItems.length === 0}
                onClick={handleDismantleClick}
                variant="danger"
                className="rounded-xl px-6 mr-3"
              >
                分解回收
              </Button>
              <Button 
                disabled={selectedItems.length === 0}
                onClick={() => setShowShipmentModal(true)}
                className="rounded-xl px-6"
              >
                填寫出貨資訊
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>載入背包中...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "group relative bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all",
                  isSelectionMode && selectedItems.includes(item.id) && "ring-2 ring-primary border-transparent"
                )}
                onClick={() => {
                  if (item.status === 'in_warehouse') {
                    if (!isSelectionMode) {
                      setIsSelectionMode(true)
                      setSelectedItems([item.id])
                    } else {
                      toggleSelection(item.id)
                    }
                  }
                }}
              >
                {/* Selection Checkbox Overlay */}
                {isSelectionMode && item.status === 'in_warehouse' && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors bg-white",
                      selectedItems.includes(item.id) 
                        ? "border-primary bg-primary text-white" 
                        : "border-neutral-300 text-transparent"
                    )}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden">
                  <Image 
                    src={item.product_prizes?.image_url || item.products?.image_url || '/images/item.png'} 
                    alt={item.product_prizes?.name || 'Item'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute top-3 left-3 z-10">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {item.products?.name}
                    </span>
                    <span className="text-xs font-mono text-neutral-300">
                      #{item.ticket_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {item.product_prizes?.level}賞
                    </span>
                    <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1">
                      {item.product_prizes?.name}
                    </h3>
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    獲得時間：{new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold">目前沒有相關物品</p>
            {activeFilter !== 'all' && (
              <button 
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-sm text-primary hover:underline"
              >
                查看全部
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shipment Modal */}
      {showShipmentModal && (
        <Modal
          isOpen={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          title="申請出貨"
        >
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                您即將申請出貨 <span className="font-bold text-primary">{selectedItems.length}</span> 件商品。
                請確認收件資訊是否正確，提交後將無法修改。
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                  收件人姓名
                </label>
                <Input 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="請輸入真實姓名" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                  聯絡電話
                </label>
                <Input 
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="請輸入手機號碼" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                  收件地址
                </label>
                <Input 
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="請輸入完整收件地址" 
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowShipmentModal(false)}
              >
                取消
              </Button>
              <Button 
                className="flex-1"
                disabled={isSubmitting}
                onClick={handleShipmentSubmit}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    處理中...
                  </>
                ) : (
                  <>
                    確認送出
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dismantle Modal */}
      {showDismantleModal && (
        <Modal
          isOpen={showDismantleModal}
          onClose={() => setShowDismantleModal(false)}
          title="分解回收確認"
        >
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                <p className="font-bold text-red-600 dark:text-red-400 mb-1">注意：分解後無法復原！</p>
                您選擇了 <span className="font-bold text-neutral-900 dark:text-white">{dismantleSummary.count}</span> 件商品進行分解。
                這些商品將從您的背包中移除，並轉換為代幣。
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-bold mb-1">預計獲得代幣</span>
              <span className="text-4xl font-black text-primary font-amount tracking-tighter">
                {dismantleSummary.totalValue.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowDismantleModal(false)}
              >
                取消
              </Button>
              <Button 
                variant="danger"
                className="flex-1"
                disabled={isSubmitting}
                onClick={handleDismantleConfirm}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    處理中...
                  </>
                ) : (
                  <>
                    確認分解
                    <RefreshCw className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
