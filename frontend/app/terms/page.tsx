'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 md:p-12">
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead text-neutral-600 dark:text-neutral-400">
              歡迎您加入一番賞線上抽（以下簡稱「本服務」）。為了保障您的權益，請詳細閱讀本服務條款。當您註冊成為會員或開始使用本服務時，即表示您已閱讀、瞭解並同意遵守本條款之所有內容。
            </p>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">一、會員註冊與帳號安全</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>註冊時應提供正確、最新及完整的個人資料，若有變更應立即更新。</li>
              <li>會員應妥善保管帳號與密碼，不得將帳號出借、轉讓或與他人共用。</li>
              <li>若發現帳號遭盜用或有安全疑慮，應立即通知本服務。</li>
            </ul>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">二、服務內容與規範</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>本服務提供線上抽獎、商品購買及配送等相關服務。</li>
              <li>會員進行抽獎時，應確認商品資訊、價格及機率等內容。</li>
              <li>本服務所提供之抽獎結果為隨機產生，會員不得以未中獎或不滿意結果為由要求退費或賠償。</li>
              <li>嚴禁利用本服務進行任何非法、詐欺或干擾系統運作之行為。</li>
            </ul>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">三、代幣與付款</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>會員可透過本服務提供之付款方式購買代幣。</li>
              <li>代幣一經購買及使用，除法律另有規定外，不得要求退費。</li>
              <li>若因系統錯誤導致代幣扣除異常，本服務將於查證後進行補償或調整。</li>
            </ul>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">四、商品配送</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>中獎商品將暫存於會員之「盒櫃」中，會員可隨時申請出貨。</li>
              <li>申請出貨時需支付運費，運費標準依當時公告為準。</li>
              <li>商品寄送地址僅限本服務公告之配送範圍。</li>
            </ul>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">五、服務中斷與免責聲明</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>若因天災、系統維護、網路壅塞或其他不可抗力因素導致服務中斷，本服務不負賠償責任。</li>
              <li>本服務保留隨時修改、暫停或終止部分或全部服務之權利。</li>
            </ul>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-4">六、其他</h3>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>本條款如有未盡事宜，依中華民國法律及相關法令辦理。</li>
              <li>若因本服務發生爭議，雙方同意以台灣台北地方法院為第一審管轄法院。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
