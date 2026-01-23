/**
 * 獲取獎項等級的顏色樣式
 * @param level 獎項等級（如 'A賞', 'B賞' 等）
 * @returns Tailwind CSS 類名字符串
 */
export function getPrizeLevelColor(level: string): {
  bg: string
  text: string
  border: string
} {
  switch (level) {
    case 'A賞':
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        text: 'text-white',
        border: 'border-yellow-500',
      }
    case 'B賞':
      return {
        bg: 'bg-gradient-to-r from-purple-400 to-purple-600',
        text: 'text-white',
        border: 'border-purple-500',
      }
    case 'C賞':
      return {
        bg: 'bg-gradient-to-r from-blue-400 to-blue-600',
        text: 'text-white',
        border: 'border-blue-500',
      }
    case 'D賞':
      return {
        bg: 'bg-gradient-to-r from-green-400 to-green-600',
        text: 'text-white',
        border: 'border-green-500',
      }
    case 'E賞':
      return {
        bg: 'bg-gradient-to-r from-slate-700 to-slate-900',
        text: 'text-white',
        border: 'border-slate-800',
      }
    case 'F賞':
      return {
        bg: 'bg-gradient-to-r from-orange-400 to-orange-600',
        text: 'text-white',
        border: 'border-orange-500',
      }
    case 'G賞':
      return {
        bg: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
        text: 'text-white',
        border: 'border-cyan-500',
      }
    case 'H賞':
      return {
        bg: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
        text: 'text-white',
        border: 'border-indigo-500',
      }
    case '最後賞':
      return {
        bg: 'bg-gradient-to-r from-red-500 to-red-700',
        text: 'text-white',
        border: 'border-red-600',
      }
    default:
      return {
        bg: 'bg-gradient-to-r from-neutral-400 to-neutral-600',
        text: 'text-white',
        border: 'border-neutral-500',
      }
  }
}

/**
 * 獲取獎項等級的簡化顏色樣式（用於標籤）
 * @param level 獎項等級
 * @returns Tailwind CSS 類名字符串
 */
export function getPrizeLevelBadgeColor(level: string): string {
  const colors = getPrizeLevelColor(level)
  return `${colors.bg} ${colors.text} ${colors.border}`
}
