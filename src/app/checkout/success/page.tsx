'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const reference = searchParams.get('reference')
        const paymentConfirmed = searchParams.get('payment_confirmed')

        if (!reference || paymentConfirmed !== 'true') {
          setError('Invalid payment confirmation')
          setIsProcessing(false)
          return
        }

        console.log('Processing payment success for reference:', reference)

        // Get cart data from localStorage
        const cartData = localStorage.getItem('cart')
        const shippingData = localStorage.getItem('shippingAddress')
        const deliveryData = localStorage.getItem('deliveryMethod')
        
        if (!cartData) {
          setError('Cart data not found')
          setIsProcessing(false)
          return
        }

        const cart = JSON.parse(cartData)
        const shippingAddress = shippingData ? JSON.parse(shippingData) : null
        const deliveryMethod = deliveryData ? JSON.parse(deliveryData) : null

        // Calculate total
        const subtotal = cart.reduce((sum: number, item: any) => {
          return sum + (item.price * item.quantity)
        }, 0)
        
        const deliveryFee = deliveryMethod?.method === 'delivery' ? 2000 : 0
        const total = subtotal + deliveryFee

        // Generate order number
        const orderNum = `BZ${Date.now()}`
        setOrderNumber(orderNum)

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Create order in database
        const orderData = {
          order_number: orderNum,
          customer_id: user?.id || null,
          customer_email: user?.email || shippingAddress?.email || 'guest@example.com',
          customer_name: shippingAddress?.fullName || 'Guest Customer',
          customer_phone: shippingAddress?.phone || '',
          items: cart,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          payment_reference: reference,
          payment_status: 'completed',
          order_status: 'pending',
          delivery_method: deliveryMethod?.method || 'pickup',
          shipping_address: shippingAddress,
          delivery_details: deliveryMethod,
          created_at: new Date().toISOString()
        }

        console.log('Creating order:', orderData)

        // Insert order into database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single()

        if (orderError) {
          console.error('Order creation error:', orderError)
          // Continue anyway for demo purposes
        } else {
          console.log('Order created successfully:', order)
        }

        // Create notification for admin
        const notificationData = {
          type: 'new_order',
          title: 'New Order Received',
          message: `Order ${orderNum} has been placed by ${orderData.customer_name}`,
          data: {
            order_number: orderNum,
            customer_name: orderData.customer_name,
            total: total,
            items_count: cart.length
          },
          is_read: false,
          created_at: new Date().toISOString()
        }

        console.log('Creating notification:', notificationData)

        // Insert notification
        const { error: notificationError } = await supabase
          .from('admin_notifications')
          .insert([notificationData])

        if (notificationError) {
          console.error('Notification creation error:', notificationError)
          // Continue anyway
        } else {
          console.log('Notification created successfully')
        }

        // Clear cart and related data
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingAddress')
        localStorage.removeItem('deliveryMethod')

        // Wait a moment for processing animation
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Redirect to thank you page with order details
        const thankYouUrl = `/thank-you?order=${orderNum}&email=${encodeURIComponent(orderData.customer_email)}&delivery=${deliveryMethod?.method || 'pickup'}`
        
        if (deliveryMethod?.method === 'pickup' && deliveryMethod.pickupDetails) {
          const pickupParam = encodeURIComponent(JSON.stringify(deliveryMethod.pickupDetails))
          router.push(`${thankYouUrl}&pickup=${pickupParam}`)
        } else {
          router.push(thankYouUrl)
        }

      } catch (error) {
        console.error('Payment processing error:', error)
        setError('Failed to process payment. Please contact support.')
        setIsProcessing(false)
      }
    }

    processPaymentSuccess()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Checkout
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-green-500 mb-6"
        >
          {isProcessing ? (
            <Loader2 className="w-16 h-16 mx-auto animate-spin" />
          ) : (
            <CheckCircle className="w-16 h-16 mx-auto" />
          )}
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          {isProcessing ? 'Processing Payment...' : 'Payment Successful!'}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          {isProcessing 
            ? 'Please wait while we process your order and create your confirmation.'
            : `Order ${orderNumber} has been created successfully.`
          }
        </motion.p>

        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-2 text-sm text-gray-500"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Creating your order...</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 mx-auto text-green-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Payment Status...</h1>
        <p className="text-gray-600">Please wait while we verify your payment.</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}