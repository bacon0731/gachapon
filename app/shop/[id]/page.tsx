'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Alert from '@/components/Alert'
import ConfirmDrawDialog from '@/components/ConfirmDrawDialog'
import LotteryTicketsDialog from '@/components/LotteryTicketsDialog'
import DrawResultDialog from '@/components/DrawResultDialog'
import PrizeStatusList from '@/components/PrizeStatusList'
import ProvablyFairSection from '@/components/ProvablyFairSection'
import ProductCard from '@/components/ProductCard'

// 模擬商品資料
const productData: { [key: string]: any } = {
  '1': {
    id: '1',
    name: '鬼滅之刃 無限列車篇 一番賞',
    image: '/item.png',
    price: 350,
    description: '經典動畫《鬼滅之刃》無限列車篇的一番賞系列，包含多款精美角色模型和周邊商品。每抽都有機會獲得A賞、B賞等超值獎品！',
    remaining: 5,
    isHot: true,
    releaseDate: '2024年3月',
    distributor: '萬代南夢宮娛樂',
    rarity: 5,
    prizes: [
      {
        id: 'p1',
        name: '炭治郎 模型 A賞',
        image: '/item.png',
        level: 'A賞',
        remaining: 1,
        total: 3,
        drawn: 2,
        probability: 2,
      },
      {
        id: 'p2',
        name: '禰豆子 模型 B賞',
        image: '/item.png',
        level: 'B賞',
        remaining: 2,
        total: 5,
        drawn: 3,
        probability: 5,
      },
      {
        id: 'p3',
        name: '炎柱 模型 C賞',
        image: '/item.png',
        level: 'C賞',
        remaining: 3,
        total: 8,
        drawn: 5,
        probability: 8,
      },
      {
        id: 'p4',
        name: '角色立牌 D賞',
        image: '/item.png',
        level: 'D賞',
        remaining: 5,
        total: 15,
        drawn: 10,
        probability: 15,
      },
      {
        id: 'p5',
        name: '最後賞 特別版模型',
        image: '/item.png',
        level: '最後賞',
        remaining: 1,
        total: 2,
        drawn: 1,
        probability: 1,
      },
    ],
    txidHash: 'c7111dd84fdbab6ca6bfa34f02fe6e0de92da811039401d1fdfb9a4bd36ab942',
  },
  '2': {
    id: '2',
    name: '咒術迴戰 第二季 一番賞',
    image: '/item.png',
    price: 380,
    description: '最新動畫《咒術迴戰》第二季的一番賞系列，包含虎杖、五條悟等超人氣角色模型和周邊商品。',
    remaining: 12,
    isHot: true,
    releaseDate: '2024年5月',
    distributor: '萬代南夢宮娛樂',
    rarity: 4,
    prizes: [
      {
        id: 'p6',
        name: '五條悟 模型 A賞',
        image: '/item.png',
        level: 'A賞',
        remaining: 2,
        total: 4,
        drawn: 2,
        probability: 2,
      },
      {
        id: 'p7',
        name: '虎杖悠仁 模型 B賞',
        image: '/item.png',
        level: 'B賞',
        remaining: 3,
        total: 6,
        drawn: 3,
        probability: 5,
      },
      {
        id: 'p8',
        name: '伏黑惠 模型 C賞',
        image: '/item.png',
        level: 'C賞',
        remaining: 4,
        total: 10,
        drawn: 6,
        probability: 8,
      },
    ],
    txidHash: 'a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3',
  },
  '3': {
    id: '3',
    name: '進擊的巨人 最終章 一番賞',
    image: '/item.png',
    price: 320,
    description: '史詩級完結篇紀念商品',
    remaining: 8,
    isHot: false,
    releaseDate: '2024年1月',
    distributor: '萬代南夢宮娛樂',
    rarity: 5,
    prizes: [],
    txidHash: 'b9c8d7e6f5g4h3i2j1k0l9m8n7o6p5q4r3s2t1u0v9w8x7y6z5',
  },
  '4': {
    id: '4',
    name: '我的英雄學院 一番賞',
    image: '/item.png',
    price: 360,
    description: '超人氣動畫角色周邊',
    remaining: 15,
    isHot: false,
    releaseDate: '2024年2月',
    distributor: '萬代南夢宮娛樂',
    rarity: 3,
    prizes: [],
    txidHash: 'c0d9e8f7g6h5i4j3k2l1m0n9o8p7q6r5s4t3u2v1w0x9y8z7',
  },
  '5': {
    id: '5',
    name: 'SPY×FAMILY 間諜家家酒 一番賞',
    image: '/item.png',
    price: 340,
    description: '溫馨家庭喜劇角色商品',
    remaining: 20,
    isHot: true,
    releaseDate: '2024年4月',
    distributor: '萬代南夢宮娛樂',
    rarity: 4,
    prizes: [],
    txidHash: 'd1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3w2x1y0z9',
  },
  '6': {
    id: '6',
    name: '鏈鋸人 一番賞',
    image: '/item.png',
    price: 370,
    description: '黑暗奇幻風格角色周邊',
    remaining: 10,
    isHot: false,
    releaseDate: '2024年6月',
    distributor: '萬代南夢宮娛樂',
    rarity: 4,
    prizes: [],
    txidHash: 'e2f1g0h9i8j7k6l5m4n3o2p1q0r9s8t7u6v5w4x3y2z1',
  },
  '7': {
    id: '7',
    name: '航海王 和之國篇 一番賞',
    image: '/item.png',
    price: 390,
    description: '經典長篇動畫最新篇章',
    remaining: 7,
    isHot: true,
    releaseDate: '2023年12月',
    distributor: '萬代南夢宮娛樂',
    rarity: 5,
    prizes: [],
    txidHash: 'f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3',
  },
  '8': {
    id: '8',
    name: '火影忍者 疾風傳 一番賞',
    image: '/item.png',
    price: 330,
    description: '經典忍者動畫紀念商品',
    remaining: 18,
    isHot: false,
    releaseDate: '2023年11月',
    distributor: '萬代南夢宮娛樂',
    rarity: 4,
    prizes: [],
    txidHash: 'g4h3i2j1k0l9m8n7o6p5q4r3s2t1u0v9w8x7y6z5',
  },
  '9': {
    id: '9',
    name: '七龍珠超 一番賞',
    image: '/item.png',
    price: 400,
    description: '傳奇動畫系列最新商品',
    remaining: 6,
    isHot: true,
    releaseDate: '2024年7月',
    distributor: '萬代南夢宮娛樂',
    rarity: 5,
    prizes: [],
    txidHash: 'h5i4j3k2l1m0n9o8p7q6r5s4t3u2v1w0x9y8z7',
  },
  '10': {
    id: '10',
    name: '東京喰種 一番賞',
    image: '/item.png',
    price: 365,
    description: '暗黑系動畫角色周邊',
    remaining: 9,
    isHot: false,
    releaseDate: '2024年3月',
    distributor: '萬代南夢宮娛樂',
    rarity: 3,
    prizes: [],
    txidHash: 'i6j5k4l3m2n1o0p9q8r7s6t5u4v3w2x1y0z9',
  },
  '11': {
    id: '11',
    name: '一拳超人 一番賞',
    image: '/item.png',
    price: 355,
    description: '超人氣搞笑戰鬥動畫',
    remaining: 11,
    isHot: true,
    releaseDate: '2024年4月',
    distributor: '萬代南夢宮娛樂',
    rarity: 4,
    prizes: [],
    txidHash: 'j7k6l5m4n3o2p1q0r9s8t7u6v5w4x3y2z1',
  },
  '12': {
    id: '12',
    name: '進擊的巨人 最終季 一番賞',
    image: '/item.png',
    price: 375,
    description: '史詩級完結篇特別版',
    remaining: 4,
    isHot: true,
    releaseDate: '2024年1月',
    distributor: '萬代南夢宮娛樂',
    rarity: 5,
    prizes: [],
    txidHash: 'k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3',
  },
}

