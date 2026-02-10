'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: '常見問題',
      items: [
        {
          q: '什麼是一番賞線上抽？',
          a: '一番賞線上抽是讓您隨時隨地都能享受抽獎樂趣的服務。您可以透過網站購買抽獎券，即時開獎，並選擇將獎品寄送到府或暫存於倉庫。'
        },
        {
          q: '如何購買抽獎券？',
          a: '註冊會員並登入後，選擇您喜歡的一番賞商品，點擊「立即抽」或「購買多抽」，完成付款後即可進行抽獎。'
        },
        {
          q: '中獎後如何領取獎品？',
          a: '中獎商品會自動存入您的「盒櫃」中。您可以隨時前往盒櫃選擇要出貨的商品，填寫收件資訊並支付運費後，我們將為您寄出。'
        }
      ]
    },
    {
      category: '帳號與付款',
      items: [
        {
          q: '有哪些付款方式？',
          a: '我們提供信用卡刷卡、LINE Pay、ATM 轉帳等多種付款方式，方便您快速儲值代幣進行抽獎。'
        },
        {
          q: '代幣會過期嗎？',
          a: '購買的代幣沒有使用期限，您可以放心存放與使用。但在特定活動贈送的紅利代幣可能會有使用期限，請留意活動說明。'
        }
      ]
    },
    {
      category: '配送相關',
      items: [
        {
          q: '運費如何計算？',
          a: '單筆出貨運費依物流業者收費標準計算。若單筆申請出貨滿一定數量或金額（依當時活動而定），可享有免運優惠。'
        },
        {
          q: '申請出貨後多久會收到？',
          a: '一般情況下，申請出貨後約 3-7 個工作天內會送達您的指定地址（不含假日）。若遇活動檔期或物流繁忙，可能會稍有延遲。'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="hidden md:flex flex-col gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <h1 className="flex items-baseline gap-4 text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              常見問題
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                <span className="font-amount">{faqs.reduce((acc, curr) => acc + curr.items.length, 0)}</span> 個問題
              </span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* FAQ Section */}
          <div className="space-y-6 mb-12">
            
            <div className="space-y-8">
            {faqs.map((section, sIndex) => (
              <div key={sIndex} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                  <h2 className="text-lg font-bold text-neutral-800">{section.category}</h2>
                </div>
                <div className="divide-y divide-neutral-100">
                  {section.items.map((item, iIndex) => {
                    const globalIndex = sIndex * 100 + iIndex;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <div key={iIndex} className="bg-white">
                        <button
                          onClick={() => toggleFAQ(globalIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
                        >
                          <span className="font-medium text-neutral-900 pr-8">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-neutral-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />
                          )}
                        </button>
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          )}
                        >
                          <div className="px-6 pb-4 text-neutral-600 leading-relaxed">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section - Moved to Bottom */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-8 text-center">聯絡我們</h2>
          <p className="text-neutral-500 text-center mb-8 -mt-4">
            若您有任何問題，歡迎透過以下管道聯繫我們，我們將於服務時間內盡快為您處理。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">服務時間</h3>
                <p className="text-sm text-neutral-600 mt-1">週一至週五</p>
                <p className="text-sm text-neutral-600">10:00 - 18:00 (例假日暫停)</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">客服專線</h3>
                <p className="text-sm text-neutral-600 mt-1">02-1234-5678</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">電子信箱</h3>
                <a href="mailto:service@slimetoy.com.tw" className="text-sm text-primary hover:underline mt-1 block">
                  service@slimetoy.com.tw
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">官方 LINE</h3>
                <p className="text-sm text-neutral-600 mt-1">@slimetoy</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
