'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// 模擬抽中商品資料
const mockWonProducts = [
  {
    id: '1',
    productName: '鬼滅之刃 無限列車篇 一番賞',
    prizeName: 'A賞 - 炭治郎 手辦',
    image: '/item.png',
    drawDate: '2024-01-15',
    status: 'pending', // pending, shipping, delivered
    trackingNumber: null,
    deliveryAddress: '台北市信義區信義路五段7號',
  },
  {
    id: '2',
    productName: '咒術迴戰 第二季 一番賞',
    prizeName: 'B賞 - 五條悟 立牌',
    image: '/item.png',
    drawDate: '2024-01-10',
    status: 'shipping',
    trackingNumber: 'SF1234567890',
    deliveryAddress: '台北市信義區信義路五段7號',
  },
  {
    id: '3',
    productName: '進擊的巨人 最終章 一番賞',
    prizeName: 'C賞 - 艾連 鑰匙圈',
    image: '/item.png',
    drawDate: '2024-01-05',
    status: 'delivered',
    trackingNumber: 'SF0987654321',
    deliveryAddress: '台北市信義區信義路五段7號',
  },
]

export default function WarehousePage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'shipping' | 'delivered'>('all')

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const filteredProducts = selectedTab === 'all' 
    ? mockWonProducts 
    : mockWonProducts.filter(p => p.status === selectedTab)

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待處理'
      case 'shipping':
        return '配送中'
      case 'delivered':
        return '已送達'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipping':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">我的倉庫</h1>
          <p className="text-neutral-600">查看您抽中的商品及配送狀態</p>
        </div>

        {/* 標籤頁 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'all'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-primary'
              }`}
            >
              全部 ({mockWonProducts.length})
            </button>
            <button
              onClick={() => setSelectedTab('pending')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'pending'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-primary'
              }`}
            >
              待處理 ({mockWonProducts.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setSelectedTab('shipping')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'shipping'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-primary'
              }`}
            >
              配送中 ({mockWonProducts.filter(p => p.status === 'shipping').length})
            </button>
            <button
              onClick={() => setSelectedTab('delivered')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'delivered'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-primary'
              }`}
            >
              已送達 ({mockWonProducts.filter(p => p.status === 'delivered').length})
            </button>
          </div>
        </div>

        {/* 商品列表 */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">尚無商品</h3>
            <p className="text-neutral-600 mb-6">您還沒有抽中任何商品</p>
            <Link href="/shop" className="inline-block bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
              前往抽獎
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-start">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="relative w-full aspect-square bg-neutral-100">
                  <Image
                    src={product.image}
                    alt={product.prizeName}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                    {getStatusText(product.status)}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2 min-h-[2.5rem]">{product.productName}</h3>
                  <p className="text-sm text-primary font-medium mb-3 line-clamp-1">{product.prizeName}</p>
                  <div className="space-y-2 text-sm text-neutral-600 mb-4 flex-grow">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      抽中日期：{product.drawDate}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      追蹤號碼：{product.status === 'pending' ? '處理中' : product.trackingNumber || '處理中'}
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="break-words line-clamp-2">配送地址：{product.deliveryAddress}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-auto">
                    {product.status === 'pending' ? (
                      <Link
                        href="/payment"
                        className="flex-1 text-center bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors text-sm font-medium"
                      >
                        前往付款
                      </Link>
                    ) : (
                      <Link
                        href={`/shop/${product.id}`}
                        className="flex-1 text-center bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors text-sm font-medium"
                      >
                        查看商品
                      </Link>
                    )}
                    <button className="flex-1 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors text-sm font-medium">
                      {product.status === 'pending' ? '申請配送' : '追蹤配送'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
