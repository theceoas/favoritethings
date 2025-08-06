'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { getProductImage } from '@/lib/utils/imageUtils'
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  TruckIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  total: number
  delivery_method: 'shipping' | 'pickup'
  tracking_number?: string
  created_at: string
  order_items: {
    id: string
    title: string
    variant_title?: string
    quantity: number
    price: number
    products?: {
      title: string
      featured_image?: string
    }
  }[]
}

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin?redirect=/account/orders')
        return
      }
      setUser(user)
      await fetchOrders(user.id)
    }
    getUser()
  }, [router])

  const fetchOrders = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total,
          delivery_method,
          tracking_number,
          created_at,
          order_items (
            id,
            title,
            variant_title,
            quantity,
            price,
            products (
              title,
              featured_image
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      confirmed: 'text-blue-700 bg-blue-100 border-blue-200',
      processing: 'text-purple-700 bg-purple-100 border-purple-200',
      shipped: 'text-green-700 bg-green-100 border-green-200',
      delivered: 'text-green-800 bg-green-100 border-green-200',
      cancelled: 'text-red-700 bg-red-100 border-red-200',
      refunded: 'text-gray-700 bg-gray-100 border-gray-200'
    }
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100 border-gray-200'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />
      case 'cancelled':
      case 'refunded':
        return <XCircleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/account"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Account
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">View your order history and track shipments</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
              { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
              { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
              { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
              { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
            ].filter(tab => tab.count > 0 || tab.key === 'all').map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === tab.key
                    ? 'bg-[#6A41A1] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `You don't have any ${filterStatus} orders.`
              }
            </p>
            {filterStatus === 'all' && (
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/track-order?order=${order.order_number}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-[#6A41A1] bg-[#6A41A1]/10 rounded-lg hover:bg-[#6A41A1]/20 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Track Order
                      </Link>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                      {formatCurrency(order.total)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <TruckIcon className="w-4 h-4 mr-2" />
                      {order.delivery_method === 'shipping' ? 'Shipping' : 'Store Pickup'}
                    </div>
                    {order.tracking_number && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-xs">Tracking: {order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.products?.featured_image ? (
                            <Image
                              src={getProductImage(item.products.featured_image)}
                              alt={item.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.products?.title || item.title}
                          </p>
                          {item.variant_title && (
                            <p className="text-xs text-gray-600">{item.variant_title}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''} • Total: {formatCurrency(order.total)}
                    </div>
                    <div className="flex items-center space-x-3">
                      {order.status === 'delivered' && (
                        <Link
                          href={`/account/orders/${order.id}/review`}
                          className="text-sm text-[#6A41A1] hover:text-[#6A41A1]/80 font-medium"
                        >
                          Write Review
                        </Link>
                      )}
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Summary */}
        {orders.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-800">
              <div>
                <span className="text-2xl font-bold">{orders.length}</span>
                <p className="text-sm">Total Orders</p>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                </span>
                <p className="text-sm">Total Spent</p>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'delivered').length}
                </span>
                <p className="text-sm">Completed Orders</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 