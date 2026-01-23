'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

interface OrderDetail {
  id: string
  orderNumber: string
  productName: string
  prizeName: string
  image: string
  price: number
  status: 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
  orderDate: string
  paymentDate?: string
  paymentMethod?: string
  shippingDate?: string
  deliveryDate?: string
  trackingNumber?: string
  deliveryAddress: string
  recipientName: string
  recipientPhone: string
}

// 模擬訂單詳情資料
const orderDetails: { [key: string]: OrderDetail } = {
  '1': {
    id: '1',
    orderNumber: 'ORD-20240115-001',
    productName: '鬼滅之刃 無限列車篇 一番賞',
    prizeName: 'A賞 - 炭治郎 手辦',
    image: '/item.png',
    price: 350,
    status: 'paid',
    orderDate: '2024-01-15 14:30',
    paymentDate: '2024-01-15 14:35',
    paymentMethod: '信用卡',
    deliveryAddress: '台北市信義區信義路五段7號',
    recipientName: '王小明',
    recipientPhone: '0912-345-678',
  },
  '2': {
    id: '2',
    orderNumber: 'ORD-20240110-002',
    productName: '咒術迴戰 第二季 一番賞',
    prizeName: 'B賞 - 五條悟 立牌',
    image: '/item.png',
    price: 380,
    status: 'shipping',
    orderDate: '2024-01-10 16:45',
    paymentDate: '2024-01-10 16:50',
    paymentMethod: 'ATM 轉帳',
    shippingDate: '2024-01-12 10:00',
    trackingNumber: 'SF1234567890',
    deliveryAddress: '台北市信義區信義路五段7號',
    recipientName: '王小明',
    recipientPhone: '0912-345-678',
  },
  '3': {
    id: '3',
    orderNumber: 'ORD-20240105-003',
    productName: '進擊的巨人 最終章 一番賞',
    prizeName: 'C賞 - 艾連 鑰匙圈',
    image: '/item.png',
    price: 320,
    status: 'delivered',
    orderDate: '2024-01-05 10:20',
    paymentDate: '2024-01-05 10:25',
    paymentMethod: '超商代碼繳費',
    shippingDate: '2024-01-07 09:00',
    deliveryDate: '2024-01-10 14:00',
    trackingNumber: 'SF0987654321',
    deliveryAddress: '台北市信義區信義路五段7號',
    recipientName: '王小明',
    recipientPhone: '0912-345-678',
  },
}

export default function OrderDetailPage({ params }: PageProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const order = orderDetails[params.id]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">訂單不存在</h1>
          <Link href="/history" className="text-primary hover:text-primary-dark">
            返回歷史紀錄
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: OrderDetail['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      case 'shipping':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getStatusText = (status: OrderDetail['status']) => {
    switch (status) {
      case 'pending':
        return '待付款'
      case 'paid':
        return '已付款'
      case 'shipping':
        return '配送中'
      case 'delivered':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題和返回按鈕 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">訂單詳情</h1>
            <p className="text-neutral-600">訂單編號：{order.orderNumber}</p>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回歷史紀錄
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：主要資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 訂單狀態 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900">訂單狀態</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">訂單日期</span>
                  <span className="text-neutral-900 font-medium">{order.orderDate}</span>
                </div>
                {order.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">付款日期</span>
                    <span className="text-neutral-900 font-medium">{order.paymentDate}</span>
                  </div>
                )}
                {order.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">付款方式</span>
                    <span className="text-neutral-900 font-medium">{order.paymentMethod}</span>
                  </div>
                )}
                {order.shippingDate && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">出貨日期</span>
                    <span className="text-neutral-900 font-medium">{order.shippingDate}</span>
                  </div>
                )}
                {order.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">到貨日期</span>
                    <span className="text-neutral-900 font-medium">{order.deliveryDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 商品資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">商品資訊</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={order.image}
                    alt={order.prizeName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">{order.productName}</h3>
                  <p className="text-neutral-600 mb-2">{order.prizeName}</p>
                  <p className="text-xl font-bold text-primary">{order.price} 代幣</p>
                </div>
              </div>
            </div>

            {/* 配送資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">配送資訊</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">收件人</p>
                  <p className="text-neutral-900 font-medium">{order.recipientName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">聯絡電話</p>
                  <p className="text-neutral-900 font-medium">{order.recipientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">配送地址</p>
                  <p className="text-neutral-900 font-medium">{order.deliveryAddress}</p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">追蹤號碼</p>
                    <div className="flex items-center gap-2">
                      <p className="text-neutral-900 font-mono font-medium">{order.trackingNumber}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.trackingNumber!)
                          // 可以加入提示
                        }}
                        className="text-primary hover:text-primary-dark transition-colors"
                        title="複製"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">訂單摘要</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-neutral-600">
                  <span>商品金額</span>
                  <span>{order.price} 代幣</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>運費</span>
                  <span className="text-green-600">免費</span>
                </div>
                <hr className="border-neutral-200" />
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-neutral-900">總計</span>
                  <span className="text-2xl font-bold text-primary">{order.price} 代幣</span>
                </div>
              </div>

              {order.status === 'pending' && (
                <Link
                  href="/payment"
                  className="block w-full py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-center font-medium mb-3"
                >
                  前往付款
                </Link>
              )}

              <button
                onClick={() => {
                  // 下載發票功能
                  alert('發票下載功能開發中')
                }}
                className="w-full py-2 bg-white text-primary border-2 border-primary rounded-full hover:bg-primary/5 transition-colors text-sm font-medium"
              >
                下載發票
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