interface PageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: PageProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isDrawing, setIsDrawing] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [showTicketsDialog, setShowTicketsDialog] = useState(false)
  const [drawResults, setDrawResults] = useState<any[]>([])
  const [showMoreProducts, setShowMoreProducts] = useState(10) // 初始顯示10個商品（2行）
  const [showAlert, setShowAlert] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [drawQuantity, setDrawQuantity] = useState(1)
  const product = productData[params.id]

  // 獲取推薦商品列表（排除當前商品）
  const recommendedProducts = Object.values(productData).filter(
    (p: any) => p.id !== product.id
  ) as any[]

  const displayedProducts = recommendedProducts.slice(0, showMoreProducts)
  const hasMore = showMoreProducts < recommendedProducts.length

  const handleLoadMore = () => {
    setShowMoreProducts((prev) => prev + 10) // 每次載入10個（2行）
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">商品不存在</h1>
          <Link href="/shop" className="text-accent hover:text-accent-dark">
            返回商品列表
          </Link>
        </div>
      </div>
    )
  }

  const handleDraw = () => {
    if (isDrawing) return

    // 檢查是否登入
    if (!isAuthenticated) {
      setShowAlert(true)
      return
    }

    // 檢查庫存
    if (product.remaining === 0) {
      return
    }

    // 顯示確認對話框
    setShowConfirmDialog(true)
  }

  const handleConfirmDraw = (quantity: number) => {
    setShowConfirmDialog(false)
    setDrawQuantity(quantity)
    setShowTicketsDialog(true)
  }

  const handleTicketsComplete = (results: any[]) => {
    setDrawResults(results)
    setShowTicketsDialog(false)
    setShowResultDialog(true)
    
    // 更新庫存（模擬）
    // 實際應該調用 API
  }

  const handleCloseResult = () => {
    setShowResultDialog(false)
    setDrawResults([])
  }

  const handleAlertConfirm = () => {
    router.push('/login')
  }

  return (
    <>
      {/* Alert 提示 */}
      <Alert
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="需要登入"
        message="請先登入帳號才能進行抽獎，登入後即可享受抽獎樂趣！"
        type="warning"
        confirmText="前往登入"
        onConfirm={handleAlertConfirm}
      />

      {/* 確認抽獎對話框 */}
      <ConfirmDrawDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDraw}
        price={product.price}
        remaining={product.remaining}
      />

      {/* 抽獎券彈窗 */}
      <LotteryTicketsDialog
        isOpen={showTicketsDialog}
        onClose={() => setShowTicketsDialog(false)}
        quantity={drawQuantity}
        prizes={product.prizes}
        onComplete={handleTicketsComplete}
      />

      {/* 抽獎結果彈窗 */}
      <DrawResultDialog
        isOpen={showResultDialog}
        onClose={handleCloseResult}
        results={drawResults}
      />

      <div className="min-h-screen bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb */}
        <nav className="mb-3 text-sm">
          <Link href="/" className="text-neutral-500 hover:text-primary">
            首頁
          </Link>
          <span className="mx-2 text-neutral-400">/</span>
          <Link href="/shop" className="text-neutral-500 hover:text-primary">
            商品列表
          </Link>
          <span className="mx-2 text-neutral-400">/</span>
          <span className="text-neutral-900">{product.name}</span>
        </nav>

        {/* 主要內容區域 - 左右分欄 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* 左側：商品資訊 */}
          <div className="flex-shrink-0 space-y-4 lg:w-auto">
            {/* 商品圖片和基本資訊 */}
            <div className="bg-white rounded-lg shadow-md p-4">
              {/* 商品圖片 */}
              <div className="relative w-full max-w-full lg:min-w-[400px] lg:max-w-[400px] aspect-square rounded-lg overflow-hidden mb-3 mx-auto lg:mx-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {product.isHot && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    熱賣中
                  </div>
                )}
              </div>

              {/* 商品標題和價格 */}
              <h1 className="text-xl font-bold text-neutral-900 mb-2">{product.name}</h1>
              <div className="mb-3">
                <span className="text-2xl font-bold text-primary">NT$ {product.price}</span>
                <span className="text-neutral-500 ml-2 text-sm">/ 抽</span>
              </div>

              {/* 剩餘數量 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-neutral-700 font-medium text-sm">剩餘數量：</span>
                  <span className="text-lg font-bold text-primary">{product.remaining} 件</span>
                </div>
                {product.remaining < 10 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-yellow-800 text-xs">
                    ⚠️ 庫存不足，請盡快購買！
                  </div>
                )}
              </div>

              {/* 抽獎按鈕 */}
              <button
                onClick={handleDraw}
                disabled={isDrawing || product.remaining === 0}
                className={`w-full py-3 rounded-full font-bold text-base transition-all ${
                  isDrawing || product.remaining === 0
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isDrawing ? '抽獎中...' : product.remaining === 0 ? '已售完' : '立即抽獎'}
              </button>

            </div>

          </div>

          {/* 右側：配率表和公平性驗證 */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* 即時獎項配率表 */}
            <PrizeStatusList
              prizes={product.prizes.map((p: any) => ({
                id: p.id,
                name: p.name,
                level: p.level,
                remaining: p.remaining,
                total: p.total || p.remaining + (p.drawn || 0),
                drawn: p.drawn || 0,
                image: p.image,
              }))}
              category="十月玩具"
            />

            {/* 公平性驗證區塊 */}
            <ProvablyFairSection
              productId={product.id}
              txidHash={product.txidHash}
              isCompleted={false}
            />
          </div>
        </div>

        {/* 商品資訊 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">商品資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.releaseDate && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">上市時間</p>
                  <p className="text-base font-semibold text-neutral-900">{product.releaseDate}</p>
                </div>
              </div>
            )}
            {product.distributor && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">代理商</p>
                  <p className="text-base font-semibold text-neutral-900">{product.distributor}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">稀有度</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const rarity = product.rarity || 0
                    return (
                      <svg
                        key={index}
                        className={`w-5 h-5 ${index < rarity ? 'text-yellow-500' : 'text-neutral-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-bold text-neutral-900 mb-3">注意事項</h3>
          <ul className="space-y-2 text-neutral-600">
            <li>• 每抽價格為 NT$ {product.price}，抽獎結果隨機產生</li>
            <li>• 中獎機率依各賞項設定，實際結果以系統抽選為準</li>
            <li>• 商品庫存會即時更新，售完為止</li>
            <li>• 中獎後請於 7 天內完成付款，逾期將自動取消</li>
            <li>• 如有任何問題，歡迎聯絡客服</li>
          </ul>
        </div>

        {/* 猜你喜歡 */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">猜你喜歡</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedProducts.map((recommendedProduct: any) => (
              <ProductCard
                key={recommendedProduct.id}
                id={recommendedProduct.id}
                name={recommendedProduct.name}
                image={recommendedProduct.image}
                price={recommendedProduct.price}
                description={recommendedProduct.description}
                remaining={recommendedProduct.remaining}
                isHot={recommendedProduct.isHot}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium"
              >
                載入更多
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

