'use client'

import { useEffect } from 'react'

interface AlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'warning' | 'error' | 'info' | 'success'
  confirmText?: string
  onConfirm?: () => void
  showCancel?: boolean
  cancelText?: string
  zIndex?: number
}

export default function Alert({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  confirmText = '確定',
  onConfirm,
  showCancel = false,
  cancelText = '取消',
  zIndex = 50,
}: AlertProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          buttonBg: 'bg-red-600 hover:bg-red-700',
        }
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          buttonBg: 'bg-green-600 hover:bg-green-700',
        }
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
        }
      default: // warning
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        }
    }
  }

  const styles = getTypeStyles()

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default: // warning
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Alert 內容 */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 內容區域 */}
        <div className="p-6">
          {/* Icon 和 Title */}
          <div className="flex items-start space-x-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center ${styles.iconColor}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${styles.titleColor} mb-1`}>
                {title}
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {message}
              </p>
            </div>
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
        </div>

        {/* 按鈕區域 */}
        <div className="px-6 pb-6 flex justify-end space-x-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 ${styles.buttonBg} text-white rounded-full transition-colors font-medium shadow-sm hover:shadow-md`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
