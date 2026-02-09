'use client'

import { AdminLayout } from '@/components'
import DatePicker from '@/components/DatePicker'
import YearMonthPicker from '@/components/YearMonthPicker'
import { Input } from '@/components/ui'
import { useLog } from '@/contexts/LogContext'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { generateTXID, calculateTXIDHash } from '@/utils/drawLogicClient'

type DbProduct = Database['public']['Tables']['products']['Row']
type DbPrize = Database['public']['Tables']['prizes']['Row']

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { addLog } = useLog()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: null as File | null,
    imagePreview: '',
    status: 'active',
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
    productCode: ''
  })
  
  const availableLevels = ['A賞', 'B賞', 'C賞', 'D賞', 'E賞', 'F賞', 'G賞', 'H賞']

  const [prizes, setPrizes] = useState<Array<{
    id: string // local unique id for React key
    dbId?: string // database UUID
    name: string
    level: string
    image: string | null
    imageFile: File | null
    imagePreview: string
    total: number
    remaining: number
    probability: number
  }>>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const calculatedTotalCount = prizes.reduce((sum, prize) => sum + prize.total, 0)
  const calculatedRemaining = prizes.reduce((sum, prize) => sum + prize.remaining, 0)

  // Calculate probabilities
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

  // Handle ended status
  useEffect(() => {
    if (formData.status === 'ended' && !formData.endedAt) {
      const now = new Date()
      const endedAtStr = now.toISOString()
      setFormData(prev => ({ ...prev, endedAt: endedAtStr }))
    } else if (formData.status !== 'ended' && formData.endedAt) {
      setFormData(prev => ({ ...prev, endedAt: '' }))
    }
  }, [formData.status])

  // Handle TXID Hash generation
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
  }, [formData.status, formData.startedAt, formData.name, addLog, formData.txidHash])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
        
        if (productError) throw productError
        if (!product) throw new Error('Product not found')

        // Fetch prizes
        const { data: dbPrizes, error: prizesError } = await supabase
          .from('prizes')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: true })

        if (prizesError) throw prizesError

        // Set form data
        const releaseDate = product.release_date ? new Date(product.release_date) : new Date()
        const startedAt = product.release_date ? product.release_date.split(' ')[0] : '' // Assuming format YYYY-MM-DD HH:mm:ss or similar

        setFormData({
          name: product.name,
          price: product.price.toString(),
          image: null,
          imagePreview: product.image_url || '',
          status: product.status,
          category: product.category || '一番賞',
          remaining: product.remaining_count.toString(),
          totalCount: product.total_count.toString(),
          isHot: product.is_hot || false,
          releaseYear: releaseDate.getFullYear().toString(),
          releaseMonth: (releaseDate.getMonth() + 1).toString().padStart(2, '0'),
          distributor: product.distributor || '',
          rarity: product.rarity || 3,
          majorPrizes: product.major_prizes || ['A賞'],
          startedAt: product.release_date ? product.release_date : '',
          endedAt: product.ended_at || '',
          txidHash: product.txid_hash || '',
          seed: product.seed || '',
          productCode: product.product_code || ''
        })

        // Set prizes
        setPrizes(dbPrizes.map(p => ({
          id: p.id,
          dbId: p.id,
          name: p.name,
          level: p.grade,
          image: p.image_url,
          imageFile: null,
          imagePreview: p.image_url || '',
          total: p.quantity,
          remaining: p.quantity, // Note: This might need to be adjusted if we track remaining separately per prize in real-time
          probability: p.probability || 0
        })))

      } catch (error) {
        console.error('Error fetching product:', error)
        alert('載入商品失敗')
        router.push('/products')
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId, supabase, router])

  const handleAddPrize = (level: string) => {
    const now = new Date()
    const date = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const id = date + random

    setPrizes(prev => [...prev, {
      id,
      name: '',
      level,
      image: null,
      imageFile: null,
      imagePreview: '',
      total: 1,
      remaining: 1,
      probability: 0
    }])
  }

  const handleRemovePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id))
  }

  const handlePrizeChange = (id: string, field: string, value: any) => {
    setPrizes(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value }
        if (field === 'total') {
          updated.remaining = value // Reset remaining when total changes? Or should we keep it proportional? 
          // For editing, usually total implies initial count. If we are editing an active product, changing total is risky.
          // Assuming simpler logic: update both for now, or assume admin knows what they are doing.
        }
        return updated
      }
      return p
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, prizeId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (prizeId) {
        setPrizes(prev => prev.map(p => 
          p.id === prizeId ? { ...p, imageFile: file, imagePreview: reader.result as string } : p
        ))
      } else {
        setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

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
      // 1. Upload Product Image (if changed)
      let productImageUrl = formData.imagePreview
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${Date.now()}-product.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, formData.image)
          
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        productImageUrl = publicUrl
      }

      // 2. Update Product
      const productUpdateData: Database['public']['Tables']['products']['Update'] = {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price) || 0,
        status: formData.status as 'active' | 'pending' | 'ended',
        is_hot: formData.isHot,
        total_count: calculatedTotalCount,
        remaining_count: calculatedRemaining, // Caution: updating remaining count directly
        release_date: formData.startedAt || new Date().toISOString(),
        image_url: productImageUrl,
        major_prizes: formData.majorPrizes,
        distributor: formData.distributor,
        rarity: formData.rarity,
        ended_at: formData.endedAt || null,
        txid_hash: formData.txidHash || null,
        seed: formData.seed || null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(productUpdateData)
        .eq('id', productId)

      if (updateError) throw updateError

      // 3. Handle Prizes
      // Identify deleted prizes
      const currentPrizeIds = prizes.filter(p => p.dbId).map(p => p.dbId)
      const { data: existingPrizes } = await supabase
        .from('prizes')
        .select('id')
        .eq('product_id', productId)
      
      const existingIds = existingPrizes?.map(p => p.id) || []
      const idsToDelete = existingIds.filter(id => !currentPrizeIds.includes(id))

      if (idsToDelete.length > 0) {
        await supabase.from('prizes').delete().in('id', idsToDelete)
      }

      // Upsert prizes (update existing, insert new)
      for (const prize of prizes) {
        let prizeImageUrl = prize.imagePreview
        
        if (prize.imageFile) {
          const fileExt = prize.imageFile.name.split('.').pop()
          const fileName = `${productId}-${prize.level}-${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('prize-images')
            .upload(fileName, prize.imageFile)
          
          if (!uploadError) {
             const { data: { publicUrl } } = supabase.storage
              .from('prize-images')
              .getPublicUrl(fileName)
             prizeImageUrl = publicUrl
          }
        }

        const prizeData = {
          product_id: parseInt(productId),
          grade: prize.level,
          name: prize.name,
          image_url: prizeImageUrl,
          quantity: prize.total,
          probability: prize.probability,
          // remaining: prize.remaining // Database trigger might handle this or we shouldn't update it if we track individual items?
          // Assuming simple model where we just update the definition.
        }

        if (prize.dbId) {
          // Update
          await supabase
            .from('prizes')
            .update(prizeData)
            .eq('id', prize.dbId)
        } else {
          // Insert
          await supabase
            .from('prizes')
            .insert(prizeData)
        }
      }

      addLog('修改商品', '商品管理', `修改商品「${formData.name}」`, 'success')
      router.push('/products')
      
    } catch (error) {
      console.error('Error updating product:', error)
      alert('更新商品失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      pageTitle="編輯商品" 
      breadcrumbs={[
        { label: '商品管理', href: '/products' },
        { label: formData.productCode || params.id as string, href: `/products/${params.id}` },
        { label: '編輯', href: `/products/${params.id}` }
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
          {/* 商品名稱 */}
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

          {/* 價格與分類 */}
          <div className="grid grid-cols-2 gap-3">
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
                分類 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 pr-10 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="一番賞">一番賞</option>
                  <option value="轉蛋">轉蛋</option>
                  <option value="盒玩">盒玩</option>
                  <option value="限定商品">限定商品</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 商品總數、剩餘數量、狀態、開賣時間 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Input
                label="商品總數"
                value={calculatedTotalCount.toLocaleString()}
                disabled
                helperText="自動計算"
                className="font-amount"
              />
            </div>
            <div>
              <Input
                label="剩餘數量"
                value={calculatedRemaining.toLocaleString()}
                disabled
                helperText="自動計算"
                className="font-amount"
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
                onChange={(value: string) => {
                  setFormData(prev => ({ ...prev, startedAt: value }))
                }}
                placeholder="選擇開賣時間"
              />
            </div>
          </div>

          {/* 完抽時間（僅編輯頁面，條件顯示） */}
          {formData.status === 'ended' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                完抽時間
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-amount text-gray-700">
                {formData.endedAt || '自動記錄中...'}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">當狀態變為「已完抽」時自動記錄</p>
            </div>
          )}

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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                上市時間
              </label>
              <YearMonthPicker
                year={formData.releaseYear}
                month={formData.releaseMonth}
                onYearChange={(value: string) => setFormData({ ...formData, releaseYear: value })}
                onMonthChange={(value: string) => setFormData({ ...formData, releaseMonth: value })}
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
              大獎等級設定 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableLevels.map(level => (
                <label
                  key={level}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.majorPrizes.includes(level)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.majorPrizes.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          majorPrizes: [...formData.majorPrizes, level]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          majorPrizes: formData.majorPrizes.filter(l => l !== level)
                        })
                      }
                    }}
                    className="hidden"
                  />
                  <span className="font-bold font-amount">{level}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">請勾選屬於大獎的等級（例如 A賞、B賞、Last One），這些獎項被抽中時會顯示大獎特效。</p>
          </div>

          {/* 獎項列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                獎項列表
              </label>
              <div className="flex gap-2">
                {availableLevels.slice(0, 4).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleAddPrize(level)}
                    className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    + {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div key={prize.id} className="bg-white border-2 border-neutral-200 rounded-lg p-4 relative group hover:border-primary/30 transition-all">
                  <button
                    type="button"
                    onClick={() => handleRemovePrize(prize.id)}
                    className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* 圖片上傳 */}
                    <div className="col-span-2">
                      <div className="aspect-square relative rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors overflow-hidden group/image cursor-pointer">
                        {prize.imagePreview ? (
                          <img src={prize.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2">
                            <span className="text-xs text-neutral-400">上傳圖片</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, prize.id)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* 獎項資訊 */}
                    <div className="col-span-10 space-y-3">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-neutral-500 mb-1">等級</label>
                          <select
                            value={prize.level}
                            onChange={(e) => handlePrizeChange(prize.id, 'level', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-white border-2 border-neutral-200 rounded-md focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                          >
                            {availableLevels.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                            <option value="Last One">Last One</option>
                          </select>
                        </div>
                        <div className="col-span-9">
                          <label className="block text-xs font-medium text-neutral-500 mb-1">名稱</label>
                          <input
                            type="text"
                            value={prize.name}
                            onChange={(e) => handlePrizeChange(prize.id, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-white border-2 border-neutral-200 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="獎項名稱"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">數量</label>
                          <input
                            type="number"
                            value={prize.total}
                            onChange={(e) => handlePrizeChange(prize.id, 'total', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm bg-white border-2 border-neutral-200 rounded-md focus:border-primary focus:ring-1 focus:ring-primary font-amount"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">機率</label>
                          <div className="px-2 py-1.5 text-sm bg-neutral-100 border-2 border-transparent rounded-md font-amount text-neutral-600">
                            {prize.probability.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-white border-2 border-neutral-200 rounded-full hover:border-neutral-300 transition-colors text-sm font-medium"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none text-sm font-medium"
            >
              {isSubmitting ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
