'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types/product'

interface DrawRecord {
  id: number
  product_id: number
  ticket_number: number
  txid_nonce: number
}

function DrawConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('productId')
  const quantity = parseInt(searchParams.get('quantity') || '1')
  
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set())
  const [soldTickets, setSoldTickets] = useState<Set<number>>(new Set())

  // 載入商品數據
  useEffect(() => {
    if (!productId) return
    
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          prizes:product_prizes(*)
        `)
        .eq('id', productId)
        .single()
      
      if (data) {
        const mappedProduct: Product = {
          id: data.id,
          productCode: data.product_code,
          name: data.name,
          category: data.category,
          price: data.price,
          remaining: data.remaining,
          status: data.status,
          sales: data.sales,
          isHot: data.is_hot,
          createdAt: data.created_at,
          imageUrl: data.image_url,
          prizes: data.prizes.map((pz: any) => ({
            name: pz.name,
            level: pz.level,
            imageUrl: pz.image_url,
            total: pz.total,
            remaining: pz.remaining,
            probability: pz.probability
          })),
          totalCount: data.total_count,
          releaseYear: data.release_year,
          releaseMonth: data.release_month,
          distributor: data.distributor,
          rarity: data.rarity,
          majorPrizes: data.major_prizes
        }
        setProduct(mappedProduct)
      }
    }
    
    fetchProduct()
  }, [productId])

  // 載入已售籤號
  useEffect(() => {
    if (!productId) return
    
    const fetchDraws = async () => {
      const { data } = await supabase
        .from('draw_records')
        .select('ticket_number, txid_nonce')
        .eq('product_id', productId)
      
      if (data) {
        const sold = new Set(data.map((d: any) => d.ticket_number || d.txid_nonce))
        setSoldTickets(sold)
      }
    }
    
    fetchDraws()
  }, [productId])

  // 根據商品的實際總數量生成籤號列表
  const ticketNumbers = useMemo(() => {
    if (!product) return []
    const totalCount = product.totalCount || product.prizes.reduce((sum, p) => sum + p.total, 0)
    return Array.from({ length: totalCount }, (_, i) => i + 1)
  }, [product])
  
  // 根據總數決定桌面端每排顯示數量：<=200 用10列，>200 用20列
  const desktopCols = useMemo(() => {
    if (!product) return 10
    const totalCount = product.totalCount || product.prizes.reduce((sum, p) => sum + p.total, 0)
    return totalCount <= 200 ? 10 : 20
  }, [product])
  
  // 響應式網格類別：手機/平板固定10列，桌面根據總數決定
  const gridColsClass = useMemo(() => {
    return desktopCols === 20 ? 'grid-cols-10 lg:grid-cols-20' : 'grid-cols-10'
  }, [desktopCols])
  
  // 統一使用三位數格式
  const padLength = 3

  // 切換籤號選擇
  const toggleTicket = (ticketNumber: number) => {
    if (soldTickets.has(ticketNumber)) return // 已售籤號不能選擇
    
    setSelectedTickets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ticketNumber)) {
        newSet.delete(ticketNumber)
      } else {
        // 限制選擇數量
        if (newSet.size < quantity) {
          newSet.add(ticketNumber)
        }
      }
      return newSet
    })
  }

  // 隨機選擇籤號
  const handleRandomSelect = () => {
    const availableTickets = ticketNumbers.filter(t => !soldTickets.has(t))
    const shuffled = [...availableTickets].sort(() => Math.random() - 0.5)
    const randomTickets = shuffled.slice(0, quantity)
    setSelectedTickets(new Set(randomTickets))
  }

  // 清除所有選擇
  const handleClearAll = () => {
    setSelectedTickets(new Set())
  }

  // 確認抽獎
  const handleConfirm = () => {
    if (selectedTickets.size !== quantity) {
      alert(`請選擇 ${quantity} 個籤號`)
      return
    }

    // 這裡應該調用抽獎 API
    // 暫時先跳轉到結果頁面（需要創建）
    const ticketNumbersArray = Array.from(selectedTickets).sort((a, b) => a - b)
    router.push(`/draw/result?productId=${productId}&tickets=${ticketNumbersArray.join(',')}`)
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  const totalPrice = product.price * quantity

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 商品資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">{product.name}</h1>
          <div className="text-sm text-gray-600">
            <p>商品編號：{product.productCode}</p>
            <p>單價：{product.price} 代幣</p>
            <p>選擇數量：{quantity} 抽</p>
            <p className="text-lg font-semibold text-primary mt-2">總計：{totalPrice} 代幣</p>
          </div>
        </div>

        {/* 選擇籤號區域 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">選擇籤號</h2>
              <p className="text-sm text-gray-500 mt-1">
                點擊號碼進行選擇（可複選，已選擇 {selectedTickets.size}/{quantity} 個）
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRandomSelect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                隨機選擇
              </button>
              {selectedTickets.size > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  清除選擇
                </button>
              )}
            </div>
          </div>

          {/* 籤號網格 */}
          <div className={`grid gap-2 ${gridColsClass} w-full`}>
            {ticketNumbers.map(ticketNumber => {
              const isSelected = selectedTickets.has(ticketNumber)
              const isSold = soldTickets.has(ticketNumber)
              
              let bgColor = 'bg-blue-500 hover:bg-blue-600'
              let textColor = 'text-white'
              
              if (isSold) {
                bgColor = 'bg-gray-300 cursor-not-allowed'
                textColor = 'text-gray-500'
              } else if (isSelected) {
                bgColor = 'bg-yellow-400 hover:bg-yellow-500'
                textColor = 'text-yellow-900'
              }
              
              return (
                <button
                  key={ticketNumber}
                  onClick={() => toggleTicket(ticketNumber)}
                  disabled={isSold}
                  className={`${bgColor} ${textColor} rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all duration-200 font-medium ${
                    isSold ? '' : 'cursor-pointer'
                  }`}
                >
                  <div className="text-sm font-bold">{ticketNumber.toString().padStart(padLength, '0')}</div>
                  {isSold && (
                    <div className="text-[10px] mt-1 opacity-75">已售</div>
                  )}
                  {isSelected && !isSold && (
                    <div className="text-[10px] mt-1 opacity-75">已選</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* 已選籤號列表 */}
          {selectedTickets.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">已選擇的籤號：</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTickets).sort((a, b) => a - b).map(ticket => (
                  <span
                    key={ticket}
                    className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                  >
                    {ticket.toString().padStart(3, '0')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            返回
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTickets.size !== quantity}
            className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium ${
              selectedTickets.size === quantity
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            確認抽獎 ({selectedTickets.size}/{quantity})
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DrawConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    }>
      <DrawConfirmContent />
    </Suspense>
  )
}
