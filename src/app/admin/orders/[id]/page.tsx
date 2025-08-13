'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { getProductImage } from '@/lib/utils/imageUtils'
import {
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'

interface OrderItem {
  id: string
  product_id: string
  title: string
  variant_title?: string
  sku: string
  quantity: number
  price: number
  total: number
  products?: {
    title: string
    featured_image?: string
    slug: string
  }
}

interface Order {
  id: string
  order_number: string
  user_id?: string
  email: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  payment_reference?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  currency: string
  shipping_address: any
  billing_address: any
  tracking_number?: string
  notes?: string
  delivery_method: 'shipping' | 'pickup'
  pickup_date?: string
  pickup_time?: string
  customer_phone?: string
  delivery_phone?: string
  special_instructions?: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              title,
              featured_image,
              slug
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (status: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }

      setOrder(prev => prev ? { ...prev, status } : null)
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (paymentStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment status')
      }

      setOrder(prev => prev ? { ...prev, payment_status: paymentStatus } : null)
    } catch (error) {
      console.error('Error updating payment status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
              <div className="h-48 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#6A41A1]">Order {order.order_number}</h1>
            <p className="text-gray-600">
              Created on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print
          </button>
          <Link
            href={`/admin/orders/${order.id}/edit`}
            className="flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
            
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                >
                  {/* Product Image */}
                  <div className="relative w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    {item.products?.featured_image && getProductImage(item.products.featured_image, []) ? (
                      <Image
                        src={item.products.featured_image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {item.title}
                      {item.variant_title && (
                        <span className="text-gray-600"> - {item.variant_title}</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600">₦{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>

                  {/* Total */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ₦{item.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₦{order.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.shipping_amount === 0 ? 'Free' : `₦${order.shipping_amount.toLocaleString()}`}
                  </span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-₦{order.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-[#6A41A1]">₦{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">
                    {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                  </p>
                  <p>{order.shipping_address?.address_line_1}</p>
                  {order.shipping_address?.address_line_2 && (
                    <p>{order.shipping_address.address_line_2}</p>
                  )}
                  <p>
                    {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                  </p>
                  <p>{order.shipping_address?.country}</p>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Billing Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">
                    {order.billing_address?.first_name} {order.billing_address?.last_name}
                  </p>
                  <p>{order.billing_address?.address_line_1}</p>
                  {order.billing_address?.address_line_2 && (
                    <p>{order.billing_address.address_line_2}</p>
                  )}
                  <p>
                    {order.billing_address?.city}, {order.billing_address?.state} {order.billing_address?.postal_code}
                  </p>
                  <p>{order.billing_address?.country}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{order.email}</span>
                </div>
                {order.payment_method && (
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="ml-2 font-medium">{order.payment_method}</span>
                  </div>
                )}
                {order.payment_reference && (
                  <div>
                    <span className="text-gray-600">Payment Reference:</span>
                    <span className="ml-2 font-medium">{order.payment_reference}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <span className="text-gray-600">Tracking Number:</span>
                    <span className="ml-2 font-medium">{order.tracking_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order & Payment Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${paymentStatusColors[order.payment_status]}`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Method:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded ${
                  order.delivery_method === 'pickup' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {order.delivery_method === 'pickup' ? '📦 Store Pickup' : '🚚 Shipping'}
                </span>
              </div>
              
              {order.delivery_method === 'pickup' && (
                <>
                  {order.pickup_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Pickup Date:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(order.pickup_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {order.pickup_time && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Pickup Time:</span>
                      <span className="ml-2 text-sm text-gray-900">{order.pickup_time}</span>
                    </div>
                  )}
                </>
              )}
              
              {order.customer_phone && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-sm text-gray-900">{order.customer_phone}</span>
                </div>
              )}
              
              {order.special_instructions && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Special Instructions:</span>
                  <span className="ml-2 text-sm text-gray-900">{order.special_instructions}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={updating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Confirm Order
                </button>
              )}
              
              {(order.status === 'confirmed' || order.status === 'processing') && (
                <button
                  onClick={() => updateOrderStatus('shipped')}
                  disabled={updating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <TruckIcon className="w-5 h-5 mr-2" />
                  Mark as Shipped
                </button>
              )}
              
              {order.payment_status === 'pending' && (
                <button
                  onClick={() => updatePaymentStatus('paid')}
                  disabled={updating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Timeline</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div className="text-sm">
                  <p className="font-medium">Order Created</p>
                  <p className="text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {order.status !== 'pending' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div className="text-sm">
                    <p className="font-medium">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                    <p className="text-gray-600">{new Date(order.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 