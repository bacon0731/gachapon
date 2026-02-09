'use client';

import { Rocket, Heart, Shield, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Intro Section */}
        <div className="bg-neutral-900 rounded-2xl p-8 md:p-12 mb-12 text-center">
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed font-bold">
            致力於為動漫愛好者打造最公平、最有趣、最便利的線上抽獎平台。
            讓每一次的抽獎，都充滿期待與驚喜。
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6">我們的使命</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-loose font-medium">
              一番賞線上抽成立於 2024 年，我們是一群熱愛動漫與收藏的團隊。我們深知每位收藏家對於喜愛角色的熱情，因此我們建立了這個平台，希望打破時間與空間的限制，讓全台灣的粉絲都能隨時隨地享受一番賞的樂趣。我們堅持公開透明的機率與公平的機制，確保每一次的抽獎都是真實且公正的。
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">公平公正</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-bold">
              所有抽獎機率公開透明，嚴格遵守公平原則，絕無後台操控。
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">快速出貨</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-bold">
              擁有專業的倉儲物流團隊，確保您的戰利品能快速安全地送達。
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">優質服務</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-bold">
              貼心的客服團隊，隨時為您解答疑問，提供最溫暖的服務體驗。
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">社群互動</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-bold">
              建立活躍的玩家社群，讓您能與同好交流心得，分享中獎喜悅。
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-neutral-900 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black mb-6">為什麼選擇我們？</h2>
            <div className="space-y-4 text-neutral-300 font-medium">
              <p>
                我們不僅僅是一個抽獎平台，更是一個連結收藏家與夢想的橋樑。我們與日本各大廠商緊密合作，確保提供最新、最豐富的正版商品。
              </p>
              <p>
                從網站的流暢體驗到收到商品的開箱驚喜，我們在意每一個細節。您的滿意與信任，是我們持續進步的最大動力。
              </p>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}
