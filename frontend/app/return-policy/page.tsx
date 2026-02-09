'use client';

import { AlertTriangle } from 'lucide-react';

export default function ReturnPolicyPage() {

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 md:p-12">
            
            <div className="space-y-8">
            {/* Special Notice */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex gap-4">
              <div className="text-red-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-2">特別聲明</h3>
                <p className="text-red-700 leading-relaxed">
                  一番賞線上抽獎屬於「機會中獎商品」，依據消費者保護法第十九條規定，本服務所提供之數位內容或一經提供即為完成之線上服務，經消費者事先同意始提供，不適用七日鑑賞期之規定。
                </p>
              </div>
            </div>

            <div className="prose prose-neutral max-w-none">
              <p className="lead text-neutral-600">
                感謝您使用一番賞線上抽服務。為了確保雙方權益，請您在購買前詳細閱讀本退換貨政策。
              </p>

              <h3 className="text-xl font-bold text-neutral-900 mt-8 mb-4">一、退換貨規範</h3>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                <li>
                  <span className="font-bold">代幣購買：</span>
                  代幣一經購買及使用，恕不接受退費。若有誤買情形且代幣尚未由系統扣除，請於購買後 24 小時內聯繫客服處理。
                </li>
                <li>
                  <span className="font-bold">抽獎商品：</span>
                  因抽獎性質特殊，一旦執行抽獎動作，即視為商品已交付，恕不接受退貨或更換其他獎項。
                </li>
              </ul>

              <h3 className="text-xl font-bold text-neutral-900 mt-8 mb-4">二、瑕疵商品處理</h3>
              <p className="text-neutral-600">
                若您收到的實體商品有以下情形，請於收到商品後 7 日內（含例假日），保持商品完整包裝並聯繫客服，我們將盡速為您處理：
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 mt-2">
                <li>收到之商品與中獎項目不符。</li>
                <li>商品有明顯缺件、斷裂或嚴重塗裝瑕疵（不含一般大量生產之細微溢色）。</li>
                <li>商品運送過程中造成之損壞。</li>
              </ul>
              <p className="text-neutral-600 mt-4 text-sm bg-neutral-100 p-4 rounded">
                注意：外盒損傷（如壓痕、折角）不屬於商品瑕疵範圍，若您對盒況有完美要求，建議您斟酌使用本服務。
              </p>

              <h3 className="text-xl font-bold text-neutral-900 mt-8 mb-4">三、換貨流程</h3>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                  <span className="block text-2xl font-bold text-neutral-300 mb-2">01</span>
                  <h4 className="font-bold text-neutral-900 mb-2">聯繫客服</h4>
                  <p className="text-sm text-neutral-600">提供訂單編號、中獎明細及瑕疵照片。</p>
                </div>
                <div className="flex-1 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                  <span className="block text-2xl font-bold text-neutral-300 mb-2">02</span>
                  <h4 className="font-bold text-neutral-900 mb-2">確認狀況</h4>
                  <p className="text-sm text-neutral-600">客服人員確認符合換貨標準。</p>
                </div>
                <div className="flex-1 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                  <span className="block text-2xl font-bold text-neutral-300 mb-2">03</span>
                  <h4 className="font-bold text-neutral-900 mb-2">商品回收</h4>
                  <p className="text-sm text-neutral-600">我們將安排物流回收瑕疵商品。</p>
                </div>
                <div className="flex-1 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                  <span className="block text-2xl font-bold text-neutral-300 mb-2">04</span>
                  <h4 className="font-bold text-neutral-900 mb-2">寄送新品</h4>
                  <p className="text-sm text-neutral-600">確認回收商品無誤後，寄出新品。</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mt-8 mb-4">四、聯絡我們</h3>
              <p className="text-neutral-600">
                若您對退換貨有任何疑問，歡迎透過「常見問題」頁面中的聯絡方式與我們聯繫。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
