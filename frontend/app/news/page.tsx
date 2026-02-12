
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import NewsCard from '@/components/NewsCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function NewsPage() {
  const [news, setNews] = useState<Database['public']['Tables']['news']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });
        
        if (error) throw error;
        setNews(data || []);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 md:pt-6">
        <div className="hidden md:flex flex-col gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 min-h-[38px]">
            <h1 className="flex items-baseline gap-4 text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              最新情報
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                <span className="font-amount">{news.length.toLocaleString()}</span> 篇文章
              </span>
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[200px] bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16 rounded-xl" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-3/4 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-2/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                id={item.id}
                title={item.title}
                category={item.category || '公告'}
                date={new Date(item.published_at || '').toLocaleDateString()}
                content={item.content || ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
