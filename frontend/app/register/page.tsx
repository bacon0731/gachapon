'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { signup } from '../login/actions';
import { useAuth } from '@/contexts/AuthContext';

function RegisterContent() {
  const { showToast } = useToast();
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message');
  const error = searchParams.get('error');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) {
      const normalized = error.toLowerCase();
      if (normalized.includes('database error saving new user')) {
        showToast('此信箱可能已註冊，請直接登入或重設密碼', 'error');
      } else {
        showToast(error, 'error');
      }
    }
    if (message) {
      showToast(message, 'success');
    }
  }, [error, message, showToast]);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (user) {
    return (
      <div className="h-[calc(100vh-64px)] bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-neutral-500 font-bold">正在跳轉...</p>
      </div>
    );
  }

  const handleSignup = async (formData: FormData) => {
    const terms = formData.get('terms');

    if (!terms) {
      showToast('請同意服務條款與隱私權政策', 'error');
      return;
    }

    const result = await signup(formData);

    if (result?.error) {
      const normalized = result.error.toLowerCase();
      if (normalized.includes('database error saving new user')) {
        showToast('此信箱可能已註冊，請直接登入或重設密碼', 'error');
      } else {
        showToast(result.error, 'error');
      }
    } else if (result?.success) {
      if (result.message) {
        showToast(result.message, 'success');
      }
      router.push(`/login?message=${encodeURIComponent(result.message || '')}`);
    }
  };

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
              註冊新帳號
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              建立帳號以開始您的收藏之旅
            </p>
          </div>

          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl py-6 px-5 shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-3xl border border-white/20 dark:border-neutral-800">
            <form className="space-y-4" action={handleSignup}>
              <Input
                label="電子郵件"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                leftIcon={<Mail className="w-5 h-5" />}
                className="bg-neutral-50/50 dark:bg-neutral-800/50 border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
              />

              <Input
                label="設定密碼"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                minLength={6}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                onRightIconClick={() => setShowPassword(prev => !prev)}
                className="bg-neutral-50/50 dark:bg-neutral-800/50 border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
              />

              <Input
                label="邀請碼 (選填)"
                name="inviteCode"
                type="text"
                placeholder="輸入好友的邀請碼"
                leftIcon={<User className="w-5 h-5" />}
                className="bg-neutral-50/50 dark:bg-neutral-800/50 border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all font-mono uppercase"
              />

              <div className="flex items-start pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const checkbox = document.getElementById('terms') as HTMLInputElement | null
                    if (checkbox) {
                      checkbox.click()
                    }
                  }}
                  className="mt-0.5 flex items-center justify-center h-6 w-6 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
                >
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <span className="pointer-events-none inline-flex h-4 w-4 items-center justify-center rounded-md bg-transparent peer-checked:bg-primary">
                    <span className="h-2.5 w-2.5 rounded-[4px] bg-white peer-checked:block" />
                  </span>
                </button>
                <label htmlFor="terms" className="ml-3 block text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  我已閱讀並同意
                  <a href="#" className="font-medium text-primary hover:text-primary/80 mx-1">服務條款</a>
                  與
                  <a href="#" className="font-medium text-primary hover:text-primary/80 mx-1">隱私權政策</a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl shadow-lg shadow-primary/20"
                size="lg"
              >
                立即註冊
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-center text-xs text-neutral-500">
                已經有帳號了嗎？{' '}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  立即登入
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
