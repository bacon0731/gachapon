'use client'

import { useState } from 'react'

interface ProvablyFairSectionProps {
  productId: string
  txidHash?: string
  isCompleted?: boolean
}

export default function ProvablyFairSection({
  productId,
  txidHash,
  isCompleted = false,
}: ProvablyFairSectionProps) {
  const [copied, setCopied] = useState(false)
  
  // 如果沒有提供，生成一個範例哈希值
  const defaultHash = 'c7111dd84fdbab6ca6bfa34f02fe6e0de92da811039401d1fdfb9a4bd36ab942'
  const hashValue = txidHash || defaultHash

  // 第三方驗證工具連結（可以替換為實際的驗證工具網址）
  const verificationToolUrl = 'https://emn178.github.io/online-tools/sha256.html'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hashValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('複製失敗:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-100">
      {/* 標題區域 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">公平性驗證</h2>
          <p className="text-xs text-neutral-500 mt-0.5">確保抽獎過程的透明與公正</p>
        </div>
      </div>

      {/* 第三方驗證工具 */}
      <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2 mb-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900 mb-1">第三方驗證工具</div>
            <a
              href={verificationToolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors group"
            >
              SHA256 哈希驗證工具
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed ml-6">
          此工具可驗證 TXID 與 TXID Hash 的一致性，確保公平性，TXID 將於完抽後公布。
        </p>
      </div>

      {/* 隨機種子 (TXID) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <label className="text-sm font-semibold text-neutral-700">隨機種子 (TXID)</label>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-700">已公布</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-neutral-500">完抽後公布</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 隨機種子哈希值 (TXID Hash) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <label className="text-sm font-semibold text-neutral-700">隨機種子哈希值 (TXID Hash)</label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-50 border border-neutral-200 px-4 py-3 rounded-lg">
            <code className="text-xs font-mono text-neutral-800 break-all block">
              {hashValue}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className={`px-3 py-3 rounded-lg transition-all flex-shrink-0 ${
              copied
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
            title={copied ? '已複製' : '複製'}
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        {copied && (
          <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            已複製到剪貼簿
          </div>
        )}
      </div>
    </div>
  )
}
