'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [verifyLink, setVerifyLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!agreeToTerms) {
      setError('請同意服務條款和隱私政策')
      setIsLoading(false)
      return
    }

    // 模擬發送驗證信
    setTimeout(() => {
      if (email) {
        // 模擬：將驗證 token 存儲到 localStorage（實際應該由後端處理）
        const token = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(`verify_token_${email}`, token)
        
        // 在開發環境中，將驗證鏈結存儲到 localStorage 以便測試
        if (typeof window !== 'undefined') {
          const link = `${window.location.origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
          localStorage.setItem(`verify_link_${email}`, link)
          setVerifyLink(link)
        }
        
        setIsEmailSent(true)
      } else {
        setError('請輸入有效的電子郵件地址')
      }
      setIsLoading(false)
    }, 1500)
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                驗證信已發送
              </h2>
              <p className="text-neutral-600 mb-4">
                我們已將驗證信發送至
              </p>
              <p className="text-primary font-semibold mb-6">{email}</p>
              <p className="text-sm text-neutral-500 mb-4">
                請點擊信件中的驗證鏈結來完成註冊，並設定您的密碼。
              </p>
              {/* 開發環境：顯示驗證鏈結（實際應用中不應顯示） */}
              {verifyLink && (
                <div className="mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-2 font-medium">開發模式 - 驗證鏈結：</p>
                  <a
                    href={verifyLink}
                    className="text-xs text-primary break-all hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {verifyLink}
                  </a>
                </div>
              )}
              <p className="text-xs text-neutral-400 mb-4">
                沒有收到信件？請檢查垃圾郵件資料夾，或
              </p>
              <button
                onClick={() => {
                  setIsEmailSent(false)
                  setError('')
                }}
                className="text-primary hover:text-primary-dark font-medium text-sm"
              >
                重新發送
              </button>
            </div>
            <div className="pt-4 border-t border-neutral-200">
              <Link
                href="/login"
                className="text-sm text-neutral-600 hover:text-primary"
              >
                返回登入頁面
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-bold text-neutral-900">
            註冊新帳號
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            已有帳號？{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              立即登入
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-neutral-500">
                我們將發送驗證信至您的電子郵件地址
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-neutral-600">
                我同意{' '}
                <Link href="/terms" className="text-primary hover:text-primary-dark">
                  服務條款
                </Link>{' '}
                和{' '}
                <Link href="/privacy" className="text-primary hover:text-primary-dark">
                  隱私政策
                </Link>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-full text-white ${
                isLoading
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              } transition-colors`}
            >
              {isLoading ? '發送中...' : '發送驗證信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

