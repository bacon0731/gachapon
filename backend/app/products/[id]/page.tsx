'use client'

import AdminLayout from '@/components/AdminLayout'
import { YearMonthPicker, DatePicker, Modal, Input, TagSelector } from '@/components'
import { useLog } from '@/contexts/LogContext'
import { normalizePrizeLevels } from '@/utils/normalizePrizes'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { generateTXID, calculateTXIDHash } from '@/utils/drawLogicClient'
import { supabase } from '@/lib/supabaseClient'
import { SmallItem } from '@/types/product'

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
    status: 'active',
    category: '一番賞',
    categoryId: '',
    type: 'ichiban',
    remaining: '',
    totalCount: '',  // 商品總數（用於自動計算原始機率）
    isHot: false,
    releaseYear: '',
    releaseMonth: '',
    distributor: '',
    rarity: 3,
    majorPrizes: ['A賞'] as string[],  // 大獎等級列表，默認 A賞
    startedAt: '',  // 開賣時間
    endedAt: '',  // 完抽時間
    txidHash: '',  // TXID Hash（自動生成，不可編輯）
    seed: '',  // 隨機種子（活動結束後才公布，活動進行中保密）
    selectedTagIds: [] as string[],
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
  }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [productCode, setProductCode] = useState<string>('')
  const [deletedPrizeIds, setDeletedPrizeIds] = useState<string[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order', { ascending: true })
      
      if (data && data.length > 0) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [])
  
  // State for small item library
  const [showSmallItemLibrary, setShowSmallItemLibrary] = useState(false)
  const [libraryItems, setLibraryItems] = useState<SmallItem[]>([])
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | null>(null)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [librarySelectedCategory, setLibrarySelectedCategory] = useState('all')

  // Fetch small items when library is opened
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

  // 自動計算商品總數和剩餘數量（根據獎項數量）
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
      // 當狀態從 ended 變為其他狀態時，清除完抽時間
      setFormData(prev => ({ ...prev, endedAt: '' }))
    }
  }, [formData.status])

  // 當商品上架且開賣時，自動生成 TXID Hash
  useEffect(() => {
    const checkAndGenerateTXIDHash = async () => {
      // 檢查條件：狀態為 active（進行中）且有開賣時間，但還沒有 TXID Hash
      if (formData.status === 'active' && formData.startedAt && !formData.txidHash) {
        if (typeof window === 'undefined' || !window.crypto) {
          return
        }
        
        try {
          // 生成隨機 Seed
          const seed = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
          
          // 使用 Nonce = 1（活動開始時的第一個抽獎）
          const nonce = 1
          const txid = generateTXID(seed, nonce)
          const hash = await calculateTXIDHash(txid)
          
          // 同時保存 Seed 和 TXID Hash
          setFormData(prev => ({ ...prev, txidHash: hash, seed: seed }))
          addLog('自動生成 TXID Hash', '商品管理', `商品「${formData.name || '未命名'}」已開賣，自動生成 TXID Hash 和 Seed`, 'success')
        } catch (e) {
          console.error('自動生成 TXID Hash 失敗:', e)
        }
      }
    }
    
    checkAndGenerateTXIDHash()
  }, [formData.status, formData.startedAt, formData.name, addLog])
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        const { data: product, error } = await supabase
          .from('products')
          .select(`
            *,
            product_prizes (*)
          `)
          .eq('id', productId)
          .single()

        if (error) {
          throw error
        }

        if (product) {
          setProductCode(product.product_code)
          
          // 設置日期
          const now = new Date()
          const defaultYear = product.release_year || now.getFullYear().toString()
          const defaultMonth = product.release_month || (now.getMonth() + 1).toString().padStart(2, '0')
          
          // Fetch existing tags
          const { data: tags } = await supabase
            .from('product_tags')
            .select('category_id')
            .eq('product_id', productId)
            
          let tagIds = tags ? tags.map(t => t.category_id) : []
          let primaryCategoryId = product.category_id || ''
          let primaryCategoryName = product.category || ''

          // If no tags are selected, default to 'Year-end Clearance'
          if (tagIds.length === 0) {
             const { data: clearanceCat } = await supabase.from('categories').select('id, name').eq('name', '年末出清【限時】').single();
             if (clearanceCat) {
                tagIds = [clearanceCat.id];
                // If primary category is also missing, set it too
                if (!primaryCategoryId) {
                    primaryCategoryId = clearanceCat.id;
                    primaryCategoryName = clearanceCat.name;
                }
             }
          }
          
          setFormData({
            name: product.name,
            price: product.price.toString(),
            image: null,
            imagePreview: product.image_url || '/item.png',
            status: product.status,
            category: primaryCategoryName,
            categoryId: primaryCategoryId,
            type: product.type || 'ichiban',
            remaining: product.remaining.toString(),
            totalCount: product.total_count?.toString() || '0',
            isHot: product.is_hot,
            releaseYear: defaultYear,
            releaseMonth: defaultMonth,
            distributor: product.distributor || '',
            rarity: product.rarity || 3,
            majorPrizes: product.major_prizes || ['A賞'],
            startedAt: product.started_at ? product.started_at.split('T')[0] : '', // 假設是 ISO 格式
            endedAt: product.ended_at ? product.ended_at.replace('T', ' ').split('.')[0] : '', // 簡單處理
            txidHash: product.txid_hash || '',
            seed: product.seed || '',
            selectedTagIds: tagIds,
          })

          // 排序獎項 (可選：根據 level 或 created_at)
          // 這裡假設需要按照某種順序，例如 level A, B, C...
          const sortedPrizes = (product.product_prizes || []).sort((a: any, b: any) => {
            return a.level.localeCompare(b.level)
          })

          setPrizes(sortedPrizes.map((prize: any) => ({
            id: prize.id,
            name: prize.name,
            level: prize.level,
            image: prize.image_url,
            imageFile: null,
            imagePreview: prize.image_url,
            total: prize.total,
            remaining: prize.remaining,
            probability: prize.probability,
          })))
        }
      } catch (e) {
        console.error('Error loading product:', e)
        // 商品不存在或錯誤，重定向回商品列表
        setTimeout(() => {
          router.push('/products')
        }, 1000)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證大獎等級設定
    if (formData.majorPrizes.length === 0) {
      alert('請至少選擇一個大獎等級')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 1. Upload Product Image
      let productImageUrl = formData.imagePreview
      // If the image is a blob URL (newly selected), upload it.
      // If it's a supabase URL (existing), keep it.
      // Or simply check if formData.image is not null.
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

      // 2. Prepare Product Data
      const productData = {
        name: formData.name,
        category: formData.category,
        category_id: formData.categoryId,
        type: formData.type,
        price: parseInt(formData.price) || 0,
        remaining: calculatedRemaining,
        status: formData.status,
        is_hot: formData.isHot,
        total_count: calculatedTotalCount,
        release_year: formData.releaseYear,
        release_month: formData.releaseMonth,
        distributor: formData.distributor,
        rarity: formData.rarity,
        major_prizes: formData.majorPrizes.length > 0 ? formData.majorPrizes : ['A賞'],
        started_at: formData.startedAt ? (formData.startedAt.includes(':') ? formData.startedAt : `${formData.startedAt} 00:00:00`) : null,
        ended_at: formData.status === 'ended' ? formData.endedAt : null,
        txid_hash: formData.txidHash || null,
        seed: formData.seed || null,
        image_url: productImageUrl,
      }

      // If becoming active and no started_at, set to now
      if (productData.status === 'active' && !productData.started_at) {
        productData.started_at = new Date().toISOString()
      }

      // Update Product
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)

      if (updateError) throw updateError

      // 2.5 Update Product Tags
      if (formData.selectedTagIds) {
        // Delete existing tags
        await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', productId)
        
        // Insert new tags
        if (formData.selectedTagIds.length > 0) {
          const tagInserts = formData.selectedTagIds.map(tagId => ({
            product_id: productId,
            category_id: tagId
          }))
          
          const { error: tagError } = await supabase
            .from('product_tags')
            .insert(tagInserts)
            
          if (tagError) console.error('Error updating tags:', tagError)
        }
      }

      // 3. Handle Prizes Deletion
      if (deletedPrizeIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_prizes')
          .delete()
          .in('id', deletedPrizeIds)
        
        if (deleteError) console.error('Error deleting prizes:', deleteError)
      }

      // 4. Handle Prizes Upsert and Insert
      const existingPrizesPayload: any[] = []
      const newPrizesPayload: any[] = []

      await Promise.all(prizes.map(async (prize) => {
        let prizeImageUrl = prize.imagePreview
        if (prize.imageFile) {
          const file = prize.imageFile
          const fileExt = file.name.split('.').pop()
          const fileName = `prize-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, file)
          
          if (!uploadError) {
            const { data } = supabase.storage.from('products').getPublicUrl(fileName)
            prizeImageUrl = data.publicUrl
          }
        }

        const prizePayload: any = {
          product_id: productId,
          name: prize.name,
          level: prize.level,
          image_url: prizeImageUrl,
          total: prize.total,
          remaining: prize.remaining,
          probability: prize.probability
        }

        // Only include ID if it's an existing prize (UUID)
        if (!prize.id.toString().startsWith('p')) {
          prizePayload.id = prize.id
          existingPrizesPayload.push(prizePayload)
        } else {
          newPrizesPayload.push(prizePayload)
        }
      }))

      // Update existing prizes
      if (existingPrizesPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('product_prizes')
          .upsert(existingPrizesPayload)
        
        if (upsertError) throw upsertError
      }

      // Insert new prizes
      if (newPrizesPayload.length > 0) {
        const { error: insertError } = await supabase
          .from('product_prizes')
          .insert(newPrizesPayload)
        
        if (insertError) throw insertError
      }

      addLog('修改商品', '商品管理', `修改商品「${formData.name}」`, 'success')
      router.push('/products')
      
    } catch (e: any) {
      console.error('Failed to update product:', e)
      alert(`更新商品失敗：${e.message || '請稍後再試'}`)
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
        { label: productCode, href: `/products/${productId}` },
        { label: '編輯', href: `/products/${productId}` }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>

          {/* 標籤選擇 */}
          <div>
            <TagSelector
              options={categories}
              value={formData.selectedTagIds}
              onChange={(newTags) => {
                setFormData(prev => {
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
            <p className="text-xs text-neutral-500 mt-1">選擇商品標籤，商品將顯示在所有選中標籤的頁面中。</p>
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
                value={formData.startedAt}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, startedAt: value }))
                }}
                placeholder="選擇開賣時間"
              />
              <p className="text-xs text-gray-500 mt-0.5">選填。如沒有設定時間，開賣時間等於第一次上架時間（用於前台顯示倒數計時）</p>
            </div>
          </div>

          {/* 完抽時間（僅編輯頁面，條件顯示） */}
          {formData.status === 'ended' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                完抽時間
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-mono text-gray-700">
                {formData.endedAt || '自動記錄中...'}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">當狀態變為「已完抽」時自動記錄</p>
            </div>
          )}

          {/* Seed（活動結束後才顯示） */}
          {formData.status === 'ended' && formData.seed && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                隨機種子 (Seed)（活動結束後公布）
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-mono text-gray-700 break-all">
                  {formData.seed}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(formData.seed || '')
                      alert('Seed 已複製到剪貼板')
                    } catch (e) {
                      console.error('複製失敗:', e)
                    }
                  }}
                  className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm font-medium whitespace-nowrap"
                  title="複製 Seed"
                >
                  複製
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                此 Seed 在活動結束後才公布，玩家可使用此 Seed 和對應的 Nonce 來驗證抽獎結果
              </p>
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

          {/* 大獎等級設定 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              大獎等級設定 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-neutral-500 mb-2">選擇哪些等級屬於大獎（用於判斷是否為廢套）</p>
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
                    className="w-4 h-4 rounded border-2 border-current"
                  />
                  <span className="text-sm font-medium">{level}</span>
                </label>
              ))}
            </div>
            {formData.majorPrizes.length === 0 && (
              <p className="text-xs text-red-500 mt-1">請至少選擇一個大獎等級</p>
            )}
          </div>

          {/* 商品圖片 */}
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
          <div className="border-t border-neutral-200 pt-8">
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
                      const prizeToDelete = prizes[index]
                      if (!prizeToDelete.id.toString().startsWith('p')) {
                        setDeletedPrizeIds(prev => [...prev, prizeToDelete.id])
                      }
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
                        placeholder="例如：炭治郎 模型"
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
                            updated[index].level = e.target.value
                            setPrizes(updated)
                          }}
                          className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">請選擇等級</option>
                          <option value="A賞">A賞</option>
                          <option value="B賞">B賞</option>
                          <option value="C賞">C賞</option>
                          <option value="D賞">D賞</option>
                          <option value="E賞">E賞</option>
                          <option value="F賞">F賞</option>
                          <option value="G賞">G賞</option>
                          <option value="H賞">H賞</option>
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
                          // Update remaining count to match total count automatically
                          updated[index].total = newTotal
                          updated[index].remaining = newTotal
                          setPrizes(updated)
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-gray-700"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        剩餘數量
                      </label>
                      <input
                        type="number"
                        value={prize.remaining === 0 ? '' : prize.remaining}
                        onChange={(e) => {
                          const updated = [...prizes]
                          updated[index].remaining = e.target.value === '' ? 0 : parseInt(e.target.value)
                          setPrizes(updated)
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-gray-700"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        原始機率 (%)
                        <span className="ml-1 text-blue-500" title="根據總數量和商品總數自動計算">🔒</span>
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700">
                        {calculatedTotalCount > 0 && prize.total > 0 
                          ? ((prize.total / calculatedTotalCount) * 100).toFixed(2)
                          : '0.00'
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
                  onClick={() => {
                    const newPrize = {
                      id: `p${Date.now()}`,
                      name: '',
                      level: '',
                      image: '',
                      imageFile: null as File | null,
                      imagePreview: '',
                      total: 0,
                      remaining: 0,
                      probability: 0,  // 會根據 total 和 totalCount 自動計算
                    }
                    setPrizes([...prizes, newPrize])
                  }}
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
                  onClick={() => {
                    const newPrize = {
                      id: `p${Date.now()}`,
                      name: '',
                      level: '',
                      image: '',
                      imageFile: null as File | null,
                      imagePreview: '',
                      total: 0,
                      remaining: 0,
                      probability: 0,  // 會根據 total 和 totalCount 自動計算
                    }
                    setPrizes([...prizes, newPrize])
                  }}
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

          {/* 底部操作按鈕 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-white border-2 border-neutral-200 rounded-full hover:border-neutral-300 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              取消
            </button>
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
