'use client'

import AdminLayout from '@/components/AdminLayout'
import Modal from '@/components/Modal'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatDateTime } from '@/utils/dateFormat'

// Define interfaces for local state
interface User {
  id: number
  userId: string
  name: string
  email: string
  password: string
  phone: string
  tokens: number
  registerDate: string
  lastLoginDate: string
  status: 'active' | 'inactive'
  totalOrders: number
  totalSpent: number
  totalDraws: number
  address?: string
  recipientName?: string
  recipientPhone?: string
}

interface OrderItem {
  id: number
  product_name: string
  prize_name: string
  prize_level: string
  quantity: number
  product_id: number
}

interface Order {
  id: number
  orderId: string
  status: string
  submittedAt: string
  items: OrderItem[]
  date: string // fallback for sort
}

interface Draw {
  id: number
  drawId: string
  date: string
  product: string
  prize: string
  amount: number
  ticketNumber: number
  product_id: number
}

interface Recharge {
  id: number
  orderId: string
  amount: number
  bonus: number
  totalTokens: number
  tokenDenomination: number
  status: string
  time: string
}

interface WarehouseItem {
  id: number
  product: string
  prize: string
  drawDate: string
  count: number
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('active')
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'orders' | 'draws' | 'recharges' | 'warehouse'>('orders')

  // Data states
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [userDraws, setUserDraws] = useState<Draw[]>([])
  const [userRecharges, setUserRecharges] = useState<Recharge[]>([])
  const [userWarehouse, setUserWarehouse] = useState<WarehouseItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Fetch User
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, orders(count)')
          .eq('id', userId)
          .single()

        if (userError || !userData) {
          console.error('Error fetching user:', userError)
          setLoading(false)
          return
        }

        const mappedUser: User = {
          id: userData.id,
          userId: userData.user_id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          tokens: userData.tokens,
          registerDate: formatDateTime(userData.created_at),
          lastLoginDate: userData.last_login_at ? formatDateTime(userData.last_login_at) : '',
          status: userData.status,
          totalOrders: userData.orders?.[0]?.count || 0,
          totalSpent: userData.total_spent,
          totalDraws: userData.total_draws,
          address: userData.address,
          recipientName: userData.recipient_name,
          recipientPhone: userData.recipient_phone
        }
        setUser(mappedUser)
        setUserStatus(mappedUser.status)

        // 2. Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items (
              id,
              product_name,
              prize_name,
              prize_level,
              quantity,
              product_id
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        let mappedOrders: Order[] = []
        if (ordersData) {
          mappedOrders = ordersData.map((o: any) => ({
            id: o.id,
            orderId: o.order_number,
            status: o.status,
            submittedAt: formatDateTime(o.submitted_at || o.created_at),
            date: o.created_at,
            items: o.items || []
          }))
          setUserOrders(mappedOrders)
        }

