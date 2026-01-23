'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Alert from '@/components/Alert'

type PaymentMethod = 'credit' | 'transfer' | 'convenience' | null

interface PaymentItem {
  id: string
  productName: string
  prizeName: string
  image: string
  price: number
  drawDate: string
}

function PaymentContent() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  // 從 URL 參數或 localStorage 獲取需要付款的商品
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // 模擬從 localStorage 或 API 獲取待付款商品
    const pendingItems: PaymentItem[] = [
      {
        id: '1',
        productName: '鬼滅之刃 無限列車篇 一番賞',
        prizeName: 'A賞 - 炭治郎 手辦',
        image: '/item.png',
        price: 350,
        drawDate: '2024-01-15',
      },
    ]
    setPaymentItems(pendingItems)
  }, [isAuthenticated, router])

  const totalAmount = paymentItems.reduce((sum, item) => sum + item.price, 0)

  const handlePayment = async () => {
    if (!paymentMethod) {
      setShowAlert(true)
      return
    }

    setIsProcessing(true)

    // 模擬付款處理
    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)
      // 3秒後跳轉到訂單頁面
      setTimeout(() => {
        router.push('/orders')
      }, 3000)
    }, 2000)
  }

  if (!isAuthenticated) {
    return null
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">付款成功！</h2>
          <p className="text-neutral-600 mb-6">您的訂單已建立，正在跳轉到訂單頁面...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">付款</h1>
          <p className="text-neutral-600">請選擇付款方式並完成付款</p>
        </div>

        <Alert
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
          title="請選擇付款方式"
          message="請先選擇一種付款方式後再進行付款。"
          type="warning"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：商品資訊 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 待付款商品 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">待付款商品</h2>
              <div className="space-y-4">
                {paymentItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.prizeName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 mb-1">{item.productName}</h3>
                      <p className="text-sm text-neutral-600 mb-1">{item.prizeName}</p>
                      <p className="text-xs text-neutral-500">抽獎日期：{item.drawDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{item.price} 代幣</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 付款方式 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">選擇付款方式</h2>
              <div className="space-y-3">
                {/* 信用卡 */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={() => setPaymentMethod('credit')}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-neutral-900">信用卡</p>
                        <p className="text-sm text-neutral-600">Visa、Mastercard、JCB</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Visa</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Master</span>
                      </div>
                    </div>
                  </div>
                </label>

                {/* ATM 轉帳 */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-neutral-900">ATM 轉帳</p>
                        <p className="text-sm text-neutral-600">銀行轉帳付款</p>
                      </div>
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </label>

                {/* 超商代碼 */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    value="convenience"
                    checked={paymentMethod === 'convenience'}
                    onChange={() => setPaymentMethod('convenience')}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-neutral-900">超商代碼繳費</p>
                        <p className="text-sm text-neutral-600">7-11、全家、萊爾富、OK</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">7-11</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">全家</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">訂單摘要</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-neutral-600">
                  <span>商品數量</span>
                  <span>{paymentItems.length} 項</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>小計</span>
                  <span>{totalAmount} 代幣</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>運費</span>
                  <span className="text-green-600">免費</span>
                </div>
                <hr className="border-neutral-200" />
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-neutral-900">總計</span>
                  <span className="text-2xl font-bold text-primary">{totalAmount} 代幣</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || !paymentMethod}
                className={`w-full py-3 rounded-full font-bold text-base transition-all ${
                  isProcessing || !paymentMethod
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    處理中...
                  </span>
                ) : (
                  '確認付款'
                )}
              </button>

              <Link
                href="/warehouse"
                className="block text-center text-sm text-neutral-600 hover:text-primary mt-4 transition-colors"
              >
                返回我的倉庫
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
