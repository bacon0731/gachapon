'use client'

import { AdminLayout, StatsCard, PageCard, SearchToolbar, FilterTags, SortableTableHeader } from '@/components'
import { useAlert } from '@/components/ui/AlertDialog'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/utils/dateFormat'
import { normalizePrizeLevels } from '@/utils/normalizePrizes'
import { getProductPrizeStats, calculateTotalSalesFromDraws } from '@/utils/productStats'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { useRouter } from 'next/navigation'

// Extended Product type to include prizes and local properties
type DbProduct = Database['public']['Tables']['products']['Row']
type DbPrize = Database['public']['Tables']['prizes']['Row']

interface Product extends DbProduct {
  prizes: (DbPrize & { remaining: number; total: number })[]
  majorPrizes?: string[]
  // Mapped properties for compatibility
  productCode: string
  createdAt: string
  startedAt: string
  endedAt: string
  txidHash?: string
}

export default function ProductsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draws, setDraws] = useState<any[]>([]) // Cache draws for stats calculation
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch products with prizes
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            prizes (*)
          `)
          .order('created_at', { ascending: false })

        if (productsError) throw productsError

        // Fetch draw history (lightweight, just needed fields)
        // In a real app with millions of rows, we should use count(*) grouped by product/prize
        // For now, fetching all to calculate local stats as requested "restore"
        const { data: drawsData, error: drawsError } = await supabase
          .from('draw_history')
          .select('id, product_id, prize_id, prizes(grade)')
        
        if (drawsError) throw drawsError
        
        setDraws(drawsData || [])

        // Process products to include remaining counts
        const processedProducts: Product[] = (productsData || []).map((p: any) => {
          // Calculate remaining for each prize
          const productDraws = (drawsData || []).filter((d: any) => d.product_id === p.id)
          
          const prizesWithStats = (p.prizes || []).map((prize: any) => {
            const drawnCount = productDraws.filter((d: any) => d.prize_id === prize.id).length
            return {
              ...prize,
              total: prize.quantity,
              remaining: Math.max(0, prize.quantity - drawnCount)
            }
          })

          // Normalize prize levels
          const normalizedPrizes = normalizePrizeLevels(prizesWithStats)

          return {
            ...p,
            prizes: normalizedPrizes,
            productCode: p.product_code || '',
            createdAt: p.created_at,
            startedAt: p.release_date || p.created_at, // Map release_date to startedAt
            endedAt: p.status === 'ended' ? p.updated_at : undefined, // Approximation
            majorPrizes: ['A賞', 'Last One'] // Default major prizes
          }
        })

        setProducts(processedProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [tableDensity, setTableDensity] = useState<'normal' | 'compact' | 'comfortable'>('normal')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedLowStock, setSelectedLowStock] = useState(false)
  const [selectedHot, setSelectedHot] = useState(false)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [displayCount, setDisplayCount] = useState(20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const observerTarget = useRef<HTMLDivElement>(null)
  
  // Column management
  const [columns, setColumns] = useState([
    { key: 'productCode', label: '編號', visible: true },
    { key: 'name', label: '商品名稱', visible: true },
    { key: 'category', label: '分類', visible: true },
    { key: 'price', label: '價格', visible: true },
    { key: 'stockAndSales', label: '庫存/銷量', visible: true },
    { key: 'majorStatus', label: '大獎狀態', visible: true },
    { key: 'visibility', label: '上架', visible: true },
    { key: 'createdAt', label: '建立時間', visible: true },
    { key: 'operations', label: '操作', visible: true }
  ])

  const handleColumnToggle = (key: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible } : col
    ))
  }

  // Helper to get visible columns object for table
  const visibleColumns = useMemo(() => {
    return columns.reduce((acc, col) => ({
      ...acc,
      [col.key]: col.visible
    }), {} as Record<string, boolean>)
  }, [columns])
  
  // 廢套篩選
  const [selectedMajorStatus, setSelectedMajorStatus] = useState<'all' | 'normal' | 'depleted'>('all')
  
  // 判斷商品是否為廢套（大獎已抽出）
  const isMajorDepleted = (product: Product): boolean => {
    const majorPrizes = product.majorPrizes || ['A賞', 'Last One']
    const majorRemaining = product.prizes
      .filter(prize => majorPrizes.includes(prize.grade))
      .reduce((sum, prize) => sum + prize.remaining, 0)
    return majorRemaining === 0
  }
  
  // Product visibility from localStorage (Frontend only preference for now, or map to DB status?)
  // Backup used localStorage, so we keep it for now.
  const [productVisibility, setProductVisibility] = useState<{ [key: number]: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productVisibility')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved product visibility:', e)
        }
      }
    }
    return {}
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('productVisibility', JSON.stringify(productVisibility))
    }
  }, [productVisibility])

  // Toggle visibility
  const toggleProductVisibility = (id: number) => {
    setProductVisibility(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Filter and Sort
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
      
      // Stock check
      const totalRemaining = product.remaining_count // Use DB column
      const totalCount = product.total_count
      const isLowStock = totalRemaining / totalCount < 0.2
      const matchesLowStock = !selectedLowStock || isLowStock
      
      const matchesHot = !selectedHot || product.is_hot

      // Major status check
      const isDepleted = isMajorDepleted(product)
      const matchesMajorStatus = selectedMajorStatus === 'all' || 
        (selectedMajorStatus === 'depleted' ? isDepleted : !isDepleted)

      return matchesSearch && matchesCategory && matchesStatus && matchesLowStock && matchesHot && matchesMajorStatus
    }).sort((a, b) => {
      // Sort logic
      const aValue = a[sortField as keyof Product]
      const bValue = b[sortField as keyof Product]
      
      if (aValue === bValue) return 0
      
      const direction = sortDirection === 'asc' ? 1 : -1
      return (aValue! > bValue!) ? direction : -direction
    })
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedLowStock, selectedHot, selectedMajorStatus, sortField, sortDirection])

  // Pagination (Infinite Scroll)
  const displayedProducts = filteredProducts.slice(0, displayCount)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayCount < filteredProducts.length) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setDisplayCount(prev => prev + 20)
            setIsLoadingMore(false)
          }, 500)
        }
      },
      { threshold: 0.5 }
    )
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }
    
    return () => observer.disconnect()
  }, [filteredProducts.length, displayCount, isLoadingMore])

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['編號', '商品名稱', '分類', '價格(TWD)', '庫存/銷量', '大獎狀態', '上架', '建立時間', '開賣時間', '完抽時間']
    const csvData = displayedProducts.map(product => {
      const stats = getProductPrizeStats(product, draws)
      const calculatedRemaining = Object.values(stats).reduce((sum, s) => sum + s.remaining, 0)
      const totalCount = Object.values(stats).reduce((sum, s) => sum + s.total, 0)
      const calculatedSales = calculateTotalSalesFromDraws(product.id, draws)
      const stockAndSales = `庫存：${calculatedRemaining}/${totalCount} 銷量：${calculatedSales}`
      const majorStatus = isMajorDepleted(product) ? '廢套' : '正常'
      return [
        product.productCode,
        product.name,
        product.category,
        product.price.toString(),
        stockAndSales,
        majorStatus,
        productVisibility[product.id] ? '是' : '否', // Logic inverted in backup? Backup says "是" if visibility[id] is true
        formatDateTime(product.createdAt),
        formatDateTime(product.startedAt),
        formatDateTime(product.endedAt)
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `商品管理_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Modals
  const { showAlert } = useAlert()

  const handleDeleteProduct = (id: number) => {
    showAlert({
      title: '刪除商品',
      message: '確定要刪除此商品嗎？此操作無法復原。',
      type: 'confirm',
      variant: 'danger',
      confirmText: '刪除',
      cancelText: '取消',
      onConfirm: async () => {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) {
          showAlert({ title: '錯誤', message: '刪除失敗：' + error.message, type: 'error' })
        } else {
          setProducts(prev => prev.filter(p => p.id !== id))
          showAlert({ title: '成功', message: '商品已刪除', type: 'success' })
        }
      }
    })
  }

  // Render
  return (
    <AdminLayout pageTitle="商品管理">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="總商品數"
            value={products.length}
            icon={
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          {/* Add more stats cards as needed */}
        </div>

        <PageCard>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">商品列表</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200 font-amount">
                  {filteredProducts.length.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  匯出 CSV
                </button>
                <Link
                  href="/products/new"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增商品
                </Link>
              </div>
            </div>

              <SearchToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                density={tableDensity}
                onDensityChange={setTableDensity}
                columns={columns}
                onColumnToggle={handleColumnToggle}
                showFilter={true}
                filterOptions={[
                  {
                    key: 'category',
                    label: '分類',
                    type: 'select',
                    value: selectedCategory,
                    options: [
                      { value: 'all', label: '全部分類' },
                      { value: '一番賞', label: '一番賞' },
                      { value: '線上抽', label: '線上抽' },
                      { value: '其他', label: '其他' }
                    ],
                    onChange: setSelectedCategory
                  },
                  {
                    key: 'status',
                    label: '狀態',
                    type: 'select',
                    value: selectedStatus,
                    options: [
                      { value: 'all', label: '全部狀態' },
                      { value: 'active', label: '上架中' },
                      { value: 'pending', label: '未上架' },
                      { value: 'ended', label: '已完售' }
                    ],
                    onChange: setSelectedStatus
                  },
                  {
                    key: 'majorStatus',
                    label: '套況',
                    type: 'select',
                    value: selectedMajorStatus,
                    options: [
                      { value: 'all', label: '全部套況' },
                      { value: 'normal', label: '正常' },
                      { value: 'depleted', label: '廢套' }
                    ],
                    onChange: setSelectedMajorStatus
                  }
                ]}
              >
              </SearchToolbar>

              <FilterTags
                tags={[
                  selectedCategory !== 'all' ? { key: 'category', label: '分類', value: selectedCategory, onRemove: () => setSelectedCategory('all') } : null,
                  selectedStatus !== 'all' ? { key: 'status', label: '狀態', value: selectedStatus, onRemove: () => setSelectedStatus('all') } : null,
                  selectedLowStock ? { key: 'lowStock', label: '庫存', value: '低庫存', onRemove: () => setSelectedLowStock(false) } : null,
                  selectedHot ? { key: 'hot', label: '標籤', value: '熱門', onRemove: () => setSelectedHot(false) } : null,
                  selectedMajorStatus !== 'all' ? { key: 'major', label: '套況', value: selectedMajorStatus === 'normal' ? '正常' : '廢套', onRemove: () => setSelectedMajorStatus('all') } : null,
                ].filter(Boolean) as any}
                onClearAll={() => {
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                  setSelectedLowStock(false)
                  setSelectedHot(false)
                  setSelectedMajorStatus('all')
                  setSearchQuery('')
                }}
              />

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-neutral-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    {columns.filter(col => col.visible).map(col => (
                      <SortableTableHeader
                        key={col.key}
                        sortKey={col.key}
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field) => {
                          if (['stockAndSales', 'majorStatus', 'visibility', 'operations'].includes(field)) return
                          
                          if (sortField === field) {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField(field)
                            setSortDirection('desc')
                          }
                        }}
                      >
                        {col.label}
                      </SortableTableHeader>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-900 dark:divide-neutral-800">
                  {loading ? (
                    <tr><td colSpan={10} className="p-4 text-center dark:text-neutral-400">載入中...</td></tr>
                  ) : displayedProducts.length === 0 ? (
                    <tr><td colSpan={10} className="p-4 text-center dark:text-neutral-400">沒有找到商品</td></tr>
                  ) : (
                    displayedProducts.map((product) => {
                      const stats = getProductPrizeStats(product, draws)
                      const calculatedRemaining = Object.values(stats).reduce((sum, s) => sum + s.remaining, 0)
                      const totalCount = Object.values(stats).reduce((sum, s) => sum + s.total, 0)
                      const calculatedSales = calculateTotalSalesFromDraws(product.id, draws)
                      const isDepleted = isMajorDepleted(product)

                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                          {visibleColumns.productCode && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black font-amount text-gray-900 dark:text-white">
                              {product.productCode}
                            </td>
                          )}
                          {visibleColumns.name && (
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-neutral-400">
                              <div className="flex items-center">
                                {product.image_url && (
                                  <img src={product.image_url} alt="" className="h-8 w-8 rounded mr-2 object-cover" />
                                )}
                                <span className="truncate max-w-xs" title={product.name}>{product.name}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.category && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                              {product.category}
                            </td>
                          )}
                          {visibleColumns.price && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400 font-amount">
                              NT$ {product.price.toLocaleString()}
                            </td>
                          )}
                          {visibleColumns.stockAndSales && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                              <div className="flex flex-col">
                                <span className="font-amount">庫存: {calculatedRemaining.toLocaleString()}/{totalCount.toLocaleString()}</span>
                                <span className="text-xs text-gray-400 dark:text-neutral-500 font-amount">銷量: {calculatedSales.toLocaleString()}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.majorStatus && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isDepleted ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {isDepleted ? '廢套' : '正常'}
                              </span>
                            </td>
                          )}
                          {visibleColumns.visibility && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                              <button
                                onClick={() => toggleProductVisibility(product.id)}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                  productVisibility[product.id] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-700'
                                }`}
                              >
                                <span className="sr-only">Use setting</span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                    productVisibility[product.id] ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                          )}
                          {visibleColumns.createdAt && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400 font-amount">
                              {formatDateTime(product.createdAt)}
                            </td>
                          )}
                          {visibleColumns.operations && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/products/${product.id}/verify`}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-md"
                                >
                                  驗證
                                </Link>
                                <Link
                                  href={`/products/${product.id}`}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-md"
                                >
                                  編輯
                                </Link>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-md"
                                >
                                  刪除
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More Trigger */}
            {filteredProducts.length > displayedProducts.length && (
              <div ref={observerTarget} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </PageCard>
      </div>

      {/* Confirm Dialog */}
    </AdminLayout>
  )
}
