/**
 * 殺率調整工具函數
 * 用於獲取調整後的顯示機率（會員在前台看到的機率）
 */

interface AdjustedRates {
  [productId: number]: {
    [prizeLevel: string]: number
  }
}

/**
 * 獲取調整後的機率（用於前端顯示）
 * 如果沒有調整，則返回原始機率
 * 
 * @param productId 商品ID
 * @param prizeLevel 賞項等級
 * @param originalProbability 原始機率
 * @returns 調整後的機率（如果沒有調整則返回原始機率）
 */
export function getDisplayProbability(
  productId: number,
  prizeLevel: string,
  originalProbability: number
): number {
  if (typeof window === 'undefined') {
    // SSR 環境下返回原始機率
    return originalProbability
  }

  try {
    const saved = localStorage.getItem('adjustedRates')
    if (saved) {
      const adjustedRates: AdjustedRates = JSON.parse(saved)
      const adjustedRate = adjustedRates[productId]?.[prizeLevel]
      
      // 如果有調整，返回調整後的機率；否則返回原始機率
      return adjustedRate !== undefined ? adjustedRate : originalProbability
    }
  } catch (e) {
    console.error('Failed to parse adjusted rates:', e)
  }

  return originalProbability
}

/**
 * 獲取所有調整後的機率
 * @returns 調整後的機率映射表
 */
export function getAllAdjustedRates(): AdjustedRates {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const saved = localStorage.getItem('adjustedRates')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to parse adjusted rates:', e)
  }

  return {}
}

/**
 * 檢查是否有調整過的機率
 * @param productId 商品ID
 * @returns 是否有調整
 */
export function hasAdjustedRates(productId?: number): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const saved = localStorage.getItem('adjustedRates')
    if (saved) {
      const adjustedRates: AdjustedRates = JSON.parse(saved)
      if (productId !== undefined) {
        return !!adjustedRates[productId] && Object.keys(adjustedRates[productId]).length > 0
      }
      return Object.keys(adjustedRates).length > 0
    }
  } catch (e) {
    console.error('Failed to parse adjusted rates:', e)
  }

  return false
}
