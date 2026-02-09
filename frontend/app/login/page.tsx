'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { login } from './actions'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'

function LoginContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')

  return (
    <div className="h-[calc(100vh-64px)] bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden relative pt-6 md:pt-8">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-5 lg:px-7 z-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 md:mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              歡迎回來
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              登入您的帳號以繼續
            </p>
          </div>

          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl py-6 px-5 shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-3xl border border-white/20 dark:border-neutral-800">
            <form className="space-y-4">
              <Input
                label="電子郵件"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                className="bg-neutral-50/50 dark:bg-neutral-800/50 border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
              />
              
              <div className="space-y-0.5">
                <Input
                  label="密碼"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="bg-neutral-50/50 dark:bg-neutral-800/50 border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
                />
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300">
                    忘記密碼？
                  </Link>
                </div>
              </div>

              <Button
                formAction={login}
                className="w-full rounded-xl shadow-lg shadow-primary/20"
                size="lg"
              >
                登入
              </Button>

              {message && (
                <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 backdrop-blur-sm">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-2.5 bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center justify-center border border-red-100 dark:border-red-900/50 backdrop-blur-sm">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-center text-xs text-neutral-500">
                還沒有帳號嗎？{' '}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  立即註冊
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-none py-4 text-center z-10 md:hidden">
        <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
          © 2024 Ichiban Kuji. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
