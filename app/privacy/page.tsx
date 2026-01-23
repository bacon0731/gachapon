export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8 text-center">隱私政策</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="text-sm text-neutral-500 mb-6">
            最後更新日期：2024年1月22日
          </div>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. 資料收集</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              我們收集以下類型的個人資料：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>註冊時提供的姓名、電子郵件地址</li>
              <li>交易記錄和付款資訊</li>
              <li>使用網站時的瀏覽記錄和偏好設定</li>
              <li>裝置資訊和 IP 位址</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. 資料使用</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              我們使用收集的資料用於以下目的：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>處理您的訂單和交易</li>
              <li>提供客戶服務和支援</li>
              <li>改善網站功能和用戶體驗</li>
              <li>發送重要通知和促銷資訊（經您同意）</li>
              <li>防範詐騙和確保網站安全</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. 資料保護</h2>
            <p className="text-neutral-600 leading-relaxed">
              我們採用業界標準的安全措施來保護您的個人資料，包括加密傳輸、安全儲存和存取控制。
              我們不會將您的個人資料出售給第三方。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Cookie 使用</h2>
            <p className="text-neutral-600 leading-relaxed">
              我們使用 Cookie 和類似技術來改善您的瀏覽體驗、分析網站流量和個人化內容。
              您可以透過瀏覽器設定管理 Cookie 偏好。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. 您的權利</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              根據個人資料保護法，您有權：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>查詢、閱覽您的個人資料</li>
              <li>要求更正或補充您的個人資料</li>
              <li>要求停止收集、處理或使用您的個人資料</li>
              <li>要求刪除您的個人資料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. 第三方服務</h2>
            <p className="text-neutral-600 leading-relaxed">
              我們可能使用第三方服務（如付款處理、分析工具）來協助營運網站。
              這些服務提供者僅能在提供服務所需的範圍內存取您的資料。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. 聯絡我們</h2>
            <p className="text-neutral-600 leading-relaxed">
              如果您對本隱私政策有任何疑問或需要行使您的權利，請透過以下方式聯絡我們：
            </p>
            <div className="mt-4 space-y-2 text-neutral-600">
              <p>
                <strong className="text-neutral-900">電子郵件：</strong>
                <a href="mailto:privacy@example.com" className="text-accent hover:text-accent-dark ml-2">
                  privacy@example.com
                </a>
              </p>
              <p>
                <strong className="text-neutral-900">電話：</strong>
                <span className="ml-2">02-1234-5678</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

