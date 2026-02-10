'use client'

import { AdminLayout } from '@/components'
import DatePicker from '@/components/DatePicker'
import YearMonthPicker from '@/components/YearMonthPicker'
import { Input } from '@/components/ui'
import { useLog } from '@/contexts/LogContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type DbProduct = Database['public']['Tables']['products']['Insert']
type DbPrize = Database['public']['Tables']['product_prizes']['Insert']

export default function NewProductPage() {
  const router = useRouter()
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
  })
  
  const availableLevels = ['A賞', 'B賞', 'C賞', 'D賞', 'E賞', 'F賞', 'G賞', 'H賞']

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

  const calculatedTotalCount = prizes.reduce((sum, prize) => sum + prize.total, 0)
  const calculatedRemaining = prizes.reduce((sum, prize) => sum + prize.remaining, 0)

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
      // 1. Upload Product Image (if any)
      let productImageUrl = null
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${Date.now()}-product.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, formData.image)
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          // Continue without image or alert?
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)
          productImageUrl = publicUrl
        }
      }

      // 2. Insert Product
      const productData: DbProduct = {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price) || 0,
        remaining: calculatedRemaining,
        status: formData.status as 'active' | 'pending' | 'ended',
        is_hot: formData.isHot,
        total_count: calculatedTotalCount,
        release_date: formData.startedAt ? `${formData.startedAt} 00:00:00` : new Date().toISOString(),
        created_at: new Date().toISOString(),
        image_url: productImageUrl,
        // New columns
        major_prizes: formData.majorPrizes,
        distributor: formData.distributor,
        rarity: formData.rarity,
        // product_code will be updated later
      }

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (insertError) throw insertError
      if (!newProduct) throw new Error('Product creation failed')

      // 3. Update Product Code
      const newProductCode = String(newProduct.id).padStart(5, '0')
      await supabase
        .from('products')
        .update({ product_code: newProductCode })
        .eq('id', newProduct.id)

      // 4. Insert Prizes
      const prizesData: DbPrize[] = await Promise.all(prizes.map(async (prize) => {
        let prizeImageUrl = prize.image // Default to existing URL/placeholder
        
        if (prize.imageFile) {
          const fileExt = prize.imageFile.name.split('.').pop()
          const fileName = `${newProduct.id}-${prize.level}-${Date.now()}.${fileExt}`
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

        return {
          product_id: newProduct.id,
          level: prize.level,
          name: prize.name,
          image_url: prizeImageUrl,
          total: prize.total,
          remaining: prize.total, // Initialize remaining equal to total
          probability: prize.probability
        }
      }))

      const { error: prizesError } = await supabase
        .from('product_prizes')
        .insert(prizesData)

      if (prizesError) throw prizesError

      addLog('新增商品', '商品管理', `新增商品「${formData.name}」`, 'success')
      router.push('/products')
      
    } catch (error) {
      console.error('Error creating product:', error)
      alert('新增商品失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to add prize
  const handleAddPrize = (level: string) => {
    const now = new Date()
    const date = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
    // 格式：YYYYMM + 5位隨機數
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const id = date + random

    setPrizes(prev => [...prev, {
      id,
      name: '',
      level,
      image: '',
      imageFile: null,
      imagePreview: '',
      total: 1,
      remaining: 1,
      probability: 0
    }])
  }

  const handleRemovePrize = (index: number) => {
    setPrizes(prev => prev.filter((_, i) => i !== index))
  }

  const handlePrizeChange = (index: number, field: string, value: any) => {
    setPrizes(prev => prev.map((prize, i) => {
      if (i === index) {
        const updated = { ...prize, [field]: value }
        if (field === 'total') {
          updated.remaining = value // Reset remaining when total changes for new product
        }
        return updated
      }
      return prize
    }))
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                價格（代幣） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-neutral-300 shadow-sm font-amount"
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
                  <option value="ended">已完售</option>
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
                    className="w-4 h-4 rounded border-2 border-current"
                  />
                  <span className="text-sm font-medium">{level}</span>
                </label>
              ))}
            </div>
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
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-200 rounded-lg"
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
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">獎項設定</h3>
            <div className="space-y-4">
               {/* Prize List Input - Simplified for this restoration */}
               <div className="flex gap-2 mb-4">
                 {availableLevels.map(level => (
                   <button
                     key={level}
                     type="button"
                     onClick={() => handleAddPrize(level)}
                     className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                   >
                     + {level}
                   </button>
                 ))}
               </div>
               
               {prizes.map((prize, index) => (
                 <div key={prize.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                   <div className="w-20 pt-2 font-bold text-lg text-center">{prize.level}</div>
                   <div className="flex-1 grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">名稱</label>
                       <input 
                         type="text" 
                         value={prize.name} 
                         onChange={e => handlePrizeChange(index, 'name', e.target.value)}
                         className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                         placeholder="獎項名稱"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">數量</label>
                       <input 
                         type="number" 
                         value={prize.total} 
                         onChange={e => handlePrizeChange(index, 'total', parseInt(e.target.value) || 0)}
                         className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                         min="1"
                       />
                     </div>
                   </div>
                   <button
                     type="button"
                     onClick={() => handleRemovePrize(index)}
                     className="text-red-500 hover:text-red-700 p-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:border-neutral-300 font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
              }`}
            >
              {isSubmitting ? '處理中...' : '確認新增'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
