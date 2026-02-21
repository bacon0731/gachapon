'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Video, User, Gift, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
        <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 transition-colors" />
        <div className="relative w-full grid grid-cols-5 px-2 pb-safe pb-[env(safe-area-inset-bottom)] h-[56px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="relative h-full flex items-center justify-center">
              <div className="flex flex-col items-center justify-end h-full w-full pb-1.5 relative gap-1">
                {i === 2 ? (
                  <div className="absolute -top-6">
                    <Skeleton className="w-11 h-11 rounded-full border-[3px] border-white dark:border-neutral-900" />
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
 
  const mainTabPaths = ['/', '/shop', '/news', '/market', '/profile', '/check-in'];
  const isMainTabPath = mainTabPaths.includes(pathname);
  const isSecondaryPage = !isMainTabPath || (pathname === '/profile' && !!activeTab);

  const { theme } = useTheme();

  if (isSecondaryPage) {
    return null;
  }

  const tabs = [
    { name: '首頁', href: '/', icon: Home },
    { name: '開箱', href: '/unboxing', icon: Video },
    { name: '交易所', href: '/market', icon: Box, isCenter: true },
    { name: '任務', href: '/check-in', icon: Gift },
    { name: '會員', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 pointer-events-none">
      <div className="relative h-16 w-full flex items-end pointer-events-auto">
        {/* Main Background Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 transition-colors" />

        <div className="relative w-full grid grid-cols-5 px-2 pb-safe pb-[env(safe-area-inset-bottom)] h-[56px]">
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
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center absolute left-1/2 border border-white/60 dark:border-neutral-900 bg-gradient-to-t from-[#EE4D2D] to-[#FF7043] text-white",
                        theme === 'dark' && "border-neutral-800"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8">
                        <Icon
                          size={22}
                          strokeWidth={2}
                          className="text-white"
                        />
                      </div>
                    </motion.div>
                    <span
                      className={cn(
                        "text-[11px] font-black transition-colors duration-300",
                        isActive ? "text-primary" : "text-neutral-400 dark:text-neutral-500"
                      )}
                    >
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
                className="flex flex-col items-center justify-end pb-1.5 gap-0 h-full relative"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-2xl transition-colors duration-300 w-8 h-8",
                      isActive ? "bg-primary/10" : ""
                    )}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                      className={cn(
                        "transition-colors duration-300",
                        isActive ? "text-primary" : "text-neutral-400 dark:text-neutral-500"
                      )}
                    />
                  </div>
                </motion.div>
                <span className={cn(
                  "text-[11px] font-black transition-colors duration-300",
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
