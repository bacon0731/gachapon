'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LotteryCard from '@/components/LotteryCard'

interface LotteryAnimationProps {
  prizes: any[]
  quantity: number
  onComplete: (prize: any) => void
  onClose: () => void
}

export default function LotteryAnimation({ prizes, quantity, onComplete, onClose }: LotteryAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drawnPrizes, setDrawnPrizes] = useState<any[]>([])
  const [currentPrize, setCurrentPrize] = useState<any>(null)
  const [isPeeled, setIsPeeled] = useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const availablePrizes = prizes.filter((p: any) => p.remaining > 0)
    if (availablePrizes.length === 0) {
      onClose()
      return
    }

    // 為每次抽獎隨機選擇獎品
    const selectedPrizes = []
    for (let i = 0; i < quantity; i++) {
      const randomIndex = Math.floor(Math.random() * availablePrizes.length)
      selectedPrizes.push(availablePrizes[randomIndex])
    }
    setDrawnPrizes(selectedPrizes)
    setCurrentPrize(selectedPrizes[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity])

  // 清理定時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handlePeelComplete = () => {
    setIsPeeled(true)
    
    // 清除之前的定時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      // 如果還有下一次抽獎
      if (currentIndex < quantity - 1) {
        setCurrentIndex(currentIndex + 1)
        setCurrentPrize(drawnPrizes[currentIndex + 1])
        setIsPeeled(false)
      } else {
        // 所有抽獎完成
        if (drawnPrizes.length > 0) {
          // 傳遞最後一個獎品
          onComplete(drawnPrizes[drawnPrizes.length - 1])
        }
      }
      timeoutRef.current = null
    }, 1500)
  }

  const handleNextDraw = () => {
    if (currentIndex < quantity - 1 && drawnPrizes.length > currentIndex + 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentPrize(drawnPrizes[currentIndex + 1])
      setIsPeeled(false)
    }
  }

  const handleClose = () => {
    // 清理定時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    onClose()
  }

  const availablePrizes = prizes.filter((p: any) => p.remaining > 0)

  if (availablePrizes.length === 0 || !currentPrize) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 動畫內容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-neutral-900">
          {!isPeeled ? `撕開籤紙揭曉結果 (${currentIndex + 1}/${quantity})` : '恭喜中獎！'}
        </h2>

        {/* 撕紙卡片 */}
        {!isPeeled && currentPrize && (
          <div className="mb-6">
            <LotteryCard
              prizeName={currentPrize.name}
              grade={currentPrize.level}
              prizeImage={currentPrize.image}
              onPeelComplete={handlePeelComplete}
            />
          </div>
        )}

        {/* 結果顯示 */}
        {isPeeled && currentPrize && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-gradient-to-r from-primary to-primary-dark p-6 rounded-xl text-center text-white">
              <div className="text-4xl mb-2 animate-bounce">🎉</div>
              <div className="text-xl font-bold mb-2">恭喜中獎！</div>
              <div className="text-lg">{currentPrize.level} - {currentPrize.name}</div>
            </div>
          </div>
        )}

        {/* 按鈕區域 */}
        {isPeeled && (
          <div className="space-y-3 animate-fade-in">
            {currentIndex < quantity - 1 ? (
              <button
                onClick={handleNextDraw}
                className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition-colors font-medium"
              >
                繼續抽獎 ({currentIndex + 1}/{quantity})
              </button>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-neutral-600">已完成所有抽獎！</p>
                </div>
                <Link
                  href="/warehouse"
                  className="block w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition-colors font-medium text-center"
                >
                  查看我的倉庫
                </Link>
              </>
            )}
            <button
              onClick={handleClose}
              className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-full hover:bg-neutral-200 transition-colors font-medium"
            >
              {currentIndex < quantity - 1 ? '取消' : '確定'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
