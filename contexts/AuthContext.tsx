'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  tokens?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 從 localStorage 恢復登入狀態
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // 確保有代幣字段
        if (userData.tokens === undefined) {
          userData.tokens = 1000
          localStorage.setItem('user', JSON.stringify(userData))
        }
        setUser(userData)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // 模擬登入驗證
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          // 從 localStorage 恢復代幣，如果沒有則設置默認值
          const storedUser = localStorage.getItem('user')
          let tokens = 1000 // 默認代幣
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              tokens = parsed.tokens || 1000
            } catch (e) {
              // 忽略錯誤
            }
          }
          
          const userData: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            tokens,
          }
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          resolve(true)
        } else {
          resolve(false)
        }
      }, 1000)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
