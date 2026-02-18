'use client'

import AdminLayout from '@/components/AdminLayout'
import { YearMonthPicker, DatePicker, Modal, Input, TagSelector } from '@/components'
import { useLog } from '@/contexts/LogContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { normalizePrizeLevels } from '@/utils/normalizePrizes'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { SmallItem } from '@/types/product'

export default function NewProductPage() {
  const router = useRouter()
  const { addLog } = useLog()
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: null as File | null,
    imagePreview: '',
    status: 'active',
    category: '',
    categoryId: '',
    selectedTagIds: [] as string[],
    type: 'ichiban', // Default type
    remaining: '',
    totalCount: '',  // 商品總數（用於自動計算原始機率）
    isHot: false,
    releaseYear: '',
    releaseMonth: '',
    distributor: '',
    rarity: 3,
    startedAt: '',  // 開賣時間（選填，格式：YYYY-MM-DD）
  })
  
  const isLastOneLevel = (level: string) => {
    if (!level) return false
    const l = level.toLowerCase()
    return l.includes('last one') || level.includes('最後賞')
  }

  const ichibanLevels = [
    { value: 'A賞', label: 'A賞' },
    { value: 'B賞', label: 'B賞' },
    { value: 'C賞', label: 'C賞' },
    { value: 'D賞', label: 'D賞' },
    { value: 'E賞', label: 'E賞' },
    { value: 'F賞', label: 'F賞' },
    { value: 'G賞', label: 'G賞' },
    { value: 'H賞', label: 'H賞' },
    { value: '最後賞', label: '最後賞' },
  ]

  const gachaLevels = [
    { value: 'Normal / Common', label: '一般版 Normal / Common' },
    { value: 'Rare', label: '稀有版 Rare' },
    { value: 'Secret', label: '隱藏版 Secret' },
    { value: 'Color Variant', label: '異色版 Color Variant' },
    { value: 'Effect / Clear', label: '特效版 Effect / Clear' },
    { value: 'Limited', label: '限定版 Limited' },
    { value: 'Option Parts', label: '配件版 Option Parts' },
  ]

  // 在客戶端設置日期，避免 Hydration Error
  useEffect(() => {
    const now = new Date()
    setFormData(prev => ({
      ...prev,
      releaseYear: now.getFullYear().toString(),
      releaseMonth: (now.getMonth() + 1).toString().padStart(2, '0'),
    }))
  }, [])

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
  }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order', { ascending: true })
      
      if (data && data.length > 0) {
        setCategories(data)
        // Default select nothing or first one? Let's leave it empty for user to choose
      }
    }
    fetchCategories()
  }, [])

  // 自動計算商品總數和剩餘數量（排除最後賞）
  const normalPrizes = prizes.filter(p => !isLastOneLevel(p.level))
  const calculatedTotalCount = normalPrizes.reduce((sum, prize) => sum + prize.total, 0)
  const calculatedRemaining = normalPrizes.reduce((sum, prize) => sum + prize.remaining, 0)

  // 當獎項數量變化時，自動更新機率
  useEffect(() => {
    if (calculatedTotalCount > 0) {
      setPrizes(prevPrizes => prevPrizes.map(prize => {
        if (isLastOneLevel(prize.level)) {
          return { ...prize, probability: 0 }
        }
        return {
          ...prize,
          probability: prize.total > 0 ? (prize.total / calculatedTotalCount) * 100 : 0
        }
      }))
    } else {
      setPrizes(prevPrizes => prevPrizes.map(prize => ({
        ...prize,
        probability: 0
      })))
    }
  }, [calculatedTotalCount])
  const [showSmallItemLibrary, setShowSmallItemLibrary] = useState(false)
  const [libraryItems, setLibraryItems] = useState<SmallItem[]>([])
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | null>(null)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [librarySelectedCategory, setLibrarySelectedCategory] = useState('all')
  const prizeSectionRef = useRef<HTMLDivElement | null>(null)

  const addPrize = () => {
    const newPrize = {
      id: `p${Date.now()}`,
      name: '',
      level: '',
      image: '',
      imageFile: null as File | null,
      imagePreview: '',
      total: 0,
      remaining: 0,
      probability: 0,
    }
    setPrizes(prev => [...prev, newPrize])
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const scrollTarget =
          document.documentElement?.scrollHeight || document.body?.scrollHeight || 0
        window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      })
    }
  }

  useEffect(() => {
    if (showSmallItemLibrary && libraryItems.length === 0) {
      const fetchLibraryItems = async () => {
        const { data, error } = await supabase
          .from('small_items')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (data) {
          const mappedItems: SmallItem[] = data.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.image_url,
            category: item.category,
            level: item.level,
            description: item.description,
            createdAt: item.created_at
          }))
          setLibraryItems(mappedItems)
        }
      }
      fetchLibraryItems()
    }
  }, [showSmallItemLibrary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證必填欄位
    if (!formData.name || !formData.price || prizes.length === 0) {
      alert('請填寫所有必填欄位並至少添加一個獎項')
      return
    }
    setIsSubmitting(true)
    
    try {
      // 1. Upload Product Image
      let productImageUrl = formData.imagePreview
      if (formData.image) {
        const file = formData.image
        const fileExt = file.name.split('.').pop()
        const fileName = `product-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file)
        
        if (!uploadError) {
          const { data } = supabase.storage.from('products').getPublicUrl(fileName)
          productImageUrl = data.publicUrl
        } else {
          console.error('Error uploading product image:', uploadError)
        }
      }

      // 2. Insert Product
      const totalCount = calculatedTotalCount
      const remaining = calculatedRemaining
      
      // Handle startedAt
      let startedAt = formData.startedAt ? `${formData.startedAt} 00:00:00` : null
      if (!startedAt && formData.status === 'active') {
        startedAt = new Date().toISOString()
      }

      const productData = {
        name: formData.name,
        category: formData.category,
        category_id: formData.categoryId || null,
        type: formData.type,
        price: parseInt(formData.price) || 0,
        remaining: remaining,
        status: formData.status,
        sales: 0,
        is_hot: formData.isHot,
        total_count: totalCount,
        release_year: formData.releaseYear,
        release_month: formData.releaseMonth,
        distributor: formData.distributor,
        rarity: formData.rarity,
        started_at: startedAt,
        product_code: 'PENDING',
        image_url: productImageUrl || '/images/item.png'
      }

      let newProductId: number
      let newProductCode: string

      // 2.1 Insert Product（含 major_prizes），若陣列欄位格式錯誤則退回使用預設值重試
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (insertError) {
        const msg = insertError.message || ''
        console.error('Insert product failed, will check for array error:', msg)

        const isArrayFormatError =
          msg.includes('array') ||
          msg.includes('[]') ||
          msg.includes('陣列') ||
          msg.includes('ARRAY')

        if (isArrayFormatError) {
          const fallbackData = { ...productData }
          // 讓資料庫使用 major_prizes 預設值
          delete (fallbackData as any).major_prizes

          const { data: retryProduct, error: retryError } = await supabase
            .from('products')
            .insert(fallbackData)
            .select()
            .single()

          if (!retryProduct || retryError) {
            const retryMsg = retryError?.message || ''
            console.error('Retry insert product without major_prizes failed:', retryMsg || retryError)
            throw (retryError || insertError)
          }

          newProductId = retryProduct.id
          newProductCode = String(newProductId).padStart(5, '0')
        } else {
          throw insertError
        }
      } else {
        newProductId = newProduct.id
        newProductCode = String(newProductId).padStart(5, '0')
      }

      // 3. Update Product Code
      await supabase
        .from('products')
        .update({ product_code: newProductCode })
        .eq('id', newProductId)

      // 3.5 Insert Product Tags
      if (formData.selectedTagIds.length > 0) {
        const tagInserts = formData.selectedTagIds.map(tagId => ({
          product_id: newProductId,
          category_id: tagId
        }))
        
        const { error: tagError } = await supabase
          .from('product_tags')
          .insert(tagInserts)
        
        if (tagError) console.error('Error inserting tags:', tagError)
      }

      // 4. Upload Prize Images and Insert Prizes
      const prizeInserts = await Promise.all(prizes.map(async (prize) => {
        let prizeImageUrl = prize.imagePreview || prize.image || 'https://via.placeholder.com/60x60?text=獎項'
        if (prize.imageFile) {
          const file = prize.imageFile
          const fileExt = file.name.split('.').pop()
          const fileName = `prize-${newProductId}-${prize.level}-${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, file)
            
          if (!uploadError) {
            const { data } = supabase.storage.from('products').getPublicUrl(fileName)
            prizeImageUrl = data.publicUrl
          }
        }

        return {
          product_id: newProductId,
          name: prize.name,
          level: prize.level,
          image_url: prizeImageUrl,
          total: prize.total,
          remaining: prize.remaining,
          probability: prize.probability
        }
      }))

      const { error: prizesError } = await supabase
        .from('product_prizes')
        .insert(prizeInserts)

      if (prizesError) throw prizesError
      
      if (typeof window !== 'undefined' && window.crypto) {
        try {
          const { calculateSeedHash } = await import('@/utils/drawLogicClient')
          const randomBytes = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
          const seed = randomBytes.map(b => b.toString(16).padStart(2, '0')).join('')
          const hash = await calculateSeedHash(seed)
          
          const { error: hashError } = await supabase
            .from('products')
            .update({ txid_hash: hash, seed })
            .eq('id', newProductId)
          
          if (hashError) {
            console.error('Error updating product hash:', hashError)
          }
        } catch (err) {
          console.error('Error generating TXID Hash for new product:', err)
        }
      }
      
      addLog('新增商品', '商品管理', `新增商品「${formData.name}」`, 'success')
      router.push('/products')

    } catch (error: any) {
      const msg =
        error?.message ||
        error?.error_description ||
        (typeof error === 'string' ? error : '')
      console.error('Error creating product:', error)
      alert(`新增商品失敗：${msg || '請稍後再試'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout 
      pageTitle="新增商品" 
      breadcrumbs={[
        { label: '商品管理', href: '/products' },
        { label: '新增商品', href: undefined }
      ]}
    >
      <div className="space-y-4">
        {/* 返回按鈕 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-white border-2 border-neutral-200 rounded-full hover:border-neutral-300 transition-colors text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              商品名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm"
              placeholder="請輸入商品名稱"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                價格（代幣） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm"
                placeholder="0"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                商品類型 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 pr-10 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="ichiban">一番賞</option>
                  <option value="blindbox">盒玩 (盲盒)</option>
                  <option value="gacha">轉蛋</option>
                  <option value="custom">自製賞</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <TagSelector
                options={categories}
                value={formData.selectedTagIds}
                onChange={(newTags) => {
                  setFormData(prev => {
                    // Also update legacy category/categoryId fields for backward compatibility
                    // Use the first selected tag or empty
                    const firstTagId = newTags[0]
                    const firstTagName = categories.find(c => c.id === firstTagId)?.name || ''
                    
                    return {
                      ...prev,
                      selectedTagIds: newTags,
                      categoryId: firstTagId || '',
                      category: firstTagName
                    }
                  })
                }}
                label="顯示菜單"
              />
            </div>
          </div>

          {/* 商品總數、剩餘數量、狀態、開賣時間 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Input
                label="商品總數"
                value={calculatedTotalCount.toString()}
                disabled
                helperText="自動計算（所有獎項總數量之和）"
                className="font-mono"
              />
            </div>
            <div>
              <Input
                label="剩餘數量"
                value={calculatedRemaining.toString()}
                disabled
                helperText="自動計算（所有獎項剩餘數量之和）"
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                狀態
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 pr-10 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="active">進行中</option>
                  <option value="pending">待上架</option>
                  <option value="ended">已完抽</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <DatePicker
                label="開賣時間"
                value={formData.startedAt ? formData.startedAt.split(' ')[0] : ''}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, startedAt: value }))
                }}
                placeholder="選擇開賣時間"
              />
              <p className="text-xs text-gray-500 mt-0.5">選填。如沒有設定時間，開賣時間等於第一次上架時間（用於前台顯示倒數計時）</p>
            </div>
          </div>

          {/* 稀有度 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              稀有度
            </label>
            <div className="relative">
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 pr-10 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
              >
                <option value="1">1 星</option>
                <option value="2">2 星</option>
                <option value="3">3 星</option>
                <option value="4">4 星</option>
                <option value="5">5 星</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 上市時間與代理商 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                上市時間
              </label>
              <YearMonthPicker
                year={formData.releaseYear}
                month={formData.releaseMonth}
                onYearChange={(value) => setFormData({ ...formData, releaseYear: value })}
                onMonthChange={(value) => setFormData({ ...formData, releaseMonth: value })}
                placeholder="選擇上市時間"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                代理商
              </label>
              <input
                type="text"
                value={formData.distributor}
                onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm"
                placeholder="例如：萬代南夢宮娛樂"
              />
            </div>
          </div>

          {/* 熱賣商品標記 */}
          <div className="bg-neutral-50 border-2 border-neutral-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isHot}
                onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary rounded border-2 border-neutral-300 focus:border-primary"
              />
              <div>
                <span className="text-sm font-medium text-neutral-700">標記為熱賣商品</span>
                <p className="text-xs text-neutral-500 mt-0.5">熱賣商品將在前台顯示熱賣標籤</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              商品圖片
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData({ 
                        ...formData, 
                        image: file,
                        imagePreview: URL.createObjectURL(file)
                      })
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white file:cursor-pointer hover:file:bg-primary-dark"
                />
              </div>
              {formData.imagePreview && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img 
                      src={formData.imagePreview} 
                      alt="預覽" 
                      className="w-40 h-40 object-cover rounded-lg border-2 border-neutral-200 shadow-sm" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 獎項管理 */}
          <div ref={prizeSectionRef} className="border-t border-neutral-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">獎項管理</h3>
                <p className="text-xs text-neutral-500 mt-0.5">設定商品的獎項資訊與配率</p>
              </div>
            </div>

            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div key={prize.id} className="border-2 border-neutral-200 rounded-lg p-4 bg-neutral-50 hover:border-primary/50 transition-colors relative">
                  {/* 刪除按鈕 - 右上角，與內容區隔 */}
                  <button
                    type="button"
                    onClick={() => {
                      setPrizes(prizes.filter((_, i) => i !== index))
                    }}
                    className="absolute -top-2 -right-2 p-2 bg-white border-2 border-red-200 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 rounded-full shadow-md hover:shadow-lg transition-all z-10"
                    title="刪除此獎項"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        獎項名稱
                      </label>
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => {
                          const updated = [...prizes]
                          updated[index].name = e.target.value
                          setPrizes(updated)
                        }}
                        className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm"
                        placeholder="例如：炭治郎 模型 A賞"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        獎項等級
                      </label>
                      <div className="relative">
                        <select
                          value={prize.level}
                          onChange={(e) => {
                            const updated = [...prizes]
                            const newLevel = e.target.value
                            updated[index].level = newLevel
                            // 最後賞預設固定 1 張，機率為 0
                            if (isLastOneLevel(newLevel)) {
                              // 若尚未設定或為 0，設為 1
                              const fixed = updated[index]
                              const ensureOne = (v: number) => (v && v > 0 ? v : 1)
                              fixed.total = ensureOne(fixed.total)
                              fixed.remaining = ensureOne(fixed.remaining)
                              fixed.probability = 0
                            }
                            setPrizes(updated)
                          }}
                          className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">請選擇等級</option>
                          {formData.type === 'gacha'
                            ? gachaLevels.map(level => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))
                            : ichibanLevels.map(level => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        總數量
                      </label>
                      <input
                        type="number"
                        value={prize.total === 0 ? '' : prize.total}
                        onChange={(e) => {
                          const updated = [...prizes]
                          const newTotal = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                          updated[index].total = newTotal
                          // 新增商品時，剩餘數量自動等於總數量
                          updated[index].remaining = newTotal
                          setPrizes(updated)
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-gray-700"
                        disabled={isLastOneLevel(prize.level)}
                        min="0"
                        placeholder="0"
                      />
                      {isLastOneLevel(prize.level) && (
                        <p className="text-xs text-gray-500 mt-0.5">最後賞固定 1 張</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        剩餘數量
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700">
                        {prize.remaining === 0 ? '0' : prize.remaining}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">自動等於總數量</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        原始機率 (%)
                        <span className="ml-1 text-blue-500" title="根據總數量和商品總數自動計算">🔒</span>
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700">
                        {isLastOneLevel(prize.level)
                          ? '0.00'
                          : (calculatedTotalCount > 0 && prize.total > 0 
                              ? ((prize.total / calculatedTotalCount) * 100).toFixed(2)
                              : '0.00'
                            )
                        }%
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">自動計算，不可編輯</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      獎項圖片
                    </label>
                    <div className="space-y-3">
                      {/* 低階賞（E, F, G, H）顯示從資源庫選擇按鈕 */}
                      {['E賞', 'F賞', 'G賞', 'H賞'].includes(prize.level) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPrizeIndex(index)
                            setShowSmallItemLibrary(true)
                            setLibrarySearchQuery('')
                            setLibrarySelectedCategory('all')
                          }}
                          className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          從資源庫選擇
                        </button>
                      )}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const updated = [...prizes]
                              updated[index].imageFile = file
                              updated[index].imagePreview = URL.createObjectURL(file)
                              updated[index].image = ''
                              setPrizes(updated)
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white file:cursor-pointer hover:file:bg-primary-dark"
                        />
                      </div>
                      {prize.imagePreview && (
                        <div className="mt-2">
                          <div className="relative inline-block">
                            <img 
                              src={prize.imagePreview} 
                              alt="獎項預覽" 
                              className="w-32 h-32 object-cover rounded-lg border-2 border-neutral-200 shadow-sm" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...prizes]
                                updated[index].imageFile = null
                                updated[index].imagePreview = ''
                                updated[index].image = ''
                                setPrizes(updated)
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* 空狀態：點擊新增獎項 */}
              {prizes.length === 0 ? (
                <button
                  type="button"
                  onClick={addPrize}
                  className="w-full text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-neutral-500">尚未添加任何獎項</p>
                  <p className="text-sm text-neutral-400 mt-1">點擊此處開始添加</p>
                </button>
              ) : (
                /* 有獎項時：顯示新增更多按鈕 */
                <button
                  type="button"
                  onClick={addPrize}
                  className="w-full text-center py-4 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-2 text-neutral-500 hover:text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>新增獎項</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md"
            >
              {isSubmitting ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>

        {/* 小物資源庫選擇彈窗 */}
        <Modal
          isOpen={showSmallItemLibrary}
          onClose={() => {
            setShowSmallItemLibrary(false)
            setSelectedPrizeIndex(null)
            setLibrarySearchQuery('')
            setLibrarySelectedCategory('all')
          }}
          title="從資源庫選擇小物"
        >
          <div className="space-y-4">
            {/* 搜尋和篩選 */}
            <div className="space-y-3">
              <input
                type="text"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                placeholder="搜尋小物名稱、分類..."
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <select
                value={librarySelectedCategory}
                onChange={(e) => setLibrarySelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">全部分類</option>
                {Array.from(new Set(libraryItems.map(item => item.category))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 小物列表 */}
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {libraryItems
                  .filter(item => {
                    const matchSearch = !librarySearchQuery || 
                      item.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                      (item.description && item.description.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                    const matchCategory = librarySelectedCategory === 'all' || item.category === librarySelectedCategory
                    return matchSearch && matchCategory
                  })
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (selectedPrizeIndex !== null) {
                          const updated = [...prizes]
                          updated[selectedPrizeIndex].name = item.name
                          updated[selectedPrizeIndex].image = item.imageUrl || ''
                          updated[selectedPrizeIndex].imagePreview = item.imageUrl || ''
                          updated[selectedPrizeIndex].imageFile = null
                          setPrizes(updated)
                        }
                        setShowSmallItemLibrary(false)
                        setSelectedPrizeIndex(null)
                        setLibrarySearchQuery('')
                        setLibrarySelectedCategory('all')
                      }}
                      className="p-3 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="relative w-full aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-2">
                        <Image
                          src={item.imageUrl || 'https://via.placeholder.com/60'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-sm font-medium text-neutral-900 mb-1">{item.name}</div>
                      <div className="text-xs text-neutral-500">{item.category}</div>
                    </button>
                  ))}
              </div>
              {libraryItems.filter(item => {
                const matchSearch = !librarySearchQuery || 
                  item.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                  item.category.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                  (item.description && item.description.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                const matchCategory = librarySelectedCategory === 'all' || item.category === librarySelectedCategory
                return matchSearch && matchCategory
              }).length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <p>找不到符合條件的小物</p>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Link
                href="/small-items/new"
                className="px-4 py-2 text-sm text-primary hover:text-primary-dark font-medium"
              >
                + 新增小物到資源庫
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowSmallItemLibrary(false)
                  setSelectedPrizeIndex(null)
                  setLibrarySearchQuery('')
                  setLibrarySelectedCategory('all')
                }}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}
