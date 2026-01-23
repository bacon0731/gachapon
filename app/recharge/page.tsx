'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Alert from '@/components/Alert'

type PaymentGateway = 'newebpay' | 'jkopay' | 'omgpay' | null
type InvoiceType = 'personal' | 'company' | 'donation' | null

// 預設充值金額選項
const defaultAmounts = [
  { tokens: 100, price: 100, bonus: 0 },
  { tokens: 500, price: 500, bonus: 0 },
  { tokens: 1000, price: 1000, bonus: 50 },
  { tokens: 2000, price: 2000, bonus: 150 },
  { tokens: 5000, price: 5000, bonus: 500 },
  { tokens: 10000, price: 10000, bonus: 1500 },
]

// 金流廠家選項
const paymentGateways = [
  { id: 'newebpay', name: '藍新金流', icon: '💳' },
  { id: 'jkopay', name: '街口支付', icon: '📱' },
  { id: 'omgpay', name: 'Oh My God 金流', icon: '⚡' },
]

export default function RechargePage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(null)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('personal')
  const [isDonation, setIsDonation] = useState(false)
  const [carrier, setCarrier] = useState<string>('')
  const [companyTaxId, setCompanyTaxId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleAmountSelect = (tokens: number) => {
    setSelectedAmount(tokens)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const getTotalTokens = () => {
    if (selectedAmount) {
      const amount = defaultAmounts.find((a) => a.tokens === selectedAmount)
      return amount ? amount.tokens + amount.bonus : selectedAmount
    }
    if (customAmount) {
      const amount = parseInt(customAmount)
      if (amount >= 1000) {
        return amount + Math.floor(amount / 10) // 10% 贈送
      }
      return amount
    }
    return 0
  }

  const getTotalPrice = () => {
    if (selectedAmount) {
      const amount = defaultAmounts.find((a) => a.tokens === selectedAmount)
      return amount ? amount.price : selectedAmount
    }
    if (customAmount) {
      return parseInt(customAmount) || 0
    }
    return 0
  }

  const getBonus = () => {
    if (selectedAmount) {
      const amount = defaultAmounts.find((a) => a.tokens === selectedAmount)
      return amount ? amount.bonus : 0
    }
    if (customAmount) {
      const amount = parseInt(customAmount)
      if (amount >= 1000) {
        return Math.floor(amount / 10) // 10% 贈送
      }
      return 0
    }
    return 0
  }

  const handleRecharge = async () => {
    if (!selectedAmount && !customAmount) {
      setAlertMessage('請選擇或輸入充值金額')
      setShowAlert(true)
      return
    }

    const amount = selectedAmount || parseInt(customAmount)
    if (!amount || amount < 100) {
      setAlertMessage('最低充值金額為 100 代幣')
      setShowAlert(true)
      return
    }

    if (amount > 1000000) {
      setAlertMessage('最高充值金額為 100 萬代幣')
      setShowAlert(true)
      return
    }

    if (!paymentGateway) {
      setAlertMessage('請選擇儲值方式')
      setShowAlert(true)
      return
    }

    if (!invoiceType) {
      setAlertMessage('請選擇發票類型')
      setShowAlert(true)
      return
    }

    if (invoiceType === 'company' && !companyTaxId) {
      setAlertMessage('請輸入統一編號')
      setShowAlert(true)
      return
    }

    if (invoiceType === 'company' && companyTaxId.length !== 8) {
      setAlertMessage('統一編號需為8位數')
      setShowAlert(true)
      return
    }

    setIsProcessing(true)

    // 準備充值資料
    const rechargeData = {
      amount: getTotalPrice(),
      tokens: getTotalTokens(),
      bonus: getBonus(),
      paymentGateway,
      invoiceType,
      isDonation,
      carrier: invoiceType === 'personal' ? carrier : '',
      companyTaxId: invoiceType === 'company' ? companyTaxId : '',
    }

    // 模擬跳轉到金流廠家
    setTimeout(() => {
      setIsProcessing(false)
      // 這裡應該調用 API 創建訂單並跳轉到金流廠家
      // 模擬：直接跳轉（實際應該跳轉到金流廠家的付款頁面）
      console.log('跳轉到金流廠家:', rechargeData)
      // router.push(`/payment/${paymentGateway}?orderId=xxx`)
      
      // 暫時顯示成功訊息
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }, 1000)
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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">充值成功！</h2>
          <p className="text-neutral-600 mb-4">
            已成功充值 <span className="font-bold text-primary">{getTotalTokens().toLocaleString()}</span> 代幣
          </p>
          {getBonus() > 0 && (
            <p className="text-sm text-green-600 mb-4">
              包含贈送 <span className="font-bold">{getBonus().toLocaleString()}</span> 代幣
            </p>
          )}
          <p className="text-sm text-neutral-500 mb-6">正在返回首頁...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">代幣充值</h1>
          <p className="text-neutral-600">選擇充值金額並完成付款</p>
        </div>

        <Alert
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
          title="提示"
          message={alertMessage}
          type="warning"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左側：充值選項 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 當前餘額 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-600 mb-1">當前代幣餘額</p>
                  <p className="text-3xl font-bold text-primary whitespace-nowrap break-all">{user?.tokens?.toLocaleString() || 0} 代幣</p>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 選擇充值金額 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">選擇充值金額</h2>
              
              {/* 預設金額選項 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {defaultAmounts.map((amount) => (
                  <button
                    key={amount.tokens}
                    onClick={() => handleAmountSelect(amount.tokens)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAmount === amount.tokens
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-primary/50 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-lg font-bold text-neutral-900 whitespace-nowrap break-all">{amount.tokens.toLocaleString()}</span>
                      {amount.bonus > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                          贈 {amount.bonus.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 whitespace-nowrap break-all">NT$ {amount.price.toLocaleString()}</p>
                  </button>
                ))}
              </div>

              {/* 自訂金額 */}
              <div className="border-t border-neutral-200 pt-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">或輸入自訂金額</label>
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="最低 100 代幣"
                    min="100"
                    max="1000000"
                    className="w-full px-4 pr-16 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ 
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 whitespace-nowrap pointer-events-none">
                    代幣
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  最高金額為 100 萬代幣
                </p>
                {parseInt(customAmount) >= 1000 && parseInt(customAmount) <= 1000000 && (
                  <p className="mt-2 text-sm text-green-600">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    充值 1000 代幣以上可獲得 10% 贈送
                  </p>
                )}
              </div>
            </div>

            {/* 儲值方式 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">儲值方式</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {paymentGateways.map((gateway) => (
                  <label
                    key={gateway.id}
                    className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentGateway === gateway.id
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-primary/50 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentGateway"
                      value={gateway.id}
                      checked={paymentGateway === gateway.id}
                      onChange={() => setPaymentGateway(gateway.id as PaymentGateway)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">{gateway.icon}</div>
                      <p className="font-semibold text-neutral-900">{gateway.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 發票類型 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">發票類型</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="personal"
                    checked={invoiceType === 'personal'}
                    onChange={() => {
                      setInvoiceType('personal')
                      setIsDonation(false)
                    }}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-neutral-900">個人電子發票</p>
                    <p className="text-sm text-neutral-600">發票將寄送至您的電子信箱</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="company"
                    checked={invoiceType === 'company'}
                    onChange={() => {
                      setInvoiceType('company')
                      setIsDonation(false)
                    }}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-neutral-900">公司統編發票</p>
                    <p className="text-sm text-neutral-600">需填寫統一編號</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="donation"
                    checked={invoiceType === 'donation'}
                    onChange={() => {
                      setInvoiceType('donation')
                      setIsDonation(true)
                    }}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-neutral-900">捐贈發票</p>
                    <p className="text-sm text-neutral-600">將發票捐贈給指定單位</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 是否捐贈 */}
            {invoiceType === 'donation' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">是否捐贈</h2>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isDonation}
                      onChange={(e) => setIsDonation(e.target.checked)}
                      className="w-5 h-5 text-primary focus:ring-primary rounded"
                    />
                    <span className="ml-3 text-neutral-700">確認將發票捐贈給指定單位</span>
                  </label>
                </div>
              </div>
            )}

            {/* 選擇載具 */}
            {invoiceType === 'personal' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">選擇載具</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      載具條碼（選填）
                    </label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="請輸入載具條碼"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      可選擇手機條碼、悠遊卡、一卡通等載具
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 公司統編 */}
            {invoiceType === 'company' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">統一編號</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      統一編號 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyTaxId}
                      onChange={(e) => setCompanyTaxId(e.target.value)}
                      placeholder="請輸入統一編號（8碼）"
                      maxLength={8}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      請輸入8位數統一編號
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右側：訂單摘要 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 min-w-[320px]">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">充值摘要</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center gap-3 text-neutral-600">
                  <span className="flex-shrink-0">充值金額</span>
                  <span className="text-right whitespace-nowrap break-all">{getTotalPrice() > 0 ? `${getTotalPrice().toLocaleString()} 代幣` : '-'}</span>
                </div>
                {getBonus() > 0 && (
                  <div className="flex justify-between items-center gap-3 text-green-600">
                    <span className="flex-shrink-0">贈送代幣</span>
                    <span className="font-semibold text-right whitespace-nowrap break-all">+{getBonus().toLocaleString()} 代幣</span>
                  </div>
                )}
                <hr className="border-neutral-200" />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-lg font-bold text-neutral-900 flex-shrink-0">總計獲得</span>
                  <span className="text-2xl font-bold text-primary text-right whitespace-nowrap break-all">
                    {getTotalTokens() > 0 ? `${getTotalTokens().toLocaleString()} 代幣` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-sm text-neutral-600">
                  <span className="flex-shrink-0">需支付</span>
                  <span className="font-medium text-right whitespace-nowrap break-all">NT$ {getTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleRecharge}
                disabled={isProcessing || getTotalTokens() === 0 || !paymentGateway || !invoiceType}
                className={`w-full py-3 rounded-full font-bold text-base transition-all ${
                  isProcessing || getTotalTokens() === 0 || !paymentGateway || !invoiceType
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
                  '確認充值'
                )}
              </button>

              <Link
                href="/"
                className="block text-center text-sm text-neutral-600 hover:text-primary mt-4 transition-colors"
              >
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
