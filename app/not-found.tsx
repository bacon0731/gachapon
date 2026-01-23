import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            找不到這個頁面
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
            抱歉，您要尋找的頁面不存在或已被移除。請檢查網址是否正確，或返回首頁繼續瀏覽。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-dark transition-colors font-medium text-lg"
          >
            返回首頁
          </Link>
          <Link
            href="/shop"
            className="inline-block bg-white text-primary border-2 border-primary px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-colors font-medium text-lg"
          >
            瀏覽商品
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Link href="/" className="text-neutral-600 hover:text-primary transition-colors">
            首頁
          </Link>
          <Link href="/shop" className="text-neutral-600 hover:text-primary transition-colors">
            商品列表
          </Link>
          <Link href="/faq" className="text-neutral-600 hover:text-primary transition-colors">
            常見問題
          </Link>
          <Link href="/about" className="text-neutral-600 hover:text-primary transition-colors">
            關於我們
          </Link>
        </div>
      </div>
    </div>
  )
}

