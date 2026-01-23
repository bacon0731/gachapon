'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/ProductCard'

const allProducts = [
  {
    id: '1',
    name: '鬼滅之刃 無限列車篇 一番賞',
    image: '/item.png',
    price: 350,
    description: '經典動畫角色，精美周邊商品',
    remaining: 5,
    isHot: true,
    category: '一番賞',
  },
  {
    id: '2',
    name: '咒術迴戰 第二季 一番賞',
    image: '/item.png',
    price: 380,
    description: '最新動畫系列，限量發售',
    remaining: 12,
    isHot: true,
    category: '一番賞',
  },
  {
    id: '3',
    name: '進擊的巨人 最終章 一番賞',
    image: '/item.png',
    price: 320,
    description: '史詩級完結篇紀念商品',
    remaining: 8,
    isHot: false,
    category: '一番賞',
  },
  {
    id: '4',
    name: '我的英雄學院 一番賞',
    image: '/item.png',
    price: 360,
    description: '超人氣動畫角色周邊',
    remaining: 15,
    isHot: false,
    category: '一番賞',
  },
  {
    id: '5',
    name: 'SPY×FAMILY 間諜家家酒 一番賞',
    image: '/item.png',
    price: 340,
    description: '溫馨家庭喜劇角色商品',
    remaining: 20,
    isHot: true,
    category: '一番賞',
  },
  {
    id: '6',
    name: '鏈鋸人 轉蛋系列',
    image: '/item.png',
    price: 370,
    description: '黑暗奇幻風格角色周邊',
    remaining: 10,
    isHot: false,
    category: '轉蛋',
  },
  {
    id: '7',
    name: '航海王 和之國篇 轉蛋',
    image: '/item.png',
    price: 390,
    description: '經典長篇動畫最新篇章',
    remaining: 7,
    isHot: true,
    category: '轉蛋',
  },
  {
    id: '8',
    name: '火影忍者 疾風傳 盒玩',
    image: '/item.png',
    price: 330,
    description: '經典忍者動畫紀念商品',
    remaining: 18,
    isHot: false,
    category: '盒玩',
  },
  {
    id: '9',
    name: '七龍珠超 限定商品',
    image: '/item.png',
    price: 400,
    description: '傳奇動畫系列最新商品',
    remaining: 6,
    isHot: true,
    category: '限定商品',
  },
]

const categories = [
  { name: '全部', icon: '📋' },
  { name: '一番賞', icon: '🎁' },
  { name: '轉蛋', icon: '🎰' },
  { name: '盒玩', icon: '📦' },
  { name: '限定商品', icon: '⭐' },
]

export default function ShopPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sortBy, setSortBy] = useState('newest')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // 從 URL 參數讀取搜尋關鍵字和分類
  useEffect(() => {
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    if (search) {
      setSearchQuery(search)
    }
    if (category) {
      setSelectedCategory(category)
      setFilter('all') // 選擇分類時重置篩選
    }
  }, [searchParams])

  // 處理分類切換
  const handleCategoryChange = (category: string) => {
    if (category === '全部') {
      // 選擇全部，清除分類
      setSelectedCategory(null)
      router.push('/shop')
    } else if (selectedCategory === category) {
      // 如果點擊已選中的分類，則清除分類
      setSelectedCategory(null)
      router.push('/shop')
    } else {
      // 選擇新分類
      setSelectedCategory(category)
      setFilter('all')
      router.push(`/shop?category=${encodeURIComponent(category)}`)
    }
  }

  const sortedProducts = [...allProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'hot':
        return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0)
      default:
        return 0
    }
  })

  // 分類篩選
  let filteredProducts = sortedProducts
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter((p: any) => p.category === selectedCategory)
  }

  // 熱賣篩選
  if (filter === 'hot') {
    filteredProducts = filteredProducts.filter((p) => p.isHot)
  }
  
  // 如果有搜尋關鍵字，進行搜尋
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 標題和搜尋框結合區塊 */}
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border border-pink-100/50 shadow-sm">
          {/* 背景裝飾圖案 - 柔和的圓形 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-blue-200/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          </div>
          
          {/* 細緻的幾何圖案裝飾 */}
          <div className="absolute top-4 right-4 w-16 h-16 border border-pink-200/40 rounded-lg rotate-12 opacity-60"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 border border-blue-200/40 rounded-full opacity-60"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 border border-purple-200/40 rounded-lg rotate-45 opacity-50"></div>
          
          {/* 微妙的點狀裝飾 */}
          <div className="absolute top-8 left-1/4 w-2 h-2 bg-pink-300/40 rounded-full"></div>
          <div className="absolute bottom-12 right-1/3 w-1.5 h-1.5 bg-blue-300/40 rounded-full"></div>
          <div className="absolute top-1/2 right-8 w-1 h-1 bg-purple-300/40 rounded-full"></div>
          
          {/* 內容 */}
          <div className="relative z-10 p-6 md:p-8">
            {/* 標題 */}
            <div className="text-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-1">
                找找你的商品？
              </h1>
              <p className="text-neutral-600 text-sm md:text-base">
                探索豐富的一番賞商品，找到你最喜歡的角色周邊
              </p>
            </div>

            {/* 搜尋框 */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
              className="max-w-2xl mx-auto mb-4"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center">
                    <div className="absolute left-4 text-neutral-400 group-hover:text-primary transition-colors duration-200 z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋商品名稱或描述..."
                      className="w-full px-4 py-3 pl-12 pr-12 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-sm placeholder:text-neutral-400 hover:bg-white hover:border-neutral-300 shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                        aria-label="清除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* 分類切換按鈕 */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => {
                const isSelected = category.name === '全部' 
                  ? !selectedCategory 
                  : selectedCategory === category.name
                
                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.name)}
                    className={`px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-sm ${
                      isSelected
                        ? 'bg-white text-primary shadow-sm scale-105 border border-primary/20'
                        : 'bg-white/60 backdrop-blur-sm text-neutral-700 hover:bg-white/80 border border-neutral-200/60 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                )
              })}
            </div>

            {/* 搜尋結果提示 */}
            {(searchQuery || selectedCategory) && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-neutral-700 rounded-full text-sm font-medium border border-neutral-200/60 shadow-sm">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  找到 <span className="font-bold text-primary">{filteredProducts.length}</span> 個商品
                  {selectedCategory && (
                    <span className="ml-2 text-neutral-600">（{selectedCategory}）</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFilter('all')
                    if (selectedCategory) {
                      setSelectedCategory(null)
                      router.push('/shop')
                    }
                  }}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilter('hot')}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    filter === 'hot'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  熱賣中
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-neutral-700 font-medium">排序：</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">最新上架</option>
                  <option value="price-low">價格：低到高</option>
                  <option value="price-high">價格：高到低</option>
                  <option value="hot">熱門商品</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-lg">目前沒有符合條件的商品</p>
          </div>
        )}
      </div>
    </div>
  )
}

