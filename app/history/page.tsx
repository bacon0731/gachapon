'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPrizeLevelColor } from '@/utils/prizeColors'

// 模擬歷史紀錄（所有抽獎都會有獎項）
const mockHistory = [
  {
    id: '1',
    productName: '鬼滅之刃 無限列車篇 一番賞',
    prizeName: 'A賞 - 炭治郎 手辦',
    prizeLevel: 'A賞',
    image: '/item.png',
    drawDate: '2024-01-15 14:30',
    price: 350,
  },
  {
    id: '2',
    productName: '咒術迴戰 第二季 一番賞',
    prizeName: 'B賞 - 五條悟 立牌',
    prizeLevel: 'B賞',
    image: '/item.png',
    drawDate: '2024-01-10 16:45',
    price: 380,
  },
  {
    id: '3',
    productName: '進擊的巨人 最終章 一番賞',
    prizeName: 'D賞 - 艾連 鑰匙圈',
    prizeLevel: 'D賞',
    image: '/item.png',
    drawDate: '2024-01-05 10:20',
    price: 320,
  },
  {
    id: '4',
    productName: '我的英雄學院 一番賞',
    prizeName: 'C賞 - 綠谷出久 鑰匙圈',
    prizeLevel: 'C賞',
    image: '/item.png',
    drawDate: '2024-01-03 09:15',
    price: 360,
  },
  {
    id: '5',
    productName: 'SPY×FAMILY 間諜家家酒 一番賞',
    prizeName: '最後賞 - 安妮亞 貼紙組',
    prizeLevel: '最後賞',
    image: '/item.png',
    drawDate: '2024-01-01 15:00',
    price: 340,
  },
]

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month' | 'threeMonths'>('all')

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const filteredHistory = mockHistory.filter((item) => {
    if (selectedPeriod === 'all') {
      return true
    }

    // 將 drawDate 轉換為 Date 對象（格式：'2024-01-15 14:30'）
    const itemDate = new Date(item.drawDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (selectedPeriod) {
      case 'week':
        return daysDiff <= 7
      case 'month':
        return daysDiff <= 30
      case 'threeMonths':
        return daysDiff <= 90
      default:
        return true
    }
  })

  const totalSpent = mockHistory.reduce((sum, item) => sum + item.price, 0)
  const aPrizeCount = mockHistory.filter((item) => item.prizeLevel?.startsWith('A')).length

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">抽獎紀錄</h1>
          <p className="text-neutral-600">查看您的抽獎歷史</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">總抽獎次數</p>
                <p className="text-2xl font-bold text-neutral-900">{mockHistory.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">A賞次數</p>
                <p className="text-2xl font-bold text-primary">{aPrizeCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">總消費金額</p>
                <p className="text-2xl font-bold text-neutral-900">{totalSpent.toLocaleString()} 代幣</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 過濾器 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-neutral-700">時間：</span>
              <div className="relative inline-block">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'week' | 'month' | 'threeMonths')}
                  className="pl-4 pr-10 py-2 border border-neutral-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="all">全部</option>
                  <option value="week">最近一週</option>
                  <option value="month">最近一個月</option>
                  <option value="threeMonths">最近三個月</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 歷史紀錄列表 */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">尚無紀錄</h3>
            <p className="text-neutral-600 mb-6">您還沒有任何抽獎紀錄</p>
            <Link href="/shop" className="inline-block bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
              前往抽獎
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-200">
              {filteredHistory.map((item) => (
                <div key={item.id} className="p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 mb-1">{item.productName}</h3>
                          <p className="text-sm font-medium mb-2 text-primary">
                            {item.prizeName}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-neutral-600">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {item.drawDate}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {item.price} 代幣
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {item.prizeLevel && (() => {
                            const colors = getPrizeLevelColor(item.prizeLevel)
                            return (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                {item.prizeLevel}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/shop/${item.id}`}
                        className="text-primary hover:text-primary-dark font-medium text-sm"
                      >
                        查看商品 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
