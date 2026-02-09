'use client'

import AdminLayout from '@/components/AdminLayout'
import { YearMonthPicker, DatePicker, Modal, Input } from '@/components'
import { useLog } from '@/contexts/LogContext'
import { initialSmallItems, type SmallItem } from '@/data/smallItems'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { generateTXID, calculateTXIDHash } from '@/utils/drawLogicClient'
import { supabase } from '@/lib/supabase'

// 定義資料庫類型
type DBProduct = {
  id: number
  name: string
  price: number
  status: 'active' | 'ended' | 'preparing'
  category: string
  is_hot: boolean
  release_year: string
  release_month: string
  distributor: string
  rarity: number
  major_prizes: string[]
  started_at: string | null
  ended_at: string | null
  txid_hash: string | null
  seed: string | null
  product_code: string
  image_url: string | null
}

type DBPrize = {
  id: string
  product_id: number
  name: string
  grade: string
  image_url: string | null
  quantity: number
  total_count: number
  remaining_count: number
  probability: number
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { addLog } = useLog()
  const productId = params.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: null as File | null,
    imagePreview: '',
    status: 'active' as 'active' | 'ended' | 'preparing',
    category: '一番賞',
    remaining: '',
    totalCount: '',
    isHot: false,
    releaseYear: '',
    releaseMonth: '',
    distributor: '',
    rarity: 3,
    majorPrizes: ['A賞'] as string[],
    startedAt: '',
    endedAt: '',
    txidHash: '',
    seed: '',
  })
  
  const availableLevels = ['A賞', 'B賞', 'C賞', 'D賞', 'E賞', 'F賞', 'G賞', 'H賞']
  const [prizes, setPrizes] = useState<Array<{
    id: string
    name: string
    level: string
    image: string
    imageFile: File | null
    imagePreview: string
    total: number
    remaining: number
    probability: number
    isNew?: boolean // 標記是否為新獎項
  }>>([])

  // 用於追蹤原始獎項 ID，以便計算刪除的獎項
  const originalPrizeIds = useRef<Set<string>>(new Set())

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [productCode, setProductCode] = useState<string>('')

  // 自動計算商品總數和剩餘數量
  const calculatedTotalCount = prizes.reduce((sum, prize) => sum + prize.total, 0)
  const calculatedRemaining = prizes.reduce((sum, prize) => sum + prize.remaining, 0)

  // 當獎項數量變化時，自動更新機率
  useEffect(() => {
    if (calculatedTotalCount > 0) {
      setPrizes(prevPrizes => prevPrizes.map(prize => ({
        ...prize,
        probability: prize.total > 0 ? (prize.total / calculatedTotalCount) * 100 : 0
      })))
    } else {
      setPrizes(prevPrizes => prevPrizes.map(prize => ({
        ...prize,
        probability: 0
      })))
    }
  }, [calculatedTotalCount])

  // 當狀態變為 ended 時，自動記錄完抽時間
  useEffect(() => {
    if (formData.status === 'ended' && !formData.endedAt) {
      const now = new Date()
      const endedAtStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      setFormData(prev => ({ ...prev, endedAt: endedAtStr }))
    } else if (formData.status !== 'ended' && formData.endedAt) {
      setFormData(prev => ({ ...prev, endedAt: '' }))
    }
  }, [formData.status])

  // 當商品上架且開賣時，自動生成 TXID Hash
  useEffect(() => {
    const checkAndGenerateTXIDHash = async () => {
      if (formData.status === 'active' && formData.startedAt && !formData.txidHash) {
        if (typeof window === 'undefined' || !window.crypto) {
          return
        }
        
        try {
          const seed = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
          
          const nonce = 1
          const txid = generateTXID(seed, nonce)
          const hash = await calculateTXIDHash(txid)
          
          setFormData(prev => ({ ...prev, txidHash: hash, seed: seed }))
          addLog('自動生成 TXID Hash', '商品管理', `商品「${formData.name || '未命名'}」已開賣，自動生成 TXID Hash 和 Seed`, 'success')
        } catch (e) {
          console.error('自動生成 TXID Hash 失敗:', e)
        }
      }
    }
    
    checkAndGenerateTXIDHash()
  }, [formData.status, formData.startedAt, formData.name, addLog])

  const [showSmallItemLibrary, setShowSmallItemLibrary] = useState(false)
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | null>(null)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [librarySelectedCategory, setLibrarySelectedCategory] = useState('all')

  // 載入資料
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productError) throw productError

        if (product) {
          setProductCode(product.product_code)
          
          // 載入獎項
          const { data: dbPrizes, error: prizesError } = await supabase
            .from('prizes')
            .select('*')
            .eq('product_id', productId)
            .order('grade', { ascending: true }) // 簡單排序，後續可能需要更複雜的排序邏輯

          if (prizesError) throw prizesError

          // 設置表單資料
          const totalRemaining = dbPrizes?.reduce((sum: number, p: DBPrize) => sum + (p.remaining_count ?? p.quantity ?? 0), 0) || 0
          const totalCount = dbPrizes?.reduce((sum: number, p: DBPrize) => sum + (p.total_count ?? p.quantity ?? 0), 0) || 0

          setFormData({
            name: product.name,
            price: product.price.toString(),
            image: null,
            imagePreview: product.image_url || '/item.png',
            status: product.status,
            category: product.category,
            remaining: totalRemaining.toString(),
            totalCount: totalCount.toString(),
            isHot: product.is_hot,
            releaseYear: product.release_year,
            releaseMonth: product.release_month,
            distributor: product.distributor || '',
            rarity: product.rarity || 3,
            majorPrizes: product.major_prizes || ['A賞'],
            startedAt: product.started_at ? product.started_at.split('T')[0] : '',
            endedAt: product.ended_at ? product.ended_at.replace('T', ' ').split('.')[0] : '',
            txidHash: product.txid_hash || '',
            seed: product.seed || '',
          })

          // 設置獎項資料
          if (dbPrizes) {
            const formattedPrizes = dbPrizes.map((prize: DBPrize) => {
              originalPrizeIds.current.add(prize.id)
              return {
                id: prize.id,
                name: prize.name,
                level: prize.grade,
                image: prize.image_url || '',
                imageFile: null,
                imagePreview: prize.image_url || '',
                total: prize.total_count ?? prize.quantity ?? 0,
                remaining: prize.remaining_count ?? prize.quantity ?? 0,
                probability: prize.probability,
                isNew: false
              }
            })
            setPrizes(formattedPrizes)
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        addLog('載入失敗', '商品管理', '載入商品資料失敗', 'failed')
        router.push('/products')
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, router, supabase, addLog])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || prizes.length === 0) {
      alert('請填寫所有必填欄位並至少添加一個獎項')
      return
    }
    
    if (formData.majorPrizes.length === 0) {
      alert('請至少選擇一個大獎等級')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 1. 更新商品資料
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          category: formData.category,
          price: parseInt(formData.price) || 0,
          status: formData.status,
          is_hot: formData.isHot,
          release_year: formData.releaseYear,
          release_month: formData.releaseMonth,
          distributor: formData.distributor,
          rarity: formData.rarity,
          major_prizes: formData.majorPrizes,
          started_at: formData.startedAt ? `${formData.startedAt} 00:00:00` : (formData.status === 'active' ? new Date().toISOString() : null),
          ended_at: formData.endedAt ? formData.endedAt : null,
          txid_hash: formData.txidHash || null,
          seed: formData.seed || null,
          // 暫時處理圖片 URL
          image_url: formData.imagePreview?.startsWith('blob:') ? (formData.imagePreview) : (formData.imagePreview || null)
        })
        .eq('id', productId)

      if (updateError) throw updateError

      // 2. 處理獎項更新
      const currentPrizeIds = new Set(prizes.map(p => p.id).filter(id => !id.startsWith('temp_')))
      const deletedPrizeIds = Array.from(originalPrizeIds.current).filter(id => !currentPrizeIds.has(id))

      // 2.1 刪除被移除的獎項
      if (deletedPrizeIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('prizes')
          .delete()
          .in('id', deletedPrizeIds)
        
        if (deleteError) throw deleteError
      }

      // 2.2 更新或新增獎項
      for (const prize of prizes) {
        const prizeData = {
          product_id: parseInt(productId),
          name: prize.name,
          grade: prize.level,
          image_url: (prize.imagePreview?.startsWith('blob:') || !prize.imagePreview) ? (prize.imagePreview || null) : prize.imagePreview,
          quantity: prize.total,
          total_count: prize.total,
          remaining_count: prize.remaining,
          probability: prize.probability
        }

        if (!prize.id.startsWith('temp_')) {
          // 更新現有獎項
          const { error: updatePrizeError } = await supabase
            .from('prizes')
            .update(prizeData)
            .eq('id', prize.id)
          
          if (updatePrizeError) throw updatePrizeError
        } else {
          // 新增獎項
          const { error: insertPrizeError } = await supabase
            .from('prizes')
            .insert(prizeData)
          
          if (insertPrizeError) throw insertPrizeError
        }
      }

      addLog('更新商品', '商品管理', `更新商品「${formData.name}」`, 'success')
      router.push('/products')
      
    } catch (error) {
      console.error('Error updating product:', error)
      addLog('更新失敗', '商品管理', '更新商品失敗', 'failed')
      alert('更新商品失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      })
    }
  }

  const handlePrizeImageChange = (id: string, file: File) => {
    setPrizes(prizes.map(prize => 
      prize.id === id ? {
        ...prize,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      } : prize
    ))
  }

  const handlePrizeChange = (id: string, field: string, value: any) => {
    setPrizes(prizes.map(prize => 
      prize.id === id ? { ...prize, [field]: value } : prize
    ))
  }

  const addPrize = () => {
    const newId = `temp_${Date.now()}`
    setPrizes([...prizes, {
      id: newId,
      name: '',
      level: 'A賞',
      image: '',
      imageFile: null,
      imagePreview: '',
      total: 1,
      remaining: 1,
      probability: 0,
      isNew: true
    }])
  }

  const removePrize = (id: string) => {
    setPrizes(prizes.filter(prize => prize.id !== id))
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">載入中...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">編輯商品</h1>
          <div className="flex gap-2">
            <Link 
              href="/products" 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本資訊區塊 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h2 className="text-lg font-bold mb-4 pb-2 border-b">基本資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">商品名稱 <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="請輸入商品名稱"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">價格 (每抽) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">稀有度</label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => setFormData({...formData, rarity: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} 星</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">發售年份</label>
                    <Input
                      type="text"
                      value={formData.releaseYear}
                      onChange={(e) => setFormData({...formData, releaseYear: e.target.value})}
                      placeholder="YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">發售月份</label>
                    <Input
                      type="text"
                      value={formData.releaseMonth}
                      onChange={(e) => setFormData({...formData, releaseMonth: e.target.value})}
                      placeholder="MM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">代理商</label>
                  <Input
                    value={formData.distributor}
                    onChange={(e) => setFormData({...formData, distributor: e.target.value})}
                    placeholder="請輸入代理商名稱"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">狀態</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="preparing">籌備中</option>
                      <option value="active">進行中</option>
                      <option value="ended">已結束</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHot}
                        onChange={(e) => setFormData({...formData, isHot: e.target.checked})}
                        className="mr-2 h-4 w-4 text-primary"
                      />
                      <span className="text-sm font-medium">設為熱門商品</span>
                    </label>
                  </div>
                </div>

                {/* 大獎等級設定 */}
                <div>
                  <label className="block text-sm font-medium mb-2">大獎等級設定 (用於判斷剩餘大獎)</label>
                  <div className="flex flex-wrap gap-2">
                    {availableLevels.map(level => (
                      <label key={level} className="flex items-center px-3 py-1.5 border rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.majorPrizes.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                majorPrizes: [...prev.majorPrizes, level]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                majorPrizes: prev.majorPrizes.filter(l => l !== level)
                              }))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    被選中的等級將被視為大獎，在前台顯示剩餘數量。
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">商品封面圖</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer relative"
                       onClick={() => document.getElementById('cover-upload')?.click()}>
                    {formData.imagePreview ? (
                      <div className="relative h-64 w-full">
                        <Image
                          src={formData.imagePreview}
                          alt="Cover preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="py-12 text-gray-400">
                        <span className="text-4xl block mb-2">+</span>
                        <span>點擊上傳圖片</span>
                      </div>
                    )}
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">商品編號</label>
                    <div className="font-amount text-lg">{productCode || '系統自動生成'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">總籤數</label>
                    <div className="font-amount text-lg">{calculatedTotalCount} 抽</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">剩餘籤數</label>
                    <div className="font-amount text-lg">{calculatedRemaining} 抽</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">預計營收</label>
                    <div className="font-amount text-lg text-green-600">
                      NT$ {(calculatedTotalCount * (parseInt(formData.price) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 驗證資訊區塊 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-2 text-sm">驗證資訊</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">開賣時間</label>
                      <div className="flex gap-2">
                        <Input 
                          type="date" 
                          value={formData.startedAt} 
                          onChange={(e) => setFormData({...formData, startedAt: e.target.value})}
                          className="bg-white text-sm"
                        />
                      </div>
                    </div>
                    
                    {formData.txidHash && (
                      <div>
                        <label className="block text-xs font-medium text-blue-600 mb-1">TXID Hash</label>
                        <div className="font-amount text-xs bg-white p-2 rounded border border-blue-200 break-all">
                          {formData.txidHash}
                        </div>
                      </div>
                    )}
                    
                    {formData.seed && (
                      <div>
                        <label className="block text-xs font-medium text-blue-600 mb-1">Seed (隱藏中)</label>
                        <div className="font-amount text-xs bg-white p-2 rounded border border-blue-200 break-all text-gray-400">
                          {formData.status === 'ended' ? formData.seed : '活動結束後公佈'}
                        </div>
                      </div>
                    )}
                    
                    {!formData.txidHash && formData.status === 'active' && formData.startedAt && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        系統將在儲存後自動生成驗證雜湊
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 獎項設定區塊 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-lg font-bold">獎項設定</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmallItemLibrary(true)}
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  從圖庫選擇
                </button>
                <button
                  type="button"
                  onClick={addPrize}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  + 新增獎項
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {prizes.map((prize, index) => (
                <div key={prize.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/30 transition-colors bg-gray-50/50">
                  <div className="w-24 h-24 flex-shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden relative group">
                    {prize.imagePreview ? (
                      <Image
                        src={prize.imagePreview}
                        alt={prize.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        無圖片
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <span className="text-xs">更換</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePrizeImageChange(prize.id, file)
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={prize.level}
                          onChange={(e) => handlePrizeChange(prize.id, 'level', e.target.value)}
                          className="w-24 p-2 border border-gray-300 rounded text-sm"
                        >
                          {availableLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                          <option value="Last One">Last One</option>
                        </select>
                        <Input
                          value={prize.name}
                          onChange={(e) => handlePrizeChange(prize.id, 'name', e.target.value)}
                          placeholder="獎項名稱"
                          className="flex-1 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>機率: {prize.probability.toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500">總數量</label>
                      <Input
                        type="number"
                        value={prize.total}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          handlePrizeChange(prize.id, 'total', val)
                          // 保持剩餘數量同步（可選，視需求而定，這裡假設編輯時不重置剩餘數量除非手動改）
                          // 這裡為了簡化，如果總數量改變，且大於原剩餘數量，可能需要調整
                          // 但為了安全，編輯模式下通常只改總數，剩餘數量可能需要另外處理或保持比例
                          // 這裡暫時簡單處理：如果總數變更，剩餘數量也跟著變更（假設是重置或調整）
                          // 更好的做法是：如果是新商品，同步；如果是舊商品，只改總數，剩餘數量不變？
                          // 為了避免邏輯複雜，這裡暫時讓用戶手動改剩餘數量
                        }}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500">剩餘數量</label>
                      <Input
                        type="number"
                        value={prize.remaining}
                        onChange={(e) => handlePrizeChange(prize.id, 'remaining', parseInt(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePrize(prize.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {prizes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">尚未新增任何獎項</p>
                  <button
                    type="button"
                    onClick={addPrize}
                    className="mt-2 text-primary hover:underline"
                  >
                    立即新增
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* 小賞圖庫 Modal */}
        <Modal
          isOpen={showSmallItemLibrary}
          onClose={() => setShowSmallItemLibrary(false)}
          title="選擇小賞"
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="搜尋小賞名稱..."
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                className="flex-1"
              />
              <select
                value={librarySelectedCategory}
                onChange={(e) => setLibrarySelectedCategory(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="all">全部類型</option>
                <option value="毛巾">毛巾</option>
                <option value="資料夾">資料夾</option>
                <option value="吊飾">吊飾</option>
                <option value="杯子">杯子</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {initialSmallItems
                .filter((item: SmallItem) => 
                  (librarySelectedCategory === 'all' || item.category === librarySelectedCategory) &&
                  (item.name.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                )
                .map((item: SmallItem) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      const newId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                      setPrizes([...prizes, {
                        id: newId,
                        name: item.name,
                        level: 'H賞',
                        image: item.imageUrl,
                        imageFile: null,
                        imagePreview: item.imageUrl,
                        total: 1,
                        remaining: 1,
                        probability: 0,
                        isNew: true
                      }])
                      setShowSmallItemLibrary(false)
                    }}
                    className="flex items-center gap-3 p-2 border border-neutral-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-neutral-500">{item.category}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}