        // 3. Fetch Draws
        const { data: drawsData, error: drawsError } = await supabase
          .from('draw_records')
          .select(`
            *,
            product:products (name, price, product_code)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        let mappedDraws: Draw[] = []
        if (drawsData) {
          mappedDraws = drawsData.map((d: any) => ({
            id: d.id,
            drawId: d.id.toString(), // or construct a draw ID format
            date: formatDateTime(d.created_at),
            product: d.product?.name || 'Unknown Product',
            prize: d.prize_level,
            amount: d.product?.price || 0,
            ticketNumber: d.ticket_number,
            product_id: d.product_id
          }))
          setUserDraws(mappedDraws)
        }

        // 4. Fetch Recharges
        const { data: rechargesData, error: rechargesError } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (rechargesData) {
          const statusMap: Record<string, string> = {
            'success': '成功',
            'pending': '處理中',
            'failed': '失敗'
          }
          
          const mappedRecharges: Recharge[] = rechargesData.map((r: any) => ({
            id: r.id,
            orderId: r.order_number,
            amount: r.amount,
            bonus: r.bonus || 0,
            totalTokens: r.amount + (r.bonus || 0), // Assuming 1:1 + bonus
            tokenDenomination: r.amount,
            status: statusMap[r.status] || r.status,
            time: formatDateTime(r.created_at)
          }))
          setUserRecharges(mappedRecharges)
        }

        // 5. Calculate Warehouse (Unclaimed Prizes)
        // Count submitted items
        const submittedItemsCount = new Map<string, number>()
        mappedOrders.forEach(order => {
          if (['submitted', 'processing', 'picked_up', 'shipping', 'delivered'].includes(order.status)) {
            order.items.forEach(item => {
              // Key: product_id-prize_level. Fallback to name if id missing (legacy compat)
              const key = item.product_id ? `${item.product_id}-${item.prize_level}` : `${item.product_name}-${item.prize_level}`
              submittedItemsCount.set(key, (submittedItemsCount.get(key) || 0) + (item.quantity || 1))
            })
          }
        })

        // Count owned items from draws
        const drawItemsMap = new Map<string, { product: string, prize: string, drawDate: string, count: number }>()
        
        // We use the raw drawsData for accurate timestamp comparison if needed, but mappedDraws is fine
        // Using mappedDraws which has formatted date string, might need raw date for sort. 
        // Let's use the index or just formatted date string for now.
        
        mappedDraws.forEach(draw => {
          const key = draw.product_id ? `${draw.product_id}-${draw.prize}` : `${draw.product}-${draw.prize}`
          
          if (!drawItemsMap.has(key)) {
            drawItemsMap.set(key, {
              product: draw.product,
              prize: draw.prize,
              drawDate: draw.date,
              count: 0
            })
          }
          const item = drawItemsMap.get(key)!
          item.count += 1
          // Keep the latest date
          if (draw.date > item.drawDate) { 
             // Note: String comparison of formatted dates might be wrong if format is not ISO.
             // formatDateTime usually returns readable string. 
             // Ideally we should use raw timestamp. But for display it's ok.
             item.drawDate = draw.date 
          }
        })

        const warehouseItems: WarehouseItem[] = []
        let idCounter = 1
        
        drawItemsMap.forEach((item, key) => {
          const submitted = submittedItemsCount.get(key) || 0
          const remaining = item.count - submitted
          
          if (remaining > 0) {
            warehouseItems.push({
              id: idCounter++,
              product: item.product,
              prize: item.prize,
              drawDate: item.drawDate,
              count: remaining
            })
          }
        })

        // Sort by date desc (approximation with formatted string)
        warehouseItems.sort((a, b) => b.drawDate.localeCompare(a.drawDate))
        setUserWarehouse(warehouseItems)

      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('複製失敗:', err)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border border-green-200' 
      : 'bg-gray-100 text-gray-700 border border-gray-200'
  }

  const getStatusText = (status: string) => {
    return status === 'active' ? '啟用' : '停用'
  }

  // 更新使用者狀態
  const handleStatusUpdate = async (newStatus: 'active' | 'inactive') => {
    setUserStatus(newStatus)
    if (user) {
      setUser({ ...user, status: newStatus })
      
      try {
        const { error } = await supabase
          .from('users')
          .update({ status: newStatus })
          .eq('id', user.id)
          
        if (error) {
          console.error('Error updating status:', error)
          // Revert
          setUserStatus(user.status)
          setUser({ ...user, status: user.status })
        }
      } catch (err) {
        console.error('Error:', err)
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout 
        pageTitle="會員詳情"
        breadcrumbs={[
        { label: '會員管理', href: '/users' },
        { label: '詳情', href: undefined }
      ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout 
        pageTitle="會員詳情"
        breadcrumbs={[
          { label: '會員管理', href: '/users' },
          { label: '詳情', href: undefined }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">找不到此會員</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      pageTitle="會員詳情"
      breadcrumbs={[
          { label: '會員管理', href: '/users' },
          { label: user.userId, href: undefined }
      ]}
    >
      <div className="space-y-6">
        {/* 返回按鈕和操作按鈕 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-white border-2 border-neutral-200 rounded-full hover:border-neutral-300 transition-colors text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newStatus = userStatus === 'active' ? 'inactive' : 'active'
                if (confirm(`確定要${userStatus === 'active' ? '停用' : '啟用'}此會員嗎？`)) {
                  handleStatusUpdate(newStatus)
                }
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${
                userStatus === 'active'
                  ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:border-red-300'
                  : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300'
              }`}
            >
              {userStatus === 'active' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  停用會員
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  啟用會員
                </>
              )}
            </button>
            <button
              onClick={() => {
                setNewPassword('')
                setIsResetPasswordModalOpen(true)
              }}
              className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              重置密碼
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 會員資訊、統計資料 */}
          <div className="space-y-6">
            {/* 會員基本資訊 */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 relative">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">會員資訊</h2>
                <span className={`px-4 py-1.5 rounded-full text-base font-medium ${getStatusColor(userStatus)}`}>
                  {getStatusText(userStatus)}
                </span>
              </div>
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">{user.name}</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">用戶ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 font-mono">{user.userId}</p>
                      <button
                        onClick={() => handleCopy(user.userId, 'userId')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        title="複製"
                      >
                        {copiedField === 'userId' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">電子郵件</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 truncate" title={user.email}>{user.email}</p>
                      <button
                        onClick={() => handleCopy(user.email, 'email')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                        title="複製"
                      >
                        {copiedField === 'email' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500 mb-1">密碼</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 font-mono truncate" title={user.password}>{user.password || '-'}</p>
                      {user.password && (
                        <button
                          onClick={() => handleCopy(user.password, 'password')}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                          title="複製"
                        >
                          {copiedField === 'password' ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">電話</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 font-mono">{user.phone}</p>
                      <button
                        onClick={() => handleCopy(user.phone, 'phone')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        title="複製"
                      >
                        {copiedField === 'phone' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">註冊時間</p>
                    <p className="font-medium text-neutral-900">{user.registerDate}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">最後登入</p>
                    <p className="font-medium text-neutral-900">{user.lastLoginDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 收件資訊 */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 relative">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">收件資訊</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">收件人</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-900">{user.recipientName || '-'}</p>
                    {user.recipientName && (
                      <button
                        onClick={() => handleCopy(user.recipientName!, 'recipientName')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        title="複製"
                      >
                        {copiedField === 'recipientName' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-neutral-500 mb-1">收件人電話</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-900 font-mono">{user.recipientPhone || '-'}</p>
                    {user.recipientPhone && (
                      <button
                        onClick={() => handleCopy(user.recipientPhone!, 'recipientPhone')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        title="複製"
                      >
                        {copiedField === 'recipientPhone' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-neutral-500 mb-1">收件地址</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-900 truncate" title={user.address}>{user.address || '-'}</p>
                    {user.address && (
                      <button
                        onClick={() => handleCopy(user.address!, 'address')}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                        title="複製"
                      >
                        {copiedField === 'address' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 統計資料 */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">統計數據</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50 hover:shadow-md transition-shadow">
                  <p className="text-sm text-neutral-600 mb-2 font-medium">代幣餘額<span className="text-neutral-500">(代幣)</span></p>
                  <p className="text-2xl font-bold text-neutral-900 font-mono">{user.tokens.toLocaleString()}</p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/50 hover:shadow-md transition-shadow">
                  <p className="text-sm text-neutral-600 mb-2 font-medium">訂單數<span className="text-neutral-500">(筆)</span></p>
                  <p className="text-2xl font-bold text-neutral-900 font-mono">{userOrders.length}</p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200/50 hover:shadow-md transition-shadow">
                  <p className="text-sm text-neutral-600 mb-2 font-medium">總消費<span className="text-neutral-500">(TWD)</span></p>
                  <p className="text-2xl font-bold text-neutral-900 font-mono">{user.totalSpent.toLocaleString()}</p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/50 hover:shadow-md transition-shadow">
                  <p className="text-sm text-neutral-600 mb-2 font-medium">抽獎次數<span className="text-neutral-500">(次)</span></p>
                  <p className="text-2xl font-bold text-neutral-900 font-mono">{userDraws.length}</p>
                </div>
              </div>
            </div>

            {/* 記錄卡片（訂單、抽獎、儲值） */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              {/* Tab 切換 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 border-b border-neutral-200">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'orders'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    訂單記錄
                    {userOrders.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                        {userOrders.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('draws')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'draws'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    抽獎記錄
                    {userDraws.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                        {userDraws.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('recharges')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'recharges'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    儲值記錄
                    {userRecharges.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                        {userRecharges.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'warehouse'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    會員倉庫
                    {userWarehouse.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                        {userWarehouse.length}
                      </span>
                    )}
                  </button>
                </div>
                {activeTab !== 'warehouse' && (
                  <Link 
                    href={
                      activeTab === 'orders' ? '/orders' :
                      activeTab === 'draws' ? '/draws' :
                      '/recharges'
                    }
                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
                  >
                    查看全部
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>

              {/* 訂單記錄內容 */}
              {activeTab === 'orders' && (
                <>
                  {userOrders.length > 0 ? (
                    <div className="space-y-3">
                      {userOrders.slice(0, 30).map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 border border-neutral-200 hover:border-primary/30 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-neutral-900 font-mono">{order.orderId}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'submitted' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  order.status === 'shipping' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                  'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {order.status === 'submitted' ? '已提交' :
                                   order.status === 'delivered' ? '已送達' :
                                   order.status === 'processing' ? '處理中' :
                                   order.status === 'shipping' ? '配送中' : order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-neutral-500">
                                <span className="font-mono">{order.submittedAt}</span>
                                <span>{order.items.length} 件商品</span>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-neutral-500">暫無訂單記錄</p>
                    </div>
                  )}
                </>
              )}

              {/* 抽獎記錄內容 */}
              {activeTab === 'draws' && (
                <>
                  {userDraws.length > 0 ? (
                    <div className="space-y-3">
                      {userDraws.slice(0, 30).map((draw) => (
                        <div key={draw.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-neutral-900">{draw.product}</p>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                  {draw.prize}
                                </span>
                                {draw.ticketNumber && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 font-mono">
                                    籤號：{(draw.ticketNumber).toString().padStart(3, '0')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-neutral-500">
                                <span className="font-mono">{draw.date}</span>
                                <span className="font-mono text-neutral-700">${draw.amount}</span>
                                {draw.drawId && (
                                  <span className="font-mono text-neutral-400 text-xs">{draw.drawId}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <p className="text-neutral-500">暫無抽獎記錄</p>
                    </div>
                  )}
                </>
              )}

              {/* 儲值記錄內容 */}
              {activeTab === 'recharges' && (
                <>
                  {userRecharges.length > 0 ? (
                    <div className="space-y-3">
                      {userRecharges.slice(0, 30).map((recharge) => (
                        <div key={recharge.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-neutral-900 font-mono">{recharge.orderId}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  recharge.status === '成功' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  recharge.status === '處理中' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                  'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {recharge.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-neutral-500">
                                <span className="font-mono">{recharge.time}</span>
                                <span className="text-neutral-700">{recharge.tokenDenomination}代幣</span>
                                <span className="font-mono text-neutral-700">
                                  贈送: {recharge.bonus.toLocaleString()}代幣
                                </span>
                                <span className="font-mono text-neutral-700">
                                  總計: {recharge.totalTokens.toLocaleString()}代幣
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end ml-4">
                              <p className="text-lg font-bold text-neutral-900 font-mono whitespace-nowrap">
                                NT${recharge.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-neutral-500">暫無儲值記錄</p>
                    </div>
                  )}
                </>
              )}

              {/* 使用者倉庫內容 */}
              {activeTab === 'warehouse' && (
                <>
                  {userWarehouse.length > 0 ? (
                    <div className="space-y-3">
                      {userWarehouse.map((item) => (
                        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-neutral-900">{item.product}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.prize === 'A賞' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                  item.prize === 'B賞' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  item.prize === 'C賞' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  item.prize === 'D賞' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                  'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {item.prize}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                  未提交配送
                                </span>
                                {item.count > 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                    x{item.count}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-neutral-500">
                                {item.drawDate && (
                                  <span className="font-mono">獲得時間: {item.drawDate}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-neutral-500">暫無未提交配送的商品</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 重置密碼 Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false)
          setNewPassword('')
        }}
        title="重置密碼"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setIsResetPasswordModalOpen(false)
                setNewPassword('')
              }}
              className="px-4 py-2 text-sm text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={async () => {
                if (!newPassword.trim()) {
                  alert('請輸入新密碼')
                  return
                }
                
                try {
                  const { error } = await supabase
                    .from('users')
                    .update({ password: newPassword })
                    .eq('id', user.id)

                  if (error) throw error

                  // 更新本地狀態
                  setUser(prev => prev ? { ...prev, password: newPassword } : null)
                  
                  setIsResetPasswordModalOpen(false)
                  setNewPassword('')
                  alert('密碼已成功重置')
                } catch (err) {
                  console.error('Error resetting password:', err)
                  alert('重置密碼失敗，請稍後再試')
                }
              }}
              className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              確定
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              用戶ID
            </label>
            <input
              type="text"
              value={user.userId}
              disabled
              className="w-full px-4 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-neutral-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              新密碼
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="請輸入新密碼"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
