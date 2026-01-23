'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 從 sessionStorage 獲取 email
    const pendingEmail = sessionStorage.getItem('pending_email')
    if (!pendingEmail) {
      // 如果沒有待設定的 email，導向註冊頁
      router.push('/register')
      return
    }
    setEmail(pendingEmail)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 驗證
    if (formData.password.length < 8) {
      setError('密碼長度至少 8 個字元')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('密碼與確認密碼不一致')
      setIsLoading(false)
      return
    }

    // 模擬設定密碼
    setTimeout(() => {
      // 清除 sessionStorage
      sessionStorage.removeItem('pending_email')
      
      // 模擬註冊成功
      // 實際應該調用 API 來設定密碼
      
      // 導向登入頁面
      router.push('/login?registered=true')
      setIsLoading(false)
    }, 1000)
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-neutral-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-bold text-neutral-900">
            設定密碼
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            為 <span className="font-semibold text-primary">{email}</span> 設定密碼
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
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="至少 8 個字元"
                minLength={8}
              />
              <p className="mt-1 text-xs text-neutral-500">密碼長度至少 8 個字元</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                確認密碼
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="請再次輸入密碼"
              />
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
              {isLoading ? '設定中...' : '完成註冊'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-neutral-600 hover:text-primary"
            >
              返回登入頁面
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

