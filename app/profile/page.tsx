'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    birthday: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    // 模擬保存
    setTimeout(() => {
      setIsSaving(false)
      setIsEditing(false)
      // 這裡應該更新用戶資料
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">個人資料</h1>
          <p className="text-neutral-600">管理您的個人資訊</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* 頭像區域 */}
          <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-neutral-200">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{user?.name}</h2>
              <p className="text-neutral-600">{user?.email}</p>
            </div>
            <button className="ml-auto text-primary hover:text-primary-dark font-medium">
              更換頭像
            </button>
          </div>

          {/* 表單 */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  姓名
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.name || '未設定'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  電子郵件
                </label>
                <p className="text-neutral-900">{formData.email}</p>
                <p className="text-xs text-neutral-500 mt-1">電子郵件無法修改</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  手機號碼
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0912-345-678"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.phone || '未設定'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  生日
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.birthday || '未設定'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                配送地址
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="請輸入完整地址"
                />
              ) : (
                <p className="text-neutral-900">{formData.address || '未設定'}</p>
              )}
            </div>

            {/* 按鈕 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-full text-white font-medium transition-colors ${
                      isSaving
                        ? 'bg-neutral-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark'
                    }`}
                  >
                    {isSaving ? '儲存中...' : '儲存'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium"
                >
                  編輯資料
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 其他設定 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">帳號設定</h3>
          <div className="space-y-4">
            <Link
              href="/forgot-password"
              className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div>
                <p className="font-medium text-neutral-900">修改密碼</p>
                <p className="text-sm text-neutral-600">更新您的登入密碼</p>
              </div>
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
