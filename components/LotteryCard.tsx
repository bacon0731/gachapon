'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getPrizeLevelColor } from '@/utils/prizeColors'

interface LotteryCardProps {
  prizeName: string
  grade: string
  prizeImage?: string
  onPeelComplete: () => void
}

export default function LotteryCard({
  prizeName,
  grade,
  prizeImage = '/item.png',
  onPeelComplete,
}: LotteryCardProps) {
  const [isPeeled, setIsPeeled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // 計算拖曳距離
  const dragDistance = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      if (typeof latestX === 'number' && typeof latestY === 'number') {
        return Math.sqrt(latestX ** 2 + latestY ** 2)
      }
      return 0
    }
  )

  // 動態陰影：根據拖曳距離增加
  const shadowBlur = useTransform(dragDistance, [0, 200], [0, 30])
  const shadowOpacity = useTransform(dragDistance, [0, 200], [0, 0.5])

  // 旋轉：根據 X 軸位移給予旋轉
  const rotate = useTransform(x, [-200, 200], [-15, 15])

  // 組合陰影樣式
  const boxShadow = useTransform(
    [shadowBlur, shadowOpacity],
    (values) => {
      const blur = Array.isArray(values) ? values[0] : 0
      const opacity = Array.isArray(values) ? values[1] : 0
      return `0 ${blur}px ${blur * 2}px rgba(0, 0, 0, ${opacity})`
    }
  )

  // 閾值：超過此距離才算撕成功
  const PEEL_THRESHOLD = 100

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleDragEnd = (event: any, info: any) => {
    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2)

    if (distance >= PEEL_THRESHOLD) {
      // 撕成功：飛出畫面
      setIsPeeled(true)
      
      // 清除之前的定時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        onPeelComplete()
        timeoutRef.current = null
      }, 500)
    } else {
      // 未達閾值：彈回原位
      x.set(0)
      y.set(0)
    }
    setIsDragging(false)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  // 鋸齒邊緣的 clip-path - 左側撕痕
  const getTornEdgeClipPath = () => {
    // 創建鋸齒狀的撕痕邊緣（左側）
    const points = []
    const segments = 12
    points.push('0% 0%')
    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * 100
      const x = i % 2 === 0 ? 0 : -3 // 交替的鋸齒，向左突出
      points.push(`${x}% ${y}%`)
    }
    points.push('0% 100%')
    points.push('100% 100%')
    points.push('100% 0%')
    return `polygon(${points.join(', ')})`
  }

  const getGradeColor = (grade: string) => {
    const colors = getPrizeLevelColor(grade)
    // 使用 bg-gradient-to-br 來保持原有的漸變方向
    return colors.bg.replace('bg-gradient-to-r', 'bg-gradient-to-br')
  }

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
      {/* 底層：中獎結果 */}
      <motion.div
        className={`absolute inset-0 ${getGradeColor(grade)} rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isPeeled ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-32 h-32 mb-4 rounded-lg overflow-hidden bg-white/20">
          <Image
            src={prizeImage}
            alt={prizeName}
            fill
            className="object-cover"
          />
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">{grade}</div>
          <div className="text-xl font-semibold text-white/90">{prizeName}</div>
        </div>
        <div className="mt-6 text-6xl animate-bounce">🎉</div>
      </motion.div>

      {/* 上層：籤紙封面 */}
      <AnimatePresence>
        {!isPeeled && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
            dragElastic={0.2}
            dragDirectionLock
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{
              x,
              y,
              rotate,
              boxShadow,
            }}
            className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 rounded-2xl border-2 border-neutral-300 cursor-grab active:cursor-grabbing overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{
              x: 500,
              y: 500,
              rotate: 45,
              opacity: 0,
              transition: {
                duration: 0.5,
                ease: 'easeInOut',
              },
            }}
            whileDrag={{
              scale: 1.02,
              zIndex: 10,
            }}
          >
            {/* 鋸齒邊緣效果 */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: getTornEdgeClipPath(),
              }}
            >
              {/* 籤紙內容 */}
              <div className="h-full flex flex-col items-center justify-center p-6 relative">
                {/* 背景圖案 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 text-6xl">🎫</div>
                  <div className="absolute bottom-4 right-4 text-6xl">🎫</div>
                </div>

                {/* 主要文字 */}
                <div className="relative z-10 text-center">
                  <div className="text-5xl mb-4">🎁</div>
                  <div className="text-2xl font-bold text-neutral-800 mb-2">一番賞</div>
                  <div className="text-lg text-neutral-600 mb-6">拖曳撕開</div>
                  <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                    👆 向下拖曳
                  </div>
                </div>

                {/* 裝飾線條 */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>

              {/* 撕痕提示線 */}
              {isDragging && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拖曳提示 */}
      {!isDragging && !isPeeled && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-neutral-500 text-sm pointer-events-none"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          👇 向下拖曳撕開
        </motion.div>
      )}
    </div>
  )
}
