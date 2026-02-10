'use client'

import { AdminLayout } from '@/components'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { generateTXID, calculateTXIDHash, generateRandomValue, determinePrize } from '@/utils/drawLogicClient'

type DbProduct = Database['public']['Tables']['products']['Row']
type DbPrize = Database['public']['Tables']['product_prizes']['Row']
type DbDrawRecord = Database['public']['Tables']['draw_records']['Row'] & {
  product_prizes: DbPrize | null
}

interface ProductWithPrizes extends DbProduct {
  prizes: DbPrize[]
}

interface DrawRecord {
  nonce: number
  drawId: string
  prize: string
  ticketNumber: number
  txidHash?: string
  profitRate?: number
}

// 計算調整後的獎項機率（用於驗證）
function calculateAdjustedPrizes(product: ProductWithPrizes, profitRate: number) {
  const majorPrizeLevels = product.major_prizes || ['A賞']
  const majorPrizes = product.prizes.filter(p => majorPrizeLevels.includes(p.level))
  const minorPrizes = product.prizes.filter(p => !majorPrizeLevels.includes(p.level))
  
  const majorOriginalTotal = majorPrizes.reduce((sum, p) => sum + (p.probability || 0), 0)
  const minorOriginalTotal = minorPrizes.reduce((sum, p) => sum + (p.probability || 0), 0)
  
  const majorAdjustedTotal = majorOriginalTotal * profitRate
  const minorAdjustedTotal = Math.max(0, 100 - majorAdjustedTotal)
  
  const minorAdjustmentFactor = minorOriginalTotal > 0 
    ? minorAdjustedTotal / minorOriginalTotal 
    : 1.0
  
  return product.prizes.map(prize => {
    const isMajor = majorPrizeLevels.includes(prize.level)
    const currentProb = prize.probability || 0
    const adjustedProbability = isMajor 
      ? currentProb * profitRate
      : currentProb * minorAdjustmentFactor
    
    return {
      level: prize.level,
      name: prize.name,
      probability: currentProb,
      adjustedProbability
    }
  })
}

