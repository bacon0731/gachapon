'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 模擬發送重設密碼郵件
    setTimeout(() => {
      setIsSent(true)
      setIsLoading(false)
    }, 1000)
  }

  if (isSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">郵件已發送</h2>
            <p className="text-neutral-600 mb-6">
              我們已將重設密碼的連結發送到您的電子郵件信箱，請檢查您的收件匣並按照指示重設密碼。
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-colors font-medium"
            >
              返回登入
            </Link>
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
            忘記密碼
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            請輸入您的電子郵件，我們將發送重設密碼的連結給您
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
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
              {isLoading ? '發送中...' : '發送重設連結'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:text-primary-dark">
              返回登入
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

