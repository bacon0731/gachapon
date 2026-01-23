export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8 text-center">關於我們</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">我們的使命</h2>
            <p className="text-neutral-600 leading-relaxed">
              我們致力於為喜愛動漫、潮玩的粉絲們提供最優質的一番賞抽獎體驗。
              透過線上平台，讓您隨時隨地都能享受抽獎的樂趣，並有機會獲得心儀的角色模型和周邊商品。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">為什麼選擇我們</h2>
            <ul className="space-y-3 text-neutral-600">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>正版授權商品，品質保證</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>公平透明的抽獎機制</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>即時庫存更新，資訊透明</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>快速安全的配送服務</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>專業的客戶服務團隊</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">聯絡我們</h2>
            <div className="space-y-2 text-neutral-600">
              <p>
                <strong className="text-neutral-900">客服信箱：</strong>
                <a href="mailto:service@example.com" className="text-accent hover:text-accent-dark ml-2">
                  service@example.com
                </a>
              </p>
              <p>
                <strong className="text-neutral-900">客服電話：</strong>
                <span className="ml-2">02-1234-5678</span>
              </p>
              <p>
                <strong className="text-neutral-900">服務時間：</strong>
                <span className="ml-2">週一至週五 09:00 - 18:00</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

