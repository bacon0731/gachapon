/**
 * 殺率計算工具
 * 根據已使用的籤號數量計算當前殺率，確保與籤號選擇順序無關
 */

/**
 * 從 localStorage 讀取商品的殺率設定
 * @param productId 商品ID
 * @returns 殺率值（默認 1.0）
 */
export function getProductProfitRate(productId: number): number {
  if (typeof window === 'undefined') {
    return 1.0
  }
  
  try {
    const saved = localStorage.getItem('profitRates')
    if (saved) {
      const profitRates: { [productId: number]: number } = JSON.parse(saved)
      return profitRates[productId] ?? 1.0
    }
  } catch (e) {
    console.error('讀取殺率設定失敗:', e)
  }
  
  return 1.0
}

/**
 * 根據已使用的籤號數量計算當前殺率
 * 這個函數可以根據業務需求調整殺率計算邏輯
 * 例如：當已使用籤號達到一定數量時，調整殺率以防止廢套
 * 
 * @param productId 商品ID
 * @param usedTicketCount 已使用的籤號數量
 * @param totalTicketCount 總籤號數量
 * @returns 當前殺率值
 */
export function calculateCurrentProfitRate(
  productId: number,
  usedTicketCount: number,
  totalTicketCount: number
): number {
  // 獲取基礎殺率設定
  const baseProfitRate = getProductProfitRate(productId)
  
  // 計算已使用比例
  const usedRatio = usedTicketCount / totalTicketCount
  
  // 這裡可以根據業務需求調整殺率計算邏輯
  // 例如：當已使用比例達到 50% 時，提高殺率以防止廢套
  // 當已使用比例達到 80% 時，進一步提高殺率
  
  let adjustedRate = baseProfitRate
  
  // 示例邏輯：根據已使用比例動態調整
  if (usedRatio >= 0.8) {
    // 已使用 80% 以上，提高殺率 20%
    adjustedRate = baseProfitRate * 1.2
  } else if (usedRatio >= 0.5) {
    // 已使用 50% 以上，提高殺率 10%
    adjustedRate = baseProfitRate * 1.1
  }
  
  return adjustedRate
}
