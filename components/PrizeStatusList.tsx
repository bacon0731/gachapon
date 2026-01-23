'use client'

import { useState } from 'react'
import Image from 'next/image'
import ImageModal from './ImageModal'
import { getPrizeLevelColor } from '@/utils/prizeColors'

interface Prize {
  id: string
  name: string
  level: string
  remaining: number
  total: number
  drawn: number
  image?: string
}

interface PrizeStatusListProps {
  prizes: Prize[]
  category?: string
}

export default function PrizeStatusList({ prizes, category }: PrizeStatusListProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null)

  // 計算總計
  const totalRemaining = prizes.reduce((sum, prize) => sum + prize.remaining, 0)
  const totalTotal = prizes.reduce((sum, prize) => sum + prize.total, 0)

  // 按賞項等級分組
  const groupedPrizes = prizes.reduce((acc, prize) => {
    if (!acc[prize.level]) {
      acc[prize.level] = []
    }
    acc[prize.level].push(prize)
    return acc
  }, {} as Record<string, Prize[]>)

  // 賞項等級順序
  const levelOrder = ['A賞', 'B賞', 'C賞', 'D賞', 'E賞', 'F賞', 'G賞', 'H賞', '最後賞']

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold text-neutral-900 mb-2">店家配率表</h2>
      
      {category && (
        <div className="mb-2">
          <span className="text-sm font-medium text-neutral-700">{category}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-1 px-3 font-semibold text-neutral-700 text-xs">獎項</th>
              <th className="text-right py-1 px-3 font-semibold text-neutral-700 text-xs">剩餘/總數</th>
            </tr>
          </thead>
          <tbody>
            {levelOrder.map((level) => {
              const levelPrizes = groupedPrizes[level] || []
              if (levelPrizes.length === 0) return null

              return levelPrizes.map((prize, index) => (
                <tr
                  key={prize.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-1 px-3">
                    <div className="flex items-center gap-2">
                      {prize.image && (
                        <div
                          className="relative w-[40px] h-[40px] flex-shrink-0 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage({ url: prize.image!, alt: prize.name })}
                        >
                          <Image
                            src={prize.image}
                            alt={prize.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const colors = getPrizeLevelColor(prize.level)
                            return (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                {prize.level}
                              </span>
                            )
                          })()}
                          {levelPrizes.length > 1 && (
                            <span className="text-xs text-neutral-500">({index + 1})</span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-600 mt-0.5">{prize.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-1 px-3 text-right">
                    <span className="font-semibold text-neutral-900 text-sm">
                      {prize.remaining}/{prize.total}
                    </span>
                  </td>
                </tr>
              ))
            })}
            
            {/* 合計行 */}
            <tr className="border-t-2 border-primary/30 bg-primary/5 font-bold">
              <td className="py-3 px-3 text-primary text-lg">合計</td>
              <td className="py-3 px-3 text-right text-primary text-xl">
                {totalRemaining}/{totalTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 圖片彈窗 */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageAlt={selectedImage.alt}
        />
      )}
    </div>
  )
}
