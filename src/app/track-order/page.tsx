'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import CartButton from '@/components/CartButton'
import { 
  Search,
  CheckCircle,
  Truck,
  Home,
  Clock,
  AlertCircle,
  XCircle,
  Info,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

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

const getStatusSteps = (deliveryMethod: string) => {
  const baseSteps = [
    {
      key: 'pending',
      title: 'Order Received',
      description: 'We have received your order',
      icon: Clock,
      color: '#FFD84D'
    },
    {
      key: 'confirmed',
      title: 'Order Confirmed',
      description: 'Payment confirmed, preparing your order',
      icon: CheckCircle,
      color: '#F59E0B'
    },
    {
      key: 'processing',
      title: 'Being Prepared',
      description: 'Carefully preparing your order',
      icon: Info,
      color: '#F59E0B'
    }
  ]

  if (deliveryMethod === 'pickup') {
    return [
      ...baseSteps,
      {
        key: 'shipped', // Keep same key for consistency with backend
        title: 'Ready for Pickup',
        description: 'Your order is ready for collection',
        icon: CheckCircle,
        color: '#E8BA38'
      },
      {
        key: 'delivered', // Keep same key for consistency with backend
        title: 'Picked Up',
        description: 'Thank you for your purchase!',
        icon: Home,
        color: '#10B981'
      }
    ]
  } else {
    return [
      ...baseSteps,
      {
        key: 'shipped',
        title: 'Shipped',
        description: 'Your order is on its way',
        icon: Truck,
        color: '#E8BA38'
      },
      {
        key: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        icon: Home,
        color: '#10B981'
      }
    ]
  }
}

const getStatusProgress = (status: string) => {
  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  const currentIndex = statusOrder.indexOf(status)
  return Math.max(0, currentIndex + 1)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100'
    case 'confirmed':
    case 'processing':
      return 'text-orange-600 bg-orange-100'
    case 'shipped':
      return 'text-yellow-600 bg-yellow-100'
    case 'delivered':
      return 'text-green-600 bg-green-100'
    case 'cancelled':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Check for order number in URL params
    const orderParam = searchParams?.get('order')
    if (orderParam) {
      setOrderNumber(orderParam)
      fetchOrderByNumber(orderParam)
    }
  }, [searchParams])

  const fetchOrderByNumber = async (number: string, silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              title,
              featured_image
            )
          )
        `)
        .eq('order_number', number)
        .single()

      if (error) {
        console.error('Error fetching order:', error)
        setError('Order not found. Please check your order number and try again.')
          setOrder(null)
      } else if (data) {
        setOrder(data)
        setError('')
        } else {
        setError('Order not found. Please check your order number and try again.')
        setOrder(null)
      }
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('An error occurred while fetching your order. Please try again.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (orderNumber.trim()) {
      fetchOrderByNumber(orderNumber.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (!isMounted) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing order tracking</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-32 right-32 w-24 h-24 bg-black/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 right-20 w-16 h-16 bg-yellow-400/30 rounded-full blur-lg"
        />
          </div>

      {/* Floating Cart Button */}
      <CartButton variant="floating" size="lg" />

      <div className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-start mb-8"
            >
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </motion.div>

            {/* Brand Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-full mb-8 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Favorite Things</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6"
            >
              Track Your Order
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              Enter your order number to track the status of your order
            </motion.p>
          </motion.div>

          {/* Search Section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-md mx-auto mb-12"
          >
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8"
            >
              <div className="flex gap-4">
                <div className="flex-1">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                    placeholder="Enter order number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
              />
                </div>
                <motion.button
                onClick={handleSearch}
                disabled={loading || !orderNumber.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Track
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-center"
            >
              <p className="text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Order Details */}
          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-8"
            >
              {/* Order Summary */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl shadow-xl border border-yellow-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-black">
                  <h2 className="text-2xl font-semibold mb-2">Order Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-black/60 text-sm">Order Number</p>
                      <p className="text-xl font-bold">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-black/60 text-sm">Status</p>
                      <p className="text-xl font-bold capitalize">{order.status}</p>
                    </div>
                    <div>
                      <p className="text-black/60 text-sm">Total</p>
                      <p className="text-xl font-bold">₦{order.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              {item.variant_title && (
                                <p className="text-sm text-gray-500">{item.variant_title}</p>
                              )}
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-gray-900">₦{item.total.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Order Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <p className="font-medium text-gray-900 capitalize">{order.payment_status}</p>
          </div>
                <div>
                          <p className="text-sm text-gray-500">Delivery Method</p>
                          <p className="font-medium text-gray-900 capitalize">{order.delivery_method}</p>
                        </div>
                    {order.tracking_number && (
                          <div>
                            <p className="text-sm text-gray-500">Tracking Number</p>
                            <p className="font-medium text-gray-900">{order.tracking_number}</p>
                          </div>
                    )}
                    {order.delivery_phone && (
                          <div>
                            <p className="text-sm text-gray-500">Delivery Phone</p>
                            <p className="font-medium text-gray-900">{order.delivery_phone}</p>
                          </div>
                    )}
                  </div>
                </div>
                  </div>
                </div>
              </motion.div>

              {/* Order Status */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Order Progress</h2>
                
                <div className="relative">
                  {/* Status Steps */}
                  <div className="relative">
                    {getStatusSteps(order.delivery_method).map((step, index) => {
                      const isCompleted = getStatusProgress(order.status) > index
                      const isCurrent = getStatusProgress(order.status) === index + 1
                      const Icon = step.icon

                      return (
                        <motion.div
                          key={step.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className={`flex items-center mb-8 last:mb-0 ${
                            index < getStatusSteps(order.delivery_method).length - 1 ? 'relative' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 relative">
                            {/* Progress Bar for this step */}
                            {index < getStatusSteps(order.delivery_method).length - 1 && (
                              <div className="absolute top-6 left-6 w-1 h-8 bg-gray-200">
                                {isCompleted && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: '100%' }}
                                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                                    className="w-full bg-gradient-to-b from-yellow-400 to-orange-500"
                                  />
                                )}
                              </div>
                            )}
                            
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                                : isCurrent 
                                  ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-400'
                                  : 'bg-gray-100 text-gray-400'
                            }`}>
                              <Icon className="w-6 h-6" />
                            </div>
                          </div>

                          <div className="ml-6 flex-1">
                            <h3 className={`font-semibold ${
                              isCompleted ? 'text-gray-900' : isCurrent ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                              {step.title}
                            </h3>
                            <p className={`text-sm ${
                              isCompleted ? 'text-gray-600' : isCurrent ? 'text-yellow-500' : 'text-gray-400'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
          </div>
  )
}

function TrackOrderFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Preparing order tracking</p>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<TrackOrderFallback />}>
      <TrackOrderContent />
    </Suspense>
  )
} 