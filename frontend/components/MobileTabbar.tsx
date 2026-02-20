'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Newspaper, User, Search, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/Skeleton';

export default function MobileTabbar() {
  return (
    <Suspense fallback={<MobileTabbarSkeleton />}>
      <MobileTabbarInner />
    </Suspense>
  );
}

function MobileTabbarSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 pointer-events-none">
      <div className="relative h-16 w-full flex items-end pointer-events-auto">
        <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-white dark:bg-neutral-900 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] rounded-t-[20px] border-t border-neutral-100 dark:border-neutral-800 transition-colors" />
        <div className="relative w-full grid grid-cols-5 px-2 pb-safe h-[56px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="relative h-full flex items-center justify-center">
              <div className="flex flex-col items-center justify-end h-full w-full pb-1.5 relative gap-1">
                {i === 2 ? (
                  <div className="absolute -top-7">
                    <Skeleton className="w-12 h-12 rounded-full border-4 border-white dark:border-neutral-900" />
                  </div>
                ) : (
                  <>
                    <Skeleton className="w-6 h-6 rounded-md" />
                    <Skeleton className="w-8 h-2 rounded-sm" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileTabbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  // Logic matches Navbar.tsx's isSecondaryPage
  const isSecondaryPage = (pathname !== '/' && pathname !== '/shop' && pathname !== '/news' && pathname !== '/profile' && pathname !== '/check-in' && pathname !== '/market') || (pathname === '/profile' && !!activeTab);

  const { theme } = useTheme();

  if (isSecondaryPage) {
    return null;
  }

  const tabs = [
    { name: '首頁', href: '/', icon: Home },
    { name: '商品', href: '/shop', icon: ShoppingBag },
    { name: '自由市集', href: '/market', icon: Search, isCenter: true },
    { name: '情報', href: '/news', icon: Newspaper },
    { name: '會員', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 pointer-events-none">
      <div className="relative h-16 w-full flex items-end pointer-events-auto">
        {/* Main Background Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-white dark:bg-neutral-900 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] rounded-t-[20px] border-t border-neutral-100 dark:border-neutral-800 transition-colors" />

        <div className="relative w-full grid grid-cols-5 px-2 pb-safe h-[56px]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === '/profile' && pathname.startsWith('/profile'));
            const Icon = tab.icon;
            
            if (tab.isCenter) {
              return (
                <div key={tab.href} className="relative h-full flex items-center justify-center">
                  <Link
                    href={tab.href}
                    className="flex flex-col items-center justify-end h-full w-full pb-1.5 relative"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      initial={false}
                      animate={{
                        x: '-50%',
                        y: isActive ? -22 : -18,
                        backgroundColor: isActive ? 'rgb(59, 130, 246)' : (theme === 'dark' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)'),
                        color: isActive ? 'rgb(255, 255, 255)' : (theme === 'dark' ? 'rgb(163, 163, 163)' : 'rgb(163, 163, 163)'),
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-shadow duration-300 border-4 border-white dark:border-neutral-900 absolute left-1/2",
                        isActive ? "shadow-primary/40" : "shadow-neutral-200 dark:shadow-neutral-950"
                      )}
                    >
                      <Icon size={24} className="stroke-[2.5]" />
                    </motion.div>
                    <span className={cn(
                      "text-[13px] font-black transition-all duration-300",
                      isActive ? "text-primary" : "text-neutral-400 opacity-80 dark:text-neutral-500"
                    )}>
                      {tab.name}
                    </span>
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-end pb-1.5 gap-0.5 h-full relative"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={{
                    color: isActive ? 'rgb(59, 130, 246)' : 'rgb(163, 163, 163)',
                    scale: isActive ? 1.1 : 1,
                  }}
                  className="relative z-10"
                >
                  <Icon
                    size={24}
                    className={cn(isActive && "fill-current/10")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="tab-highlight"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -inset-1.5 bg-primary/5 dark:bg-primary/20 rounded-xl -z-10"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
                <span className={cn(
                  "text-[13px] font-black transition-colors duration-300",
                  isActive ? "text-primary" : "text-neutral-400 dark:text-neutral-500"
                )}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
