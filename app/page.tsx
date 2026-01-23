import Link from 'next/link'
import HeroBanner from '@/components/HeroBanner'
import ProductCard from '@/components/ProductCard'

// 模擬商品資料
const featuredProducts = [
  {
    id: '1',
    name: '鬼滅之刃 無限列車篇 一番賞',
    image: '/item.png',
    price: 350,
    description: '經典動畫角色，精美周邊商品',
    remaining: 5,
    isHot: true,
  },
  {
    id: '2',
    name: '咒術迴戰 第二季 一番賞',
    image: '/item.png',
    price: 380,
    description: '最新動畫系列，限量發售',
    remaining: 12,
    isHot: true,
  },
  {
    id: '3',
    name: '進擊的巨人 最終章 一番賞',
    image: '/item.png',
    price: 320,
    description: '史詩級完結篇紀念商品',
    remaining: 8,
    isHot: false,
  },
  {
    id: '4',
    name: '我的英雄學院 一番賞',
    image: '/item.png',
    price: 360,
    description: '超人氣動畫角色周邊',
    remaining: 15,
    isHot: false,
  },
  {
    id: '5',
    name: 'SPY×FAMILY 間諜家家酒 一番賞',
    image: '/item.png',
    price: 340,
    description: '溫馨家庭喜劇角色商品',
    remaining: 20,
    isHot: true,
  },
  {
    id: '6',
    name: '鏈鋸人 一番賞',
    image: '/item.png',
    price: 370,
    description: '黑暗奇幻風格角色周邊',
    remaining: 10,
    isHot: false,
  },
  {
    id: '7',
    name: '航海王 和之國篇 一番賞',
    image: '/item.png',
    price: 390,
    description: '經典冒險動畫周邊',
    remaining: 18,
    isHot: true,
  },
  {
    id: '8',
    name: '火影忍者 疾風傳 一番賞',
    image: '/item.png',
    price: 330,
    description: '忍者世界經典角色',
    remaining: 7,
    isHot: false,
  },
  {
    id: '9',
    name: '七龍珠超 一番賞',
    image: '/item.png',
    price: 400,
    description: '經典格鬥動畫周邊',
    remaining: 14,
    isHot: true,
  },
  {
    id: '10',
    name: '名偵探柯南 一番賞',
    image: '/item.png',
    price: 310,
    description: '推理動畫經典角色',
    remaining: 9,
    isHot: false,
  },
  {
    id: '11',
    name: '進擊的巨人 最終季 一番賞',
    image: '/item.png',
    price: 365,
    description: '史詩級動畫完結篇',
    remaining: 11,
    isHot: true,
  },
  {
    id: '12',
    name: '東京喰種 一番賞',
    image: '/item.png',
    price: 345,
    description: '黑暗奇幻風格周邊',
    remaining: 6,
    isHot: false,
  },
  {
    id: '13',
    name: '一拳超人 一番賞',
    image: '/item.png',
    price: 355,
    description: '超人氣搞笑動畫周邊',
    remaining: 16,
    isHot: true,
  },
  {
    id: '14',
    name: 'Re:從零開始的異世界生活 一番賞',
    image: '/item.png',
    price: 375,
    description: '異世界冒險動畫周邊',
    remaining: 13,
    isHot: false,
  },
  {
    id: '15',
    name: '關於我轉生變成史萊姆這檔事 一番賞',
    image: '/item.png',
    price: 385,
    description: '轉生異世界動畫周邊',
    remaining: 19,
    isHot: true,
  },
  {
    id: '16',
    name: '刀劍神域 一番賞',
    image: '/item.png',
    price: 325,
    description: '虛擬世界冒險動畫',
    remaining: 4,
    isHot: false,
  },
  {
    id: '17',
    name: '輝夜姬想讓人告白 一番賞',
    image: '/item.png',
    price: 335,
    description: '校園戀愛喜劇周邊',
    remaining: 17,
    isHot: true,
  },
  {
    id: '18',
    name: '五等分的新娘 一番賞',
    image: '/item.png',
    price: 315,
    description: '戀愛喜劇動畫周邊',
    remaining: 3,
    isHot: false,
  },
  {
    id: '19',
    name: '約定的夢幻島 一番賞',
    image: '/item.png',
    price: 395,
    description: '懸疑冒險動畫周邊',
    remaining: 21,
    isHot: true,
  },
  {
    id: '20',
    name: '鬼滅之刃 遊郭篇 一番賞',
    image: '/item.png',
    price: 405,
    description: '最新篇章精彩周邊',
    remaining: 22,
    isHot: true,
  },
]

const categories = [
  { name: '一番賞', icon: '🎁', count: 24 },
  { name: '轉蛋', icon: '🎰', count: 18 },
  { name: '盒玩', icon: '📦', count: 15 },
  { name: '限定商品', icon: '⭐', count: 12 },
]

export default function Home() {
  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-all duration-300 cursor-pointer group transform hover:-translate-y-0.5"
            >
              <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-neutral-900 mb-0.5 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-xs md:text-sm text-neutral-500">{category.count} 項商品</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-neutral-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900">熱門商品</h2>
          <a
            href="/shop"
            className="text-accent hover:text-accent-dark font-medium transition-colors"
          >
            查看全部 →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* News Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">最新消息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: '新一番賞上架通知',
              date: '2024-01-15',
              content: '最新一批人氣動畫一番賞已上架，快來試試手氣！',
            },
            {
              title: '限時優惠活動',
              date: '2024-01-10',
              content: '即日起至月底，購買滿額即享折扣優惠！',
            },
            {
              title: '會員專屬福利',
              date: '2024-01-05',
              content: '註冊成為會員即可獲得抽獎券，還有更多好禮等你來拿！',
            },
          ].map((news, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-sm text-neutral-500 mb-2">{news.date}</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">{news.title}</h3>
              <p className="text-neutral-600">{news.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