export default function ProductVerifyPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  
  const [product, setProduct] = useState<ProductWithPrizes | null>(null)
  const [draws, setDraws] = useState<DrawRecord[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [hashMatch, setHashMatch] = useState<boolean | null>(null)
  const [verificationResult, setVerificationResult] = useState<string>('')
  const [verificationResults, setVerificationResults] = useState<Array<{
    nonce: number
    drawId: string
    actualPrize: string
    calculatedPrize: string
    match: boolean
    randomValue: number
  }>>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return

      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
        
        if (productError) throw productError

        // Fetch prizes
        const { data: prizesData, error: prizesError } = await supabase
          .from('product_prizes')
          .select('*')
          .eq('product_id', productId)
          .order('level', { ascending: true }) // Sort by level

        if (prizesError) throw prizesError

        const fullProduct: ProductWithPrizes = {
          ...productData,
          prizes: prizesData || []
        }
        setProduct(fullProduct)

        // Fetch draw records
        const { data: historyData, error: historyError } = await supabase
          .from('draw_records')
          .select('*, product_prizes(*)')
          .eq('product_id', productId)
          .order('created_at', { ascending: true })

        if (historyError) throw historyError

        const mappedDraws: DrawRecord[] = (historyData as any[]).map((d: any) => ({
          nonce: d.ticket_number || 0,
          drawId: d.id.toString(),
          prize: d.product_prizes ? `${d.product_prizes.level} ${d.product_prizes.name}` : (d.prize_level || 'Unknown'),
          ticketNumber: d.ticket_number || 0,
          txidHash: undefined, // Draw records doesn't store txidHash currently
          profitRate: 1.0 // Default to 1.0
        }))

        setDraws(mappedDraws)

      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [productId, supabase])

  // 生成驗證程式碼
  useEffect(() => {
    if (!product || !product.txid_hash) return
    
    const seed = getProductSeed(product)
    if (!seed) return

    const code = `// 公平性驗證程式碼
// 請填入本平台提供的 Seed 值並填入在單引號內
const seed = '${seed}';

// 總共幾個大賞
const majorPrizeCount = ${product.prizes.filter(p => (product.major_prizes || ['A賞']).includes(p.level)).length};

// 總共幾個籤數（總抽獎次數）
const totalDraws = ${draws.length};

// 商品總數
const totalCount = ${product.total_count};

// 大獎等級列表
const majorPrizeLevels = ${JSON.stringify(product.major_prizes || ['A賞'])};

// 獎項列表（包含機率）
const prizes = ${JSON.stringify(product.prizes.map(p => ({
  level: p.level,
  name: p.name,
  probability: p.probability,
  total: p.total
})))};

// 驗證函數
async function verifyDraws() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API 不可用');
  }

  const results = [];
  
  // 對每個抽獎進行驗證
  for (let nonce = 1; nonce <= totalDraws; nonce++) {
    // 生成 TXID
    const txid = { seed, nonce };
    
    // 計算隨機數
    const encoder = new TextEncoder();
    const keyData = encoder.encode(seed);
    const messageData = encoder.encode(nonce.toString());
    
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hexValue = hashHex.substring(0, 16);
    const decimalValue = parseInt(hexValue, 16);
    const maxHexValue = parseInt('ffffffffffffffff', 16);
    const randomValue = decimalValue / maxHexValue;
    
    // 根據機率決定獎項
    let cumulativeProbability = 0;
    let selectedPrize = null;
    for (const prize of prizes) {
      cumulativeProbability += prize.probability / 100;
      if (randomValue <= cumulativeProbability) {
        selectedPrize = prize;
        break;
      }
    }
    
    results.push({
      nonce,
      randomValue,
      prize: selectedPrize ? \`\${selectedPrize.level} \${selectedPrize.name}\` : '未知'
    });
  }
  
  return results;
}

// 執行驗證
verifyDraws().then(results => {
  console.log('驗證結果:', results);
  // 這裡可以比對實際抽獎記錄
}).catch(err => {
  console.error('驗證失敗:', err);
});`

    setVerificationCode(code)
  }, [product, draws])

  // 獲取商品的 Seed
  const getProductSeed = (product: ProductWithPrizes): string | null => {
    if (product.seed) {
      return product.seed
    }
    return null
  }

  // 驗證 TXID Hash 與 TXID 是否一致
  const handleVerifyHash = async () => {
    if (!product) {
      alert('商品資料不完整，無法驗證')
      return
    }

    const seed = getProductSeed(product)
    if (!seed) {
      alert('無法獲取 Seed，無法驗證。請確保商品已完抽或使用測試模式。')
      return
    }

    // 使用 nonce=1 的 txidHash 進行驗證 (對應 product.txid_hash)
    const expectedHash = product.txid_hash
    
    if (!expectedHash) {
      alert('沒有可用的 TXID Hash 進行驗證')
      return
    }

    try {
      // 驗證 nonce=1 的 hash
      const nonce = 1
      const txid = generateTXID(seed, nonce)
      const calculatedHash = await calculateTXIDHash(txid)
      const match = calculatedHash === expectedHash
      
      setHashMatch(match)
      setVerificationResult(match 
        ? '✓ 驗證成功：TXID Hash 與 TXID 一致，抽獎結果公平可信'
        : '✗ 驗證失敗：TXID Hash 與 TXID 不一致，請檢查資料')
    } catch (error) {
      console.error('驗證錯誤:', error)
      alert('驗證失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    }
  }

  // 驗證所有抽獎記錄
  const handleVerifyAllDraws = async () => {
    if (!product || draws.length ===0) {
      alert('沒有抽獎記錄可驗證')
      return
    }

    const seed = getProductSeed(product)
    if (!seed) {
      alert('無法獲取 Seed，無法驗證。請確保商品已完抽或使用測試模式。')
      return
    }

    setIsVerifying(true)
    const results: Array<{
      nonce: number
      drawId: string
      actualPrize: string
      calculatedPrize: string
      match: boolean
      randomValue: number
    }> = []

    try {
      // 追蹤每個獎項的已生成數量
      const prizeCounts: { [level: string]: number } = {}
      product.prizes.forEach(prize => {
        prizeCounts[prize.level] = 0
      })
      
      const sortedDraws = [...draws].sort((a, b) => a.nonce - b.nonce)
      
      for (const draw of sortedDraws) {
        try {
          const profitRate = draw.profitRate ?? 1.0
          const adjustedPrizes = calculateAdjustedPrizes(product, profitRate)
          
          const availablePrizes = adjustedPrizes.filter(prize => {
            const targetCount = product.prizes.find(p => p.level === prize.level)?.total || 0
            const currentCount = prizeCounts[prize.level] || 0
            return currentCount < targetCount
          })
          
          const prizesToUse = availablePrizes.length > 0 ? availablePrizes : adjustedPrizes
          
          const totalProbability = prizesToUse.reduce((sum, p) => sum + p.adjustedProbability, 0)
          const normalizedPrizes = prizesToUse.map(p => ({
            level: p.level,
            name: p.name,
            probability: totalProbability > 0 ? (p.adjustedProbability / totalProbability) * 100 : 0
          }))
          
          const nonce = draw.nonce
          const txid = generateTXID(seed, nonce)
          const randomValue = await generateRandomValue(txid)
          
          const calculatedPrize = determinePrize(randomValue, normalizedPrizes)
          const calculatedPrizeStr = `${calculatedPrize.level} ${calculatedPrize.name}`
          
          const actualPrizeLevel = draw.prize.split(' ')[0]
          prizeCounts[actualPrizeLevel] = (prizeCounts[actualPrizeLevel] || 0) + 1
          
          const match = actualPrizeLevel === calculatedPrize.level

          results.push({
            nonce: nonce,
            drawId: draw.drawId,
            actualPrize: draw.prize,
            calculatedPrize: calculatedPrizeStr,
            match,
            randomValue
          })
        } catch (error) {
          console.error(`驗證抽獎 ${draw.drawId} 失敗:`, error)
        }
      }

      setVerificationResults(results)
      if (results.length > 0) {
        setIsResultsModalOpen(true)
      }
    } catch (error) {
      console.error('驗證錯誤:', error)
      alert('驗證失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsVerifying(false)
    }
  }

  if (!product) {
    return (
      <AdminLayout 
        pageTitle="公平性驗證"
        breadcrumbs={[
          { label: '商品管理', href: '/products' },
          { label: '公平性驗證', href: undefined }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">載入中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      pageTitle="公平性驗證"
      breadcrumbs={[
        { label: '商品管理', href: '/products' },
        { label: product.name, href: `/products/${product.id}` },
        { label: '公平性驗證', href: undefined }
      ]}
    >
      <div className="space-y-6">
        {/* 商品資訊 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">{product.name}</h2>
          <div className="text-sm text-gray-600">
            <p>商品編號：{product.product_code}</p>
            <p>狀態：{product.status === 'ended' ? '已完抽' : product.status === 'active' ? '進行中' : '待上架'}</p>
            {product.ended_at && <p>結束時間：{product.ended_at}</p>}
          </div>
        </div>

        {/* 公平性驗證工具 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">公平性驗證</h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            請輸入抽獎相關參數進行公平性驗證，確保抽獎結果的透明度和公正性。
          </p>

          {/* 第三方驗證工具 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              第三方驗證工具：
            </label>
            <a
              href="https://emn178.github.io/online-tools/sha256.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              前往 SHA256 哈希驗證工具
            </a>
            <p className="text-xs text-gray-600 mt-2">
              可使用此工具驗證 TXID 與 TXID Hash 是否一致，確保抽獎結果的公平性（TXID 會在抽獎結束後公開）
            </p>
          </div>

          {/* 隨機種子 (TXID) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              隨機種子 (TXID)
            </label>
            {(() => {
              const seed = getProductSeed(product)
              if (seed) {
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-amount text-gray-700 break-all">
                      {seed}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(seed)
                          alert('Seed 已複製到剪貼板')
                        } catch (e) {
                          console.error('複製失敗:', e)
                        }
                      }}
                      className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      複製
                    </button>
                  </div>
                )
              } else {
                return (
                  <div className="px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-500">
                    完抽後公布
                  </div>
                )
              }
            })()}
          </div>

          {/* 隨機種子哈希值 (TXID Hash) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              隨機種子哈希值 (TXID Hash)
            </label>
            {product.txid_hash ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-amount text-gray-700 break-all">
                  {product.txid_hash}
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(product.txid_hash || '')
                      alert('TXID Hash 已複製到剪貼板')
                    } catch (e) {
                      console.error('複製失敗:', e)
                    }
                  }}
                  className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  複製
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-500">
                尚未生成（當商品上架且開賣時自動生成）
              </div>
            )}
          </div>

          {/* 驗證按鈕 */}
          {product.txid_hash && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerifyHash}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:opacity-60 disabled:transition-none"
                  disabled={product.status === 'active' || (!product.seed && product.status !== 'ended')}
                >
                  驗證 TXID Hash
                </button>
                <button
                  onClick={handleVerifyAllDraws}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:opacity-60 disabled:transition-none"
                  disabled={isVerifying || !product.seed}
                >
                  {isVerifying ? '驗證中...' : '驗證所有抽獎記錄'}
                </button>
              </div>
              
              {verificationResult && (
                <div className={`p-4 rounded-lg text-sm font-medium ${
                  hashMatch ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {verificationResult}
                </div>
              )}
            </div>
          )}

          {/* 驗證程式碼展示 */}
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">驗證程式碼</h3>
            <p className="text-sm text-gray-600 mb-4">
              以下是驗證抽獎公平性的 JavaScript 程式碼。您可以複製此程式碼並在瀏覽器的開發者工具 (Console) 中執行，自行驗證抽獎結果。
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-amount overflow-x-auto h-64">
                {verificationCode || '// 等待資料載入...'}
              </pre>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(verificationCode)
                    alert('程式碼已複製到剪貼板')
                  } catch (e) {
                    console.error('複製失敗:', e)
                  }
                }}
                className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs"
              >
                複製程式碼
              </button>
            </div>
          </div>
        </div>

        {/* 驗證結果彈窗 */}
        {isResultsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">抽獎驗證結果</h3>
                <button 
                  onClick={() => setIsResultsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">驗證成功: {verificationResults.filter(r => r.match).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">驗證失敗: {verificationResults.filter(r => !r.match).length}</span>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3">籤號 (Nonce)</th>
                        <th className="px-4 py-3">實際結果</th>
                        <th className="px-4 py-3">計算結果</th>
                        <th className="px-4 py-3">隨機數值</th>
                        <th className="px-4 py-3 text-center">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {verificationResults.map((result) => (
                        <tr key={result.nonce} className={result.match ? 'bg-white' : 'bg-red-50'}>
                          <td className="px-4 py-3 font-amount">{result.nonce}</td>
                          <td className="px-4 py-3">{result.actualPrize}</td>
                          <td className="px-4 py-3">{result.calculatedPrize}</td>
                          <td className="px-4 py-3 font-amount text-xs text-gray-500">{result.randomValue.toFixed(8)}</td>
                          <td className="px-4 py-3 text-center">
                            {result.match ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                通過
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                失敗
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setIsResultsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium shadow-sm"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
