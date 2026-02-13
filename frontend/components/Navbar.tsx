
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

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-14 bg-white border-b border-neutral-100 sticky top-0 z-50" />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarInner() {
  const [query, setQuery] = useState('');
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile full screen
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false); // Desktop dropdown
  const [productName, setProductName] = useState<string | null>(null);
  const [isProductFollowed, setIsProductFollowed] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

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
  const isHomePage = pathname === '/';
  const isMainTab = pathname === '/shop' || pathname === '/news' || pathname === '/check-in' || pathname === '/market' || (pathname === '/profile' && !activeTab);
  const isInnerPage = !isHomePage && !isMainTab;
  const isProductDetailPage = /^\/shop\/\d+$/.test(pathname);
  const isNewsDetailPage = /^\/news\/[^/]+$/.test(pathname);

  const showMobileThemeToggle = pathname === '/' || pathname === '/shop' || pathname === '/market' || pathname === '/news';

  const isTicketSelectionPage = pathname.endsWith('/select');

  useEffect(() => {
    if (isProductDetailPage) {
      const match = pathname.match(/^\/shop\/(\d+)$/);
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
    
    const match = pathname.match(/^\/shop\/(\d+)$/);
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
  const showTitle = !isHomePage; // Show title on all pages except Home
  const showLogo = isHomePage; // Only show Logo on Home for mobile

  // 獲取頁面名稱
  const getPageTitle = () => {
    if (pathname === '/shop') return '全部商品';
    if (pathname === '/market') return '自由市集';
    if (pathname === '/news') return '最新情報';
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

  const notifications = [
    { id: 1, type: 'delivery', title: '訂單配送通知', content: '您的訂單 #OD12345 已發貨', time: '10分鐘前', icon: <Truck className="w-4 h-4" />, status: 'unread' },
    { id: 2, type: 'product', title: '關注商品開賣', content: '您關注的「航海王 蛋頭島一番賞」已正式開賣！', time: '2小時前', icon: <Sparkles className="w-4 h-4" />, status: 'unread' },
    { id: 3, type: 'delivery', title: '配送狀態更新', content: '您的獎項已抵達門市', time: '昨日', icon: <Clock className="w-4 h-4" />, status: 'read' },
  ];

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    
    // Save history
    const newHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    setQuery(q);
    setIsSearchOpen(false);
    setIsDesktopSearchOpen(false);
    
    if (pathname === '/market') {
      router.push(`/market?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    }
  };

  // const productTypes = [
  //   { id: 'all', name: '全部' },
  //   { id: 'custom', name: '自製賞' },
  //   { id: 'ichiban', name: '一番賞' },
  //   { id: 'blindbox', name: '盒玩' },
  //   { id: 'gacha', name: '轉蛋' },
  // ];

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
        ((pathname === '/profile' && !activeTab) || isTicketSelectionPage) && "hidden md:block"
      )}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* 左：Logo + 標語 / 返回按鈕 */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {showTitle ? (
                <div className="flex items-center w-full md:w-auto overflow-hidden">
                  {showBackButton && (
                    <button 
                      onClick={() => {
                        if (['/login', '/register', '/forgot-password'].includes(pathname)) {
                          router.push('/');
                        } else if (pathname === '/profile' && activeTab) {
                          router.push('/profile');
                        } else {
                          router.back();
                        }
                      }}
                      className="p-2 -ml-2 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-2 md:hidden shrink-0"
                    >
                      <ArrowLeft className="w-6 h-6 stroke-[3]" />
                    </button>
                  )}
                  <span className={cn(
                    "md:hidden text-lg font-black tracking-tight text-neutral-900 dark:text-white truncate flex-1 text-center px-1 min-w-0",
                    !showBackButton && "ml-0" // Adjust margin if no back button
                  )}>
                    {(productName && (isProductDetailPage || isNewsDetailPage)) ? productName : getPageTitle()}
                  </span>
                </div>
              ) : null}
              
              <Link href="/" className={cn("flex items-center group", !showLogo && "hidden md:flex")}>
                <div className="relative w-[120px] h-[40px] transition-transform group-hover:scale-105">
                  <Image
                    src="/images/logo.png"
                    alt="一番賞"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-3 lg:gap-5">
                <Link href="/shop" className="text-[15px] lg:text-[16px] font-black text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors">全部商品</Link>
                <Link href="/market" className="text-[15px] lg:text-[16px] font-black text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors flex items-center gap-1">
                  市集
                  <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm">NEW</span>
                </Link>
                <Link href="/news" className="text-[15px] lg:text-[16px] font-black text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors">最新情報</Link>
              </div>
            </div>
            
            {/* Search Bar - Responsive - Only show on Shop and Market pages */}
            {(pathname === '/shop' || pathname === '/market') && (
              <div ref={searchContainerRef} className="flex-1 w-full md:max-w-[280px] lg:max-w-[400px] mx-2 transition-all duration-300 relative">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(query);
                  }}
                >
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary transition-colors">
                      <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setIsDesktopSearchOpen(true)}
                      placeholder={pathname === '/market' ? "搜尋市集商品..." : "搜尋商品..."}
                      className="w-full h-11 md:h-9 pl-9 pr-8 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-[13px] font-bold transition-all placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          handleSearch('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Search Dropdown */}
                {isDesktopSearchOpen && (
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

                    {/* History */}
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

            {/* 右：搜尋 + 通知 + 登入/會員 */}
            <div className="flex items-center gap-0.5 lg:gap-2 shrink-0">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400 transition-colors",
                  showMobileThemeToggle ? "flex" : "hidden md:flex"
                )}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[2.5]" /> : <Moon className="w-5 h-5 stroke-[2.5]" />}
              </button>



              {/* Mobile Search Button - Hidden per user request */}
              {/* <button 
                className="md:hidden p-2 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
              </button> */}

              {/* Product Page Mobile Actions */}
              {isProductDetailPage && (
                <div className="flex items-center gap-0 md:hidden">
                  <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400 transition-colors">
                    <Share2 className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={handleFollowToggle}
                    className={cn("p-2 rounded-xl transition-colors", isProductFollowed ? "text-accent-red" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")}
                  >
                    <Heart className={cn("w-5 h-5 stroke-[2.5]", isProductFollowed && "fill-current")} />
                  </button>
                </div>
              )}

              <div className={cn("relative", isProductDetailPage && "hidden md:block")} ref={notificationRef}>
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={cn(
                    "relative p-2 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors active:scale-90",
                    isNotificationOpen && "bg-neutral-100 text-primary"
                  )}
                >
                  <Bell className="w-5 h-5 stroke-[2.5]" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full border-2 border-white shadow-sm"></span>
                </button>

                {/* Notifications Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-900 rounded-3xl shadow-modal border border-neutral-100 dark:border-neutral-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 border-b border-neutral-50 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-800/30">
                      <h3 className="text-[13px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">個人通知</h3>
                      <span className="text-[11px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase">2 則未讀</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.map((n) => (
                        <button 
                          key={n.id}
                          className={cn(
                            "w-full p-4 flex gap-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-50 dark:border-neutral-800 last:border-0",
                            n.status === 'unread' && "bg-primary/[0.02] dark:bg-primary/[0.05]"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            n.type === 'delivery' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-yellow/10 text-accent-yellow"
                          )}>
                            {n.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[13px] font-black text-neutral-900 dark:text-white">{n.title}</span>
                              <span className="text-[11px] font-black text-neutral-400 uppercase">{n.time}</span>
                            </div>
                            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-bold leading-snug line-clamp-2">{n.content}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Link href="/profile" className="block w-full py-3.5 text-center text-[13px] font-black text-neutral-400 hover:text-primary transition-colors bg-neutral-50/50 dark:bg-neutral-800/50 uppercase tracking-widest">
                      查看所有通知
                    </Link>
                  </div>
                )}
              </div>

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
                      <Link href="/topup" className="w-full bg-primary text-white text-[14px] font-black py-2.5 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-1.5">
                        立即儲值
                      </Link>
                      
                      <Link href="/profile" className="flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all">
                        <UserIcon className="w-4 h-4" />
                        會員中心
                      </Link>

                      <Link href="/profile?tab=follows" className="flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all">
                        <Heart className="w-4 h-4" />
                        我的關注
                      </Link>
                      
                      <div className="h-px bg-neutral-50 dark:bg-neutral-800 mx-2 my-1"></div>
                      
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-black text-neutral-400 hover:text-accent-red hover:bg-accent-red/5 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        登出
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                !['/login', '/register', '/forgot-password'].includes(pathname) && (
                  <Link href="/login" className={cn("bg-primary text-white px-5 h-9 flex items-center rounded-xl hover:bg-primary/90 transition-all text-[13px] font-black shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap", isProductDetailPage && "hidden md:flex")}>
                    登入
                  </Link>
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[2.5]" />
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋感興趣的商品..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
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
