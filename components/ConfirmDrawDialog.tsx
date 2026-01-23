'use client'

import { useState, useEffect } from 'react'

interface ConfirmDrawDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
  price: number
  remaining: number
}

export default function ConfirmDrawDialog({
  isOpen,
  onClose,
  onConfirm,
  price,
  remaining,
}: ConfirmDrawDialogProps) {
  const [quantity, setQuantity] = useState(1)

  // 當對話框關閉時重置數量
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleIncrement = () => {
    if (quantity < remaining) {
      setQuantity(quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleConfirm = () => {
    onConfirm(quantity)
  }

  const totalPrice = price * quantity

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 對話框內容 */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 內容區域 */}
        <div className="p-6">
          {/* Title */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">確認抽獎</h3>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="關閉"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 數量選擇 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-3">選擇數量</label>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    quantity <= 1
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-neutral-900">{quantity}</span>
                </div>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= remaining}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    quantity >= remaining
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">剩餘：{remaining} 件</div>
              </div>
            </div>
          </div>

          {/* 價格資訊 */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-600">單價</span>
              <span className="text-neutral-900 font-medium">NT$ {price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">數量</span>
              <span className="text-neutral-900 font-medium">{quantity} 次</span>
            </div>
            <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-neutral-900">總計</span>
              <span className="text-2xl font-bold text-primary">NT$ {totalPrice}</span>
            </div>
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="px-6 pb-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow-md"
          >
            確認抽獎
          </button>
        </div>
      </div>
    </div>
  )
}
