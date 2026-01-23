'use client'

import { useState } from 'react'

const faqs = [
  {
    id: 1,
    question: '如何參與一番賞抽獎？',
    answer: '首先註冊並登入帳號，瀏覽商品列表選擇您喜歡的一番賞，點擊「立即抽獎」按鈕，完成付款後即可獲得抽獎結果。',
  },
  {
    id: 2,
    question: '抽獎結果是隨機的嗎？',
    answer: '是的，所有抽獎結果均由系統隨機產生，確保公平公正。我們無法預測或操控抽獎結果。',
  },
  {
    id: 3,
    question: '可以退款嗎？',
    answer: '抽獎完成後，除商品瑕疵或系統錯誤外，恕不接受退款。如因系統問題導致重複扣款，我們將全額退還。',
  },
  {
    id: 4,
    question: '商品何時會出貨？',
    answer: '商品將於付款完成後 3-7 個工作天內出貨，我們會透過電子郵件通知您出貨資訊和追蹤號碼。',
  },
  {
    id: 5,
    question: '如何查詢訂單狀態？',
    answer: '登入帳號後，進入「我的訂單」頁面即可查看所有訂單狀態，包括待付款、已出貨、已完成等。',
  },
  {
    id: 6,
    question: '支援哪些付款方式？',
    answer: '我們支援信用卡、ATM 轉帳、超商代碼繳費等多種付款方式，您可以在結帳時選擇適合的方式。',
  },
  {
    id: 7,
    question: '商品有瑕疵怎麼辦？',
    answer: '如收到商品有瑕疵，請於收到商品後 7 天內聯絡客服，我們將協助您辦理退換貨。',
  },
  {
    id: 8,
    question: '可以指定要哪個賞項嗎？',
    answer: '不行，一番賞的樂趣就在於隨機抽選。所有賞項都是隨機分配的，無法指定特定賞項。',
  },
  {
    id: 9,
    question: '庫存會即時更新嗎？',
    answer: '是的，商品庫存會即時更新。當某個賞項售完時，系統會立即顯示「已售完」狀態。',
  },
  {
    id: 10,
    question: '如何聯絡客服？',
    answer: '您可以透過網站上的「聯絡我們」頁面、客服信箱 service@example.com 或客服電話 02-1234-5678 與我們聯絡。服務時間為週一至週五 09:00 - 18:00。',
  },
]

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4 text-center">常見問題</h1>
        <p className="text-center text-neutral-600 mb-8">
          找不到您要的答案？歡迎{' '}
          <a href="/about" className="text-primary hover:text-primary-dark font-medium">
            聯絡我們
          </a>
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-neutral-50 transition-colors"
              >
                <span className="font-semibold text-neutral-900 pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${
                    openId === faq.id ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openId === faq.id && (
                <div className="px-6 pb-4 text-neutral-600 leading-relaxed">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-primary to-primary-dark rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">還有其他問題？</h2>
          <p className="mb-6">我們的客服團隊隨時為您服務</p>
          <a
            href="/about"
            className="inline-block bg-white text-primary px-6 py-3 rounded-full hover:bg-neutral-100 transition-colors font-medium"
          >
            聯絡我們
          </a>
        </div>
      </div>
    </div>
  )
}

