
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Search, Bell, LogOut, User as UserIcon, ChevronDown, X, History, Flame, Truck, Sparkles, Clock, Heart, CheckCircle2, Sun, Moon, Share2, Copy } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { useAlert } from '@/components/ui/AlertDialog';

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-[57px] bg-white border-b border-neutral-100 sticky top-0 z-50" />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile full screen
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false); // Desktop dropdown
  const [productName, setProductName] = useState<string | null>(null);
  const [isProductFollowed, setIsProductFollowed] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const trimmedQuery = query.trim();

  // Check if we just logged in
  const isLoginRedirect = searchParams.get('login_success') === 'true';
  const [isForcingLoading, setIsForcingLoading] = useState(false);

  useEffect(() => {
    if (isLoginRedirect && !user) {
      setIsForcingLoading(true);
      // Fallback timeout in case user never loads (e.g. error)
      const timer = setTimeout(() => setIsForcingLoading(false), 8000);
      return () => clearTimeout(timer);
    } else if (user) {
      setIsForcingLoading(false);
    }
  }, [isLoginRedirect, user]);
  
  const activeTab = searchParams.get('tab');
  
  // Define page types
  const isHomePage = pathname === '/' || pathname === '/shop';
  const isMainTab =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname === '/market' ||
    pathname === '/news' ||
    pathname === '/ranking' ||
    pathname === '/check-in' ||
    (pathname === '/profile' && !activeTab);
  const isInnerPage = !isHomePage && !isMainTab;
  const isShopProductDetailPage = /^\/shop\/\d+$/.test(pathname);
  const isBlindboxDetailPage = /^\/blindbox\/\d+$/.test(pathname);
  const isProductDetailPage = isShopProductDetailPage || isBlindboxDetailPage;
  const isNewsDetailPage = /^\/news\/[^/]+$/.test(pathname);

  const showMobileThemeToggle =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname === '/market' ||
    pathname === '/news' ||
    pathname === '/ranking';

  const isTicketSelectionPage = pathname.endsWith('/select');

  useEffect(() => {
    if (isProductDetailPage) {
      const match = pathname.match(/^(?:\/shop|\/blindbox)\/(\d+)$/);
      if (match) {
        const productId = match[1];
        
        // Fetch product name
        const fetchProduct = async () => {
          const { data } = await supabase
            .from('products')
            .select('name')
            .eq('id', productId)
            .single();
          
          if (data) {
            setProductName(data.name);
          }
        };
        fetchProduct();

        // Fetch follow status if user is logged in
        if (user) {
          const checkFollow = async () => {
            const { count } = await supabase
              .from('product_follows')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('product_id', productId);
            
            setIsProductFollowed(!!count);
          };
          checkFollow();
        }
      }
    } else if (isNewsDetailPage) {
      // Extract UUID from path
      const match = pathname.match(/^\/news\/([^/]+)$/);
      if (match) {
        const newsId = match[1];
        const fetchNews = async () => {
          const { data } = await supabase
            .from('news')
            .select('title')
            .eq('id', newsId)
            .single();
          
          if (data) {
            setProductName(data.title);
          }
        };
        fetchNews();
      }
    } else {
      setProductName(null);
      setIsProductFollowed(false);
    }
  }, [pathname, user, isProductDetailPage, isNewsDetailPage, supabase]);

  const handleFollowToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const match = pathname.match(/^(?:\/shop|\/blindbox)\/(\d+)$/);
    if (!match) return;
    const productId = match[1];

    if (isProductFollowed) {
      const { error } = await supabase.from('product_follows').delete().eq('user_id', user.id).eq('product_id', productId);
      if (!error) setIsProductFollowed(false);
    } else {
      const { error } = await supabase.from('product_follows').insert({ user_id: user.id, product_id: parseInt(productId) });
      if (!error) setIsProductFollowed(true);
    }
  };
  
  // Control visibility based on page type
  const showBackButton = isInnerPage;
  const showTitle = !isHomePage && pathname !== '/shop';
  const showLogo = isHomePage || pathname === '/shop';

  // 獲取頁面名稱
  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/shop') return '首頁';
    if (pathname === '/market') return '交易所';
    if (pathname === '/unboxing') return '開箱';
    if (pathname === '/ranking') return '排行榜';
    if (pathname.startsWith('/fairness')) return '公平性驗證';
    if (pathname === '/check-in') return '每日簽到';
    if (pathname.endsWith('/select')) return '選擇籤號';
    if (pathname.endsWith('/confirm')) return '確認購買';
    if (pathname.startsWith('/shop/')) return '商品詳情';
    if (pathname === '/topup') return '儲值代幣';
    if (pathname === '/faq') return '常見問題';
    if (pathname === '/about') return '關於我們';
    if (pathname === '/terms') return '會員條款';
    if (pathname === '/privacy') return '隱私權政策';
    if (pathname === '/return-policy') return '退換貨資訊';
    if (pathname === '/news') return '最新情報';
    if (pathname === '/unboxing') return '開箱';
    if (pathname === '/check-in') return '每日簽到';
    
    if (pathname === '/profile') {
      const tab = activeTab;
      if (tab === 'warehouse') return '我的倉庫';
      if (tab === 'delivery') return '配送訂單';
      if (tab === 'draw-history') return '抽獎紀錄';
      if (tab === 'topup-history') return '儲值紀錄';
      if (tab === 'follows') return '我的關注';
      if (tab === 'settings') return '設定';
      if (tab === 'market') return '市集管理';
      if (tab === 'check-in') return '每日簽到';
      return '個人中心';
    }
    return '';
  };

  // Mock data
  const hotSearches = ['航海王', '七龍珠', '鬼滅之刃', 'SPY×FAMILY', '寶可夢', '進擊的巨人', '鏈鋸人', '約定的夢幻島', '東京復仇者', '排球少年'];
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  type NotificationItem = {
    id: number
    type: string
    title: string
    body: string | null
    link: string | null
    is_read: boolean
    created_at: string | null
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) setSearchHistory(JSON.parse(saved));

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDesktopSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        const mapped: NotificationItem[] = data.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          link: item.link,
          is_read: item.is_read,
          created_at: item.created_at,
        }))
        setNotifications(mapped)
      }
    }

    loadNotifications()
  }, [user, supabase])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const n = payload.new as {
            id: number
            type: string
            title: string
            body: string | null
            link: string | null
            is_read: boolean
            created_at: string | null
          } | null
          if (!n) return

          setNotifications(prev => {
            if (prev.some(item => item.id === n.id)) return prev

            const next = [
              {
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                link: n.link,
                is_read: n.is_read,
                created_at: n.created_at,
              },
              ...prev,
            ]

            return next.slice(0, 20)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user])

  const handleNotificationClick = async (n: {
    id: number
    type: string
    title: string
    body: string | null
    link: string | null
    is_read: boolean
    created_at: string | null
  }) => {
    if (!n.is_read) {
      setNotifications(prev =>
        prev.map(item =>
          item.id === n.id ? { ...item, is_read: true } : item
        )
      )

      await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', n.id)
    }

    if (n.link) {
      setIsNotificationOpen(false)
      router.push(n.link)
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    if (unreadCount === 0) return

    setNotifications(prev =>
      prev.map(item =>
        item.is_read ? item : { ...item, is_read: true }
      )
    )

    await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('is_read', false)
  }

  // Debounce search effect
  useEffect(() => {
    // Only trigger on shop or market pages
    if (pathname !== '/shop' && pathname !== '/market') return;

    const timer = setTimeout(() => {
      const trimmedQ = query.trim();
      const currentSearch = searchParams.get('search') || '';
      
      // Avoid redundant updates
      if (trimmedQ === currentSearch) return;

      if (trimmedQ) {
        const url = pathname === '/market' 
          ? `/market?search=${encodeURIComponent(trimmedQ)}`
          : `/shop?search=${encodeURIComponent(trimmedQ)}`;
        router.replace(url);
      } else {
        const url = pathname === '/market' ? '/market' : '/shop';
        router.replace(url);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  const handleSearch = (q: string) => {
    const trimmedQ = q.trim();

    if (!trimmedQ) {
      setQuery('');
      setIsSearchOpen(false);
      setIsDesktopSearchOpen(false);
      if (pathname === '/market') {
        router.push('/market');
      } else {
        router.push('/search');
      }
      return;
    }

    const newHistory = [trimmedQ, ...searchHistory.filter((h) => h !== trimmedQ)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    setQuery(trimmedQ);
    setIsSearchOpen(false);
    setIsDesktopSearchOpen(false);

    if (pathname === '/market') {
      router.push(`/market?search=${encodeURIComponent(trimmedQ)}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmedQ)}`);
    }
  };

  // const productTypes = [
  //   { id: 'all', name: '全部' },
  //   { id: 'custom', name: '自製賞' },
  //   { id: 'ichiban', name: '一番賞' },
  //   { id: 'blindbox', name: '盒玩' },
  //   { id: 'gacha', name: '轉蛋' },
  // ];

  const isSearchPage = pathname === '/search';

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const deleteHistoryItem = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== term);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <>
      <nav className={cn(
        "bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 top-0 z-50 transition-colors",
        isProductDetailPage ? "fixed left-0 right-0 md:sticky" : "sticky",
        (
          (pathname === '/profile' && !activeTab) ||
          isTicketSelectionPage ||
          isSearchPage ||
          pathname === '/market'
        ) && "hidden md:block"
      )}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[57px]">
            {/* 左：Logo + 標語 / 返回按鈕 */}
            <div className="flex items-center gap-2 md:gap-8 flex-none min-w-0">
              {showTitle ? (
                <div className="flex items-center w-full md:hidden overflow-hidden">
                  {showBackButton && (
                    <button 
                      onClick={() => {
                        if (['/login', '/register', '/forgot-password'].includes(pathname)) {
                          router.push('/shop');
                        } else if (pathname === '/profile' && activeTab) {
                          router.push('/profile');
                        } else if (isProductDetailPage) {
                          router.push('/shop');
                        } else {
                          router.back();
                        }
                      }}
                      className="px-2.5 py-2 -ml-2 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-2 md:hidden shrink-0"
                    >
                      <ArrowLeft className="w-6 h-6 stroke-[2]" />
                    </button>
                  )}
                  <span className={cn(
                    "md:hidden font-black tracking-tight text-neutral-900 dark:text-white truncate text-left px-1.5 min-w-0 max-w-[68vw] sm:max-w-[72vw] flex-1",
                    isProductDetailPage ? "text-[18px]" : "text-[20px]",
                    !showBackButton && "ml-0"
                  )}>
                    {(productName && (isProductDetailPage || isNewsDetailPage)) ? productName : getPageTitle()}
                  </span>
                </div>
              ) : null}
              
              <Link href="/" className={cn("flex items-center group", !showLogo && "hidden md:flex")}>
                <div className="flex items-center gap-1.5 transition-transform group-hover:scale-105">
                  <Image
                    src="/images/logo.svg"
                    alt="GACHA ONLINE"
                    width={112}
                    height={28}
                    className="h-11 w-auto"
                    priority
                  />
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-3 lg:gap-5">
                <Link
                  href="/"
                  className={cn(
                    "relative flex items-center h-9 text-[15px] lg:text-[16px] font-black transition-colors",
                    pathname === '/' || pathname === '/shop'
                      ? "text-primary"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-primary"
                  )}
                >
                  <span>回首頁</span>
                  {(pathname === '/' || pathname === '/shop') && (
                    <span className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
                <Link
                  href="/market"
                  className={cn(
                    "relative flex items-center h-9 text-[15px] lg:text-[16px] font-black transition-colors",
                    pathname === '/market'
                      ? "text-primary"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-primary"
                  )}
                >
                  <span>交易所</span>
                  {pathname === '/market' && (
                    <span className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
                <Link
                  href="/unboxing"
                  className={cn(
                    "relative flex items-center h-9 text-[15px] lg:text-[16px] font-black transition-colors",
                    pathname === '/unboxing'
                      ? "text-primary"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-primary"
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    showAlert({
                      title: '開發中',
                      message: '頁面開發中',
                      type: 'info',
                    });
                  }}
                >
                  <span>開箱</span>
                  {pathname === '/unboxing' && (
                    <span className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              </div>
            </div>
            
            {!['/login', '/register', '/forgot-password'].includes(pathname) && (
              <div
                ref={searchContainerRef}
                className={cn(
                  "flex-1 w-full md:max-w-[280px] lg:max-w-[400px] mx-2 transition-all duration-300 relative hidden md:block"
                )}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(query);
                  }}
                >
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary transition-colors">
                      <Search className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <input
                      ref={desktopSearchInputRef}
                      value={query}
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuery(value);
                        if (value.trim()) {
                          setIsDesktopSearchOpen(false);
                        } else {
                          setIsDesktopSearchOpen(true);
                        }
                      }}
                      onFocus={() => {
                        if (!trimmedQuery) {
                          setIsDesktopSearchOpen(true);
                        }
                      }}
                      placeholder={pathname === '/market' ? "搜尋自由市集商品..." : "搜尋商品..."}
                      className="w-full h-11 md:h-9 pl-9 pr-8 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-[13px] font-bold transition-all placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (query.trim()) {
                          setQuery('');
                          handleSearch('');
                        } else {
                          setIsDesktopSearchOpen(false);
                          desktopSearchInputRef.current?.blur();
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Search Dropdown：桌機行為與手機相似，僅在無輸入時顯示提示 */}
                {isDesktopSearchOpen && !trimmedQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Hot Searches */}
                    <div className="mb-4">
                      <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-accent-red" />
                        熱門搜尋
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {hotSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSearch(term)}
                            className="px-2.5 py-1 bg-neutral-50 text-neutral-600 rounded-lg text-[11px] font-black hover:bg-primary/5 hover:text-primary transition-all"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {searchHistory.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            最近搜尋
                          </h3>
                          <button 
                            onClick={clearHistory}
                            className="text-[10px] font-black text-neutral-300 hover:text-neutral-500 uppercase"
                          >
                            清除
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {searchHistory.map((term) => (
                            <div
                              key={term}
                              onClick={() => handleSearch(term)}
                              className="flex items-center justify-between py-2 px-2.5 hover:bg-neutral-50 rounded-lg cursor-pointer group transition-all"
                            >
                              <span className="text-[13px] font-bold text-neutral-600 group-hover:text-neutral-900">{term}</span>
                              <button
                                onClick={(e) => deleteHistoryItem(e, term)}
                                className="p-1 text-neutral-300 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-0.5 lg:gap-2 shrink-0">
              {!isSearchPage && !isProductDetailPage && (
                <button 
                  className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-400 active:scale-95 transition-transform"
                  onClick={() => {
                    if (isHomePage) {
                      router.push('/search?focus=1');
                    } else {
                      setIsSearchOpen(true);
                    }
                  }}
                >
                  <Search className="w-5 h-5 stroke-[2]" />
                </button>
              )}
              {/* Dark Mode Toggle（搜尋頁隱藏） */}
              {!isSearchPage && (
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400 transition-colors",
                    showMobileThemeToggle ? "flex" : "hidden md:flex"
                  )}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[2]" /> : <Moon className="w-5 h-5 stroke-[2]" />}
                </button>
              )}

              {/* Product Page Mobile Actions */}
              {isProductDetailPage && (
                <div className="flex items-center gap-0.5 md:hidden">
                  <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400 transition-colors">
                    <Share2 className="w-5 h-5 stroke-[2]" />
                  </button>
                  <button 
                    onClick={handleFollowToggle}
                    className={cn("p-1.5 rounded-xl transition-colors", isProductFollowed ? "text-accent-red" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")}
                  >
                    <Heart className={cn("w-5 h-5 stroke-[2]", isProductFollowed && "fill-current")} />
                  </button>
                </div>
              )}

              {!isSearchPage && (
                <div className={cn("relative", isProductDetailPage && "hidden md:block")} ref={notificationRef}>
                  {isAuthenticated && (
                    <button 
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className={cn(
                        "relative p-2 rounded-xl text-neutral-600 dark:text-neutral-400 active:scale-90 transition-transform",
                        isNotificationOpen && "text-primary"
                      )}
                    >
                      <Bell className="w-5 h-5 stroke-[2]" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 min-w-[0.5rem] h-2 bg-accent-red rounded-full border-2 border-white" />
                      )}
                    </button>
                  )}

                  {/* Notifications Dropdown */}
                  {isAuthenticated && isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-4 border-b border-neutral-50 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-800/30">
                        <h3 className="text-[13px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">個人通知</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase">
                            {unreadCount > 0 ? `${unreadCount} 則未讀` : '無未讀通知'}
                          </span>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllNotificationsRead}
                              className="text-[11px] font-black text-neutral-400 hover:text-primary transition-colors"
                            >
                              全部標記為已讀
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 && (
                          <div className="px-4 py-6 text-center text-[13px] text-neutral-400 font-bold">
                            目前沒有通知
                          </div>
                        )}
                        {notifications.map((n) => {
                          const iconBgClass =
                            n.type === 'order_status'
                              ? 'bg-accent-emerald/10 text-accent-emerald'
                              : n.type === 'topup'
                              ? 'bg-accent-yellow/10 text-accent-yellow'
                              : n.type === 'coupon'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-neutral-100 text-neutral-500'

                          const icon =
                            n.type === 'order_status' ? (
                              <Truck className="w-4 h-4" />
                            ) : n.type === 'product_follow' ? (
                              <Heart className="w-4 h-4" />
                            ) : n.type === 'topup' ? (
                              <Sparkles className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )

                          return (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={cn(
                                'w-full p-4 flex gap-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-50 dark:border-neutral-800 last:border-0',
                                !n.is_read && 'bg-primary/[0.02] dark:bg-primary/[0.05]'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                  iconBgClass
                                )}
                              >
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[13px] font-black text-neutral-900 dark:text-white">
                                    {n.title}
                                  </span>
                                  <span className="text-[11px] font-black text-neutral-400 uppercase">
                                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-bold leading-snug line-clamp-2">
                                  {n.body || ''}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <Link href="/profile" className="block w-full py-3.5 text-center text-[13px] font-black text-neutral-400 hover:text-primary transition-colors bg-neutral-50/50 dark:bg-neutral-800/50 uppercase tracking-widest">
                        查看所有通知
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {isLoading || isForcingLoading || (isAuthenticated && !user) ? (
                <div className="relative ml-1 hidden md:flex items-center gap-2 pl-1 pr-1.5 py-1">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              ) : user ? (
                <div className="relative ml-1 hidden md:block" ref={menuRef}>
                  <button 
                    className={cn(
                      "flex items-center gap-2 pl-1 pr-1.5 py-1 hover:bg-neutral-100 rounded-xl transition-all",
                      isMenuOpen && "bg-neutral-100"
                    )}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl border-2 border-neutral-100 p-0.5 transition-all overflow-hidden relative",
                      isMenuOpen ? "border-primary/20" : "hover:border-primary/20"
                    )}>
                      <Image
                        src={user.avatar_url || 'https://github.com/shadcn.png'}
                        alt={user.name}
                        fill
                        className="rounded-[10px] object-cover"
                        unoptimized
                      />
                    </div>
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 text-neutral-300 transition-transform duration-300",
                      isMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Dropdown */}
                  <div className={cn(
                    "absolute right-0 mt-3 w-64 bg-white dark:bg-neutral-900 rounded-3xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-2.5 transition-all duration-300 transform origin-top-right z-50",
                    isMenuOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
                  )}>
                    {/* User Profile Summary */}
                    <div className="px-3.5 py-2.5 mb-2 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 relative">
                        <Image src={user.avatar_url || 'https://github.com/shadcn.png'} alt={user.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-black text-neutral-900 dark:text-white leading-tight">{user.name}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                        </div>
                        {/* Invite Code Display */}
                        <div 
                          className="flex items-center gap-1.5 mt-1.5 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group/invite w-fit"
                          onClick={(e) => {
                            e.preventDefault();
                            if (user.invite_code) {
                              navigator.clipboard.writeText(user.invite_code);
                              showToast('邀請碼已複製', 'success');
                            }
                          }}
                        >
                          <span className="text-[13px] font-black text-neutral-400">邀請碼：</span>
                          <span className="text-[13px] font-mono font-black text-primary group-hover/invite:text-primary/80 transition-colors">{user.invite_code || '-'}</span>
                          <Copy className="w-3.5 h-3.5 text-neutral-300 group-hover/invite:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Balance Display */}
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-3.5 mb-2 border border-neutral-100/50 dark:border-neutral-700/50">
                      <div className="text-[13px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">可用點數</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-accent-yellow shadow-sm">
                            <span className="text-[11px] text-white font-black leading-none">G</span>
                          </div>
                          <span className="text-xl font-black text-accent-red font-amount leading-none tracking-tight">
                            {user.points.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <Link href="/topup" onClick={() => setIsMenuOpen(false)} className="w-full bg-primary text-white text-[14px] font-black py-2.5 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-1.5">
                        立即儲值
                      </Link>
                      
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all">
                        <UserIcon className="w-4 h-4" />
                        會員中心
                      </Link>

                      <Link href="/profile?tab=follows" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all">
                        <Heart className="w-4 h-4" />
                        我的關注
                      </Link>
                      
                      <div className="h-px bg-neutral-50 dark:bg-neutral-800 mx-2 my-1"></div>
                      
                      <button
                        onClick={() => { setIsMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-400 hover:text-accent-red hover:bg-accent-red/5 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        登出
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                !['/login', '/register', '/forgot-password'].includes(pathname) && !isProductDetailPage && (
                  <>
                    {/* Mobile login button: 細膠囊線框 */}
                    <Link
                      href="/login"
                      className="md:hidden px-3 h-8 flex items-center rounded-full border border-primary text-[12px] font-black text-primary active:scale-95 transition-transform whitespace-nowrap"
                    >
                      登入
                    </Link>
                    {/* Desktop login button */}
                    <Link
                      href="/login"
                      className={cn(
                        "hidden md:flex bg-primary text-white px-5 h-9 items-center rounded-full hover:bg-primary/90 transition-colors text-[13px] font-black whitespace-nowrap",
                        isProductDetailPage && "hidden md:flex"
                      )}
                    >
                      登入
                    </Link>
                  </>
                )
              )}
            </div>
            {/* Mobile Search & Tabs Sub-header - Removed and moved to page components */}
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-[60] flex flex-col md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[2]" />
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋感興趣的商品..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-2xl py-2.5 pl-10 pr-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                />
              </form>
            </div>
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="px-3 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm font-black uppercase tracking-widest">取消</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* Hot Searches */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-red" />
                熱門搜尋
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {hotSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-black hover:bg-primary/5 hover:text-primary transition-all border border-neutral-100/50 dark:border-neutral-800/50"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {searchHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4" />
                    最近搜尋
                  </h3>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-black text-neutral-300 hover:text-accent-red transition-colors uppercase tracking-widest"
                  >
                    清除全部
                  </button>
                </div>
                <div className="space-y-1.5">
                  {searchHistory.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(term)}
                      className="w-full text-left px-4 py-3.5 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl flex items-center justify-between group transition-all border border-neutral-50 dark:border-neutral-800 shadow-soft"
                    >
                      <span className="text-sm font-black">{term}</span>
                      <X 
                        className="w-4 h-4 text-neutral-300 hover:text-accent-red transition-colors" 
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(e as React.MouseEvent, term); }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
