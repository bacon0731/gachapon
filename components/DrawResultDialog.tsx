'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getPrizeLevelColor } from '@/utils/prizeColors'

interface DrawResultDialogProps {
  isOpen: boolean
  onClose: () => void
  results: Array<{
    id: string
    name: string
    image: string
    level: string
  }>
}

export default function DrawResultDialog({
  isOpen,
  onClose,
  results,
}: DrawResultDialogProps) {
  if (!isOpen) return null

  // 確保 results 是數組
  const displayResults = Array.isArray(results) ? results : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 對話框內容 */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題區域 */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-neutral-900">抽獎結果</h3>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="關閉"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 結果列表 */}
        <div className="p-6">
          {displayResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">暫無結果</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {displayResults.map((prize, index) => (
                <div
                  key={`${prize.id}-${index}`}
                  className="flex flex-col items-center w-[calc(20%-1rem)] min-w-[140px] max-w-[180px]"
                >
                  {/* 獎品圖片 */}
                  <div className="relative w-full aspect-square mb-3 bg-neutral-100 rounded-lg overflow-hidden shadow-sm">
                    <Image
                      src={prize.image || '/item.png'}
                      alt={prize.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* 獎品等級 */}
                  {prize.level && (() => {
                    const colors = getPrizeLevelColor(prize.level)
                    return (
                      <div className="mb-1 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                          {prize.level}
                        </span>
                      </div>
                    )
                  })()}
                  {/* 獎品名稱 */}
                  <div className="text-sm text-neutral-700 text-center line-clamp-2 leading-tight">{prize.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 按鈕區域 */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-center items-center gap-3">
          <Link
            href="/warehouse"
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow-md"
          >
            查看我的倉庫
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )
}
