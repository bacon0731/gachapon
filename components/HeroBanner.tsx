'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const banners = [
  {
    id: 1,
    title: '最新一番賞上架',
    subtitle: '限時優惠，立即抽獎',
    image: '/banner.png',
    link: '/shop',
  },
  {
    id: 2,
    title: '熱門商品推薦',
    subtitle: '人氣爆棚，手慢就沒了',
    image: '/banner.png',
    link: '/shop',
  },
  {
    id: 3,
    title: '限時特價活動',
    subtitle: '超值優惠，不容錯過',
    image: '/banner.png',
    link: '/shop',
  },
]

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '842/296' }}>
          {/* 輪播圖片容器 */}
          <div 
            className="relative w-full h-full"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.5s ease-in-out',
            }}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="absolute inset-0 w-full h-full"
                style={{
                  left: `${index * 100}%`,
                }}
              >
                <Link href={banner.link} className="block w-full h-full">
                  <div className="relative w-full h-full">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      width={842}
                      height={296}
                      className="w-full h-full object-cover"
                      priority={index === currentIndex}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* 左右箭頭按鈕 */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            aria-label="上一張"
          >
            <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            aria-label="下一張"
          >
            <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`transition-all duration-500 rounded-full cursor-pointer ${
                index === currentIndex
                  ? 'w-8 h-2 bg-primary shadow-md'
                  : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400 hover:w-6'
              }`}
              aria-label={`切換到第 ${index + 1} 張輪播圖`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

