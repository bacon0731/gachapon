'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AdminUser {
  id: string
  username: string
  nickname: string
  role: string
}

interface AdminContextType {
  user: AdminUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 檢查登入是否在當天有效（00:00 前有效）
  const isLoginValid = (): boolean => {
    if (typeof window === 'undefined') return false
    
    const loginDate = localStorage.getItem('adminLoginDate')
    if (!loginDate) return false

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // 如果登入日期不是今天，需要重新登入
    return loginDate === todayStr
  }

  useEffect(() => {
    // 標記為已掛載，確保只在客戶端執行
    setIsMounted(true)
    
    const initAuth = async () => {
      // 檢查是否有保存的登入狀態
      const token = localStorage.getItem('adminToken')
      const adminId = localStorage.getItem('adminId')
      
      if (token && adminId && isLoginValid()) {
        // 從 Supabase 獲取最新用戶資訊
        const { data: admin, error } = await supabase
          .from('admins')
          .select(`
            *,
            role:roles(name)
          `)
          .eq('id', adminId)
          .single()
          
        if (admin && !error && admin.status === 'active') {
          setUser({
            id: admin.id.toString(),
            username: admin.username,
            nickname: admin.nickname || '',
            role: admin.role?.name || 'admin',
          })
          setIsAuthenticated(true)
        } else {
          // 用戶不存在或被禁用，清除登入狀態
          logout()
        }
      } else if (token && !isLoginValid()) {
        // 登入已過期
        logout()
      }
    }
    
    initAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // 查詢用戶
      const { data: admin, error } = await supabase
        .from('admins')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('username', username)
        .single()
      
      if (error || !admin) {
        console.error('Login failed:', error)
        return false
      }

      // 驗證密碼 (注意：這裡是明文比較，生產環境應使用 bcrypt 等)
      if (admin.password_hash !== password) {
        return false
      }

      // 檢查狀態
      if (admin.status !== 'active') {
        return false
      }

      const token = 'admin-token-' + Date.now() // 簡單模擬 token
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminLoginDate', todayStr)
      localStorage.setItem('adminId', admin.id.toString())
      
      setUser({
        id: admin.id.toString(),
        username: admin.username,
        nickname: admin.nickname || '',
        role: admin.role?.name || 'admin',
      })
      setIsAuthenticated(true)
      
      // 更新最後登入時間
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id)
        
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminLoginDate')
    localStorage.removeItem('adminId')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AdminContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
