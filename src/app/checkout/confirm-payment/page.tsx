'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, CreditCard, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

function ConfirmPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const reference = searchParams.get('ref')

  const handleConfirmPayment = async () => {
    if (!reference) {
      alert('Invalid payment reference')
      return
    }

    setIsProcessing(true)

    try {
      console.log('🔄 Confirming payment with reference:', reference)

      // Step 1: Verify payment with Paystack
      const verifyResponse = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed')
      }

      console.log('✅ Payment verified successfully:', verifyData.data)

      // Step 2: Find and update the order in database
      const orderResponse = await fetch('/api/orders/update-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          payment_reference: reference,
          payment_status: 'paid',
          payment_data: verifyData.data
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to update order status')
      }

      console.log('✅ Order status updated successfully:', orderData.order_number)

      // Step 3: Create payment notification
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'payment_received',
            orderNumber: orderData.order_number,
            orderId: orderData.id,
            amount: orderData.total
          }),
        })
        console.log('✅ Payment notification created')
      } catch (notificationError) {
        console.warn('⚠️ Failed to create payment notification:', notificationError)
        // Don't fail the payment confirmation for notification errors
      }

      // Step 4: Redirect to success page
      const successUrl = `/checkout/success?reference=${reference}&payment_confirmed=true&order_number=${orderData.order_number}`
      router.push(successUrl)

    } catch (error) {
      console.error('❌ Payment confirmation error:', error)
      alert(`Payment confirmation failed: ${error.message}. Please try again or contact support.`)
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    router.push('/checkout')
  }

  if (!reference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Reference</h1>
          <p className="text-gray-600 mb-6">The payment reference is missing or invalid.</p>
          <Link
            href="/checkout"
            className="inline-flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Checkout</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-blue-500 mb-6"
          >
            <CreditCard className="w-16 h-16 mx-auto" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Confirm Your Payment
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-2"
          >
            Payment Reference:
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-lg mb-6 break-all"
          >
            {reference}
          </motion.p>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-8"
          >
            Click the button below to confirm your payment and complete your order.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Return to Checkout</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Payment Details...</h1>
        <p className="text-gray-600">Please wait while we load your payment information.</p>
      </div>
    </div>
  )
}

export default function ConfirmPaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmPaymentContent />
    </Suspense>
  )
}