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

        // Get order data from database using payment reference
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_id,
              variant_id,
              title,
              variant_title,
              sku,
              quantity,
              price,
              total
            )
          `)
          .eq('payment_reference', reference)
          .single()

        if (orderError || !orders) {
          console.error('Order not found for reference:', reference, orderError)
          setError('Order not found for this payment reference')
          setIsProcessing(false)
          return
        }

        console.log('Order found:', orders)
        setOrderNumber(orders.order_number)

        // Use order data from database
        const orderData = {
          customer_name: `${orders.customer_first_name} ${orders.customer_last_name}`,
          customer_email: orders.email,
          customer_phone: orders.customer_phone,
          shipping_address: orders.shipping_address,
          billing_address: orders.billing_address,
          delivery_method: orders.delivery_method,
          total: orders.total,
          items: orders.order_items
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        console.log('Order already exists in database:', orders)

        // Create notification for admin if not already created
        const notificationData = {
          type: 'payment_completed',
          title: 'Payment Completed',
          message: `Payment completed for order ${orders.order_number} by ${orderData.customer_name}`,
          data: {
            order_number: orders.order_number,
            customer_name: orderData.customer_name,
            total: orders.total,
            items_count: orders.order_items.length
          },
          is_read: false,
          created_at: new Date().toISOString()
        }

        console.log('Creating payment completion notification:', notificationData)

        // Insert notification
        const { error: notificationError } = await supabase
          .from('admin_notifications')
          .insert([notificationData])

        if (notificationError) {
          console.error('Notification creation error:', notificationError)
          // Continue anyway
        } else {
          console.log('Payment completion notification created successfully')
        }

        // Clear any remaining cart data (cart should already be cleared by checkout page)
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingAddress')
        localStorage.removeItem('deliveryMethod')

        // Wait a moment for processing animation
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Redirect to thank you page with complete order data
        const orderDataForThankYou = {
          id: orders.id,
          order_number: orders.order_number,
          email: orders.email,
          total: orders.total,
          subtotal: orders.subtotal,
          tax_amount: orders.tax_amount,
          shipping_amount: orders.shipping_amount,
          discount_amount: orders.discount_amount,
          currency: orders.currency,
          delivery_method: orders.delivery_method,
          shipping_address: orders.shipping_address,
          pickup_details: orders.pickup_details,
          items: orders.order_items || [],
          status: orders.status,
          payment_status: orders.payment_status,
          created_at: orders.created_at
        }

        const thankYouParams = new URLSearchParams({
          order: JSON.stringify(orderDataForThankYou),
          email: orders.email,
          delivery: orders.delivery_method
        })

        if (orders.delivery_method === 'pickup' && orders.pickup_details) {
          thankYouParams.append('pickup', JSON.stringify(orders.pickup_details))
        }

        const thankYouUrl = `/thank-you?${thankYouParams.toString()}`
        router.push(thankYouUrl)

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