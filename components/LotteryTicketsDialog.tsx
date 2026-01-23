'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Alert from './Alert'
import { getPrizeLevelColor } from '@/utils/prizeColors'

interface Prize {
  id: string
  name: string
  image: string
  level: string
}

interface LotteryTicketsDialogProps {
  isOpen: boolean
  onClose: () => void
  quantity: number
  prizes: any[]
  onComplete: (results: Prize[]) => void
}

type TicketState = 'ticket' | 'loading' | 'revealed'

interface Ticket {
  id: number
  state: TicketState
  prize?: Prize
}

export default function LotteryTicketsDialog({
  isOpen,
  onClose,
  quantity,
  prizes,
  onComplete,
}: LotteryTicketsDialogProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allRevealed, setAllRevealed] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // 初始化抽獎券
  useEffect(() => {
    if (isOpen && quantity > 0 && (!tickets || tickets.length === 0)) {
      const initialTickets: Ticket[] = Array.from({ length: quantity }, (_, i) => ({
        id: i,
        state: 'ticket',
      }))
      setTickets(initialTickets)
      setAllRevealed(false)
    }
  }, [isOpen, quantity])

  // 當對話框關閉時重置狀態
  useEffect(() => {
    if (!isOpen) {
      setTickets([])
      setAllRevealed(false)
    }
  }, [isOpen])

  // 生成獎品結果
  const generatePrize = (): Prize => {
    const availablePrizes = prizes?.filter((p: any) => p.remaining > 0) || []
    
    if (availablePrizes.length === 0) {
      const allPrizes = prizes || []
      const randomIndex = Math.floor(Math.random() * allPrizes.length)
      const selectedPrize = allPrizes[randomIndex] || {}
      return {
        id: selectedPrize.id || 'unknown',
        name: selectedPrize.name || '未知獎品',
        image: '/item.png',
        level: selectedPrize.level || '未知等級',
      }
    }
    
    const randomIndex = Math.floor(Math.random() * availablePrizes.length)
    const selectedPrize = availablePrizes[randomIndex]
    return {
      id: selectedPrize.id || 'unknown',
      name: selectedPrize.name || '未知獎品',
      image: '/item.png',
      level: selectedPrize.level || '未知等級',
    }
  }

  const handleTicketClick = (ticketId: number) => {
    if (!tickets || tickets.length === 0) return
    
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.state !== 'ticket') return

    // 設置為 loading
    setTickets((prev) => {
      if (!prev || prev.length === 0) return prev
      return prev.map((t) => (t.id === ticketId ? { ...t, state: 'loading' } : t))
    })

    // 生成獎品
    const prize = generatePrize()

    // 延遲後顯示結果
    setTimeout(() => {
      setTickets((prev) => {
        if (!prev || prev.length === 0) return prev
        
        const updated = prev.map((t) =>
          t.id === ticketId ? { ...t, state: 'revealed', prize } : t
        )
        
        // 檢查是否全部揭曉
        const allRevealed = updated.every((t) => t.state === 'revealed')
        if (allRevealed) {
          setAllRevealed(true)
          // 通知父組件所有結果
          const results = updated.map((t) => t.prize!).filter(Boolean)
          setTimeout(() => {
            onComplete(results)
          }, 500)
        }
        
        return updated
      })
    }, 1000)
  }

  const handleRevealAll = () => {
    if (!tickets || tickets.length === 0) return
    
    const unrevealed = tickets.filter((t) => t.state === 'ticket')
    if (unrevealed.length === 0) return

    // 設置所有未揭曉的為 loading
    const updated = tickets.map((t) =>
      t.state === 'ticket' ? { ...t, state: 'loading' } : t
    )
    setTickets(updated)

    // 延遲後顯示所有結果
    setTimeout(() => {
      setTickets((prev) => {
        if (!prev || prev.length === 0) return prev
        
        const final = prev.map((t) => {
          if (t.state === 'loading') {
            return { ...t, state: 'revealed', prize: generatePrize() }
          }
          return t
        })
        
        setAllRevealed(true)
        const results = final.map((t) => t.prize!).filter(Boolean)
        setTimeout(() => {
          onComplete(results)
        }, 500)
        
        return final
      })
    }, 1000)
  }

  const handleClose = () => {
    // 如果確認對話框正在顯示，不處理關閉
    if (showConfirmDialog) return
    
    // 檢查是否有未揭曉的抽獎券
    const hasUnrevealed = tickets && tickets.length > 0 && tickets.some((t) => t.state === 'ticket')
    
    if (hasUnrevealed) {
      // 如果有未揭曉的，顯示確認對話框
      setShowConfirmDialog(true)
    } else {
      // 如果全部已揭曉，直接傳遞結果並關閉
      if (tickets && tickets.length > 0) {
        const results = tickets.map((t) => t.prize!).filter(Boolean)
        if (results.length > 0) {
          onComplete(results)
        }
      }
      onClose()
    }
  }

  const handleConfirmSkip = () => {
    // 確認略過動畫，立即開獎
    if (tickets && tickets.length > 0) {
      const allResults: Prize[] = []
      tickets.forEach((ticket) => {
        if (ticket.state === 'ticket') {
          allResults.push(generatePrize())
        } else if (ticket.state === 'revealed' && ticket.prize) {
          allResults.push(ticket.prize)
        }
      })
      // 通知父組件所有結果
      onComplete(allResults)
    }
    setShowConfirmDialog(false)
    onClose()
  }

  const handleCancelSkip = () => {
    // 取消，關閉確認對話框，回到抽獎券彈窗
    setShowConfirmDialog(false)
  }

  if (!isOpen) return null

  const hasUnrevealedTickets = tickets && tickets.length > 0 && tickets.some((t) => t.state === 'ticket')

  return (
    <>
      {/* 確認略過動畫對話框 */}
      <Alert
        isOpen={showConfirmDialog}
        onClose={handleCancelSkip}
        title="略過動畫"
        message="是否略過動畫並立即開獎？未揭曉的抽獎券將自動開獎至個人倉庫。"
        type="info"
        confirmText="確定"
        onConfirm={handleConfirmSkip}
        showCancel={true}
        cancelText="取消"
        zIndex={60}
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* 對話框內容 */}
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題區域 */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold text-neutral-900">抽獎券</h3>
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="關閉"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 抽獎券列表 */}
          <div className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {tickets && tickets.length > 0 ? tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col items-center w-[calc(20%-1rem)] min-w-[140px] max-w-[180px]"
                >
                  {ticket.state === 'ticket' && (
                    <button
                      onClick={() => handleTicketClick(ticket.id)}
                      className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border-2 border-primary/30 hover:border-primary transition-all hover:shadow-lg cursor-pointer flex items-center justify-center group"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎫</div>
                        <div className="text-sm font-semibold text-primary">點擊揭曉</div>
                      </div>
                    </button>
                  )}

                  {ticket.state === 'loading' && (
                    <div className="relative w-full aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}

                  {ticket.state === 'revealed' && ticket.prize && (
                    <div className="w-full">
                      {/* 獎品圖片 */}
                      <div className="relative w-full aspect-square mb-3 bg-neutral-100 rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={ticket.prize.image || '/item.png'}
                          alt={ticket.prize.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* 獎品等級 */}
                      {ticket.prize.level && (() => {
                        const colors = getPrizeLevelColor(ticket.prize.level)
                        return (
                          <div className="mb-1 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {ticket.prize.level}
                            </span>
                          </div>
                        )
                      })()}
                      {/* 獎品名稱 */}
                      <div className="text-sm text-neutral-700 text-center line-clamp-2 leading-tight">{ticket.prize.name}</div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="w-full text-center py-8 text-neutral-500">
                  載入中...
                </div>
              )}
            </div>
          </div>

          {/* 提示文字 */}
          {hasUnrevealedTickets && (
            <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
              <p className="text-sm text-yellow-800 text-center">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  不小心關閉此頁面將自動開獎至個人倉庫
                </span>
              </p>
            </div>
          )}

          {/* 按鈕區域 */}
          <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-center items-center gap-3">
            {hasUnrevealedTickets && (
              <button
                onClick={handleRevealAll}
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow-md"
              >
                全部撕開
              </button>
            )}
            {allRevealed && (
              <Link
                href="/warehouse"
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow-md"
              >
                查看我的倉庫
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
