'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [email, setEmail] = useState('')

  useEffect(() => {
    // 從 URL 參數獲取 token 和 email
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (!token || !emailParam) {
      setStatus('error')
      return
    }

    // 模擬驗證過程
    setTimeout(() => {
      // 檢查 localStorage 中的 token（實際應該由後端驗證）
      const storedToken = localStorage.getItem(`verify_token_${emailParam}`)
      
      if (storedToken && token === storedToken) {
        setEmail(emailParam)
        setStatus('success')
        // 清除 token
        localStorage.removeItem(`verify_token_${emailParam}`)
        // 將 email 存儲到 sessionStorage，供設定密碼頁面使用
        sessionStorage.setItem('pending_email', emailParam)
      } else {
        setStatus('error')
      }
    }, 1500)
  }, [searchParams])

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              驗證中...
            </h2>
            <p className="text-neutral-600">
              正在驗證您的電子郵件地址
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              驗證失敗
            </h2>
            <p className="text-neutral-600 mb-6">
              驗證鏈結無效或已過期，請重新註冊
            </p>
            <Link
              href="/register"
              className="inline-block bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors"
            >
              返回註冊頁面
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            驗證成功
          </h2>
          <p className="text-neutral-600 mb-6">
            您的電子郵件已驗證成功，請設定您的密碼以完成註冊
          </p>
          <button
            onClick={() => router.push('/set-password')}
            className="w-full bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-colors font-medium"
          >
            設定密碼
          </button>
        </div>
      </div>
    </div>
  )
}

