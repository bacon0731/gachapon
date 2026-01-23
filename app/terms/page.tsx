export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8 text-center">服務條款</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="text-sm text-neutral-500 mb-6">
            最後更新日期：2024年1月22日
          </div>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. 接受條款</h2>
            <p className="text-neutral-600 leading-relaxed">
              當您使用本網站時，即表示您已閱讀、理解並同意遵守本服務條款。
              如果您不同意這些條款，請勿使用本網站。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. 服務說明</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              本網站提供線上一番賞抽獎服務，包括但不限於：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>商品展示和資訊提供</li>
              <li>線上抽獎服務</li>
              <li>訂單處理和配送</li>
              <li>客戶服務支援</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. 使用者資格</h2>
            <p className="text-neutral-600 leading-relaxed">
              您必須年滿 18 歲或取得法定代理人的同意，才能使用本網站服務。
              您保證提供的所有資訊均為真實、準確且完整。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. 抽獎規則</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              參與抽獎時，請注意以下規則：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>抽獎結果由系統隨機產生，無法預測或操控</li>
              <li>每抽價格固定，付款後即完成抽獎</li>
              <li>中獎結果以系統顯示為準，不得異議</li>
              <li>商品庫存有限，售完為止</li>
              <li>中獎後請於指定時間內完成付款，逾期將自動取消</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. 付款與退款</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              付款相關規定：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>所有價格均以新台幣（NT$）標示</li>
              <li>付款方式包括信用卡、轉帳等</li>
              <li>抽獎完成後，除商品瑕疵或系統錯誤外，恕不接受退款</li>
              <li>如因系統問題導致重複扣款，我們將全額退還</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. 商品配送</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              配送相關說明：
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-600 ml-4">
              <li>商品將於付款完成後 3-7 個工作天內出貨</li>
              <li>運費依配送方式計算，將於結帳時顯示</li>
              <li>請確保收件地址正確，因地址錯誤導致的損失由使用者自行承擔</li>
              <li>商品配送過程中的風險由我們承擔，但收件後由使用者負責</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. 智慧財產權</h2>
            <p className="text-neutral-600 leading-relaxed">
              本網站的所有內容，包括但不限於文字、圖片、標誌、設計等，均受智慧財產權法保護。
              未經授權，不得複製、轉載或使用。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. 免責聲明</h2>
            <p className="text-neutral-600 leading-relaxed">
              本網站提供的服務「依現狀」提供，我們不保證服務的持續性、準確性或完整性。
              對於因使用或無法使用本網站而造成的任何損失，我們不承擔責任。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. 條款修改</h2>
            <p className="text-neutral-600 leading-relaxed">
              我們保留隨時修改本服務條款的權利。修改後的條款將公佈於本網站，
              繼續使用服務即視為接受修改後的條款。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">10. 聯絡我們</h2>
            <p className="text-neutral-600 leading-relaxed">
              如有任何疑問，請透過以下方式聯絡我們：
            </p>
            <div className="mt-4 space-y-2 text-neutral-600">
              <p>
                <strong className="text-neutral-900">電子郵件：</strong>
                <a href="mailto:service@example.com" className="text-accent hover:text-accent-dark ml-2">
                  service@example.com
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

