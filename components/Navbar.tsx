'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 點擊外部關閉用戶選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">一番賞</span>
              <span className="ml-2 text-sm text-neutral-700">線上抽獎</span>
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-neutral-700 hover:text-primary transition-colors font-medium whitespace-nowrap">
                首頁
              </Link>
              <Link href="/shop" className="text-neutral-700 hover:text-primary transition-colors font-medium whitespace-nowrap">
                商品列表
              </Link>
              <Link href="/about" className="text-neutral-700 hover:text-primary transition-colors font-medium whitespace-nowrap">
                關於我們
              </Link>
              <Link href="/faq" className="text-neutral-700 hover:text-primary transition-colors font-medium whitespace-nowrap">
                常見問題
              </Link>
            </div>
          </div>

          {/* Right Side: Search and User Menu */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end max-w-2xl">
            {/* 搜尋框 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center">
                    <div className="absolute left-3 text-neutral-400 group-hover:text-primary transition-colors duration-200 z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋商品..."
                      className="w-full px-4 py-2.5 pl-10 pr-10 bg-white border-2 border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm placeholder:text-neutral-400 hover:border-neutral-300 shadow-sm hover:shadow-md"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                        aria-label="清除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-white border-2 border-neutral-200 rounded-full px-4 py-2 hover:border-primary transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-neutral-700 font-medium hidden lg:block">{user?.name}</span>
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                    {/* 代幣顯示 */}
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-600">剩餘代幣</span>
                        <span className="text-lg font-bold text-primary">{user?.tokens?.toLocaleString() || 0}</span>
                      </div>
                      <Link
                        href="/recharge"
                        className="block w-full text-center px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-sm font-medium"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        充值代幣
                      </Link>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      個人資料
                    </Link>
                    <Link
                      href="/warehouse"
                      className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      我的倉庫
                    </Link>
                    <Link
                      href="/history"
                      className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      抽獎紀錄
                    </Link>
                    <hr className="my-2 border-neutral-200" />
                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                        router.push('/')
                      }}
                      className="w-full text-left px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors font-medium whitespace-nowrap">
                登入
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-neutral-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="選單"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {/* 手機版搜尋框 */}
            <form onSubmit={handleSearch} className="px-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center">
                    <div className="absolute left-3 text-neutral-400 group-hover:text-primary transition-colors duration-200 z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋商品..."
                      className="w-full px-4 py-2.5 pl-10 pr-10 bg-white border-2 border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm placeholder:text-neutral-400 hover:border-neutral-300 shadow-sm hover:shadow-md"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                        aria-label="清除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
            <Link href="/" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              首頁
            </Link>
            <Link href="/shop" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              商品列表
            </Link>
            <Link href="/about" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              關於我們
            </Link>
            <Link href="/faq" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              常見問題
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
                  個人資料
                </Link>
                <Link href="/history" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
                  歷史紀錄
                </Link>
                <button
                  onClick={() => {
                    logout()
                    router.push('/')
                  }}
                  className="w-full bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors font-medium mt-2 text-center block"
                >
                  登出
                </button>
              </>
            ) : (
              <Link href="/login" className="w-full bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors font-medium mt-2 text-center block">
                登入
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

