'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import CartButton from '@/components/CartButton'
import { 
  CheckCircle, 
  Truck, 
  MapPin, 
  Clock, 
  Mail,
  ArrowRight,
  Sparkles,
  Home
} from 'lucide-react'

// Separate component for handling search params
function ThankYouPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [pickupDetails, setPickupDetails] = useState<any>(null)

  useEffect(() => {
    const orderParam = searchParams.get('order')
    const emailParam = searchParams.get('email')
    const deliveryParam = searchParams.get('delivery')
    const pickupParam = searchParams.get('pickup')

    console.log('🎉 Thank You page loaded with params:', {
      order: orderParam,
      email: emailParam,
      delivery: deliveryParam,
      pickup: pickupParam,
      allParams: Object.fromEntries(searchParams.entries())
    })

    if (orderParam) setOrderNumber(orderParam)
    if (emailParam) setEmail(emailParam)
    if (deliveryParam) setDeliveryMethod(deliveryParam)
    if (pickupParam) {
      try {
        const parsed = JSON.parse(pickupParam)
        setPickupDetails(parsed)
      } catch (e) {
        console.error('Error parsing pickup details:', e)
      }
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
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
          className="absolute top-20 left-20 w-32 h-32 bg-amber-400/20 rounded-full blur-xl"
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
          className="absolute bottom-32 right-32 w-24 h-24 bg-orange-400/10 rounded-full blur-xl"
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
          className="absolute top-1/2 right-20 w-16 h-16 bg-amber-400/30 rounded-full blur-lg"
        />
      </div>

      {/* Floating Cart Button */}
      <CartButton variant="floating" size="lg" />

      <div className="relative z-10 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Show demo notice if no order data */}
          {!orderNumber && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <p className="text-blue-800 text-sm text-center">
                📝 Demo Mode: This is how the thank you page looks after a successful order
              </p>
            </motion.div>
          )}

          {/* Success Header */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-800 mb-4"
            >
              Thank You for Your Order!
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-base sm:text-lg lg:text-xl text-amber-700 max-w-2xl mx-auto px-4"
            >
              Your payment has been processed successfully. We're excited to get your order ready!
            </motion.p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-amber-200 overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-6 text-white">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Order Confirmation</h2>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm">Order Number</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold break-all">{orderNumber || 'BZ20241220001'}</p>
                </div>
                {(email || !orderNumber) && (
                  <div className="sm:border-l sm:border-white/20 sm:pl-4 pt-2 sm:pt-0">
                    <p className="text-white/80 text-xs sm:text-sm">Email</p>
                    <p className="font-medium text-sm sm:text-base break-all">{email || 'customer@example.com'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Delivery Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    {(deliveryMethod === 'pickup') ? (
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    ) : (
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    )}
                    <h3 className="text-base sm:text-lg font-semibold text-amber-800">
                      {deliveryMethod === 'pickup' ? 'Pickup Details' : 'Delivery Information'}
                    </h3>
                  </div>
                  
                  {deliveryMethod === 'pickup' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-amber-600">Pickup Date</p>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">
                          {pickupDetails?.date || 'December 25, 2024'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-amber-600">Pickup Time</p>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">
                          {pickupDetails?.time || '2:00 PM - 6:00 PM'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-amber-600">Location</p>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">
                          {pickupDetails?.address || '123 Fashion Street, Lagos, Nigeria'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-amber-600">Estimated Delivery</p>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">3-5 Business Days</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-amber-600">Tracking</p>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">Will be sent via email</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    <h3 className="text-base sm:text-lg font-semibold text-amber-800">Next Steps</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">Order Confirmed</p>
                        <p className="text-xs sm:text-sm text-amber-600">Payment processed successfully</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">Processing</p>
                        <p className="text-xs sm:text-sm text-amber-600">We're preparing your order</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 text-sm sm:text-base">Ready</p>
                        <p className="text-xs sm:text-sm text-amber-600">Your order will be ready soon</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Contact Information */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-200"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800">Need Help?</h3>
                </div>
                
                <p className="text-amber-700 text-sm sm:text-base mb-4">
                  If you have any questions about your order, feel free to reach out to our customer support team.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-amber-600">Email</p>
                    <p className="font-medium text-amber-800 text-sm sm:text-base break-all">support@bedznbuttunz.com</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-amber-600">Phone</p>
                    <p className="font-medium text-amber-800 text-sm sm:text-base">+234 (0) 80 1234 5678</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
          >
            <Link href="/" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Home
              </motion.button>
            </Link>
            
            <Link href="/brands" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-white text-amber-700 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl border-2 border-amber-500 hover:bg-amber-50 transition-all duration-300"
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ThankYouPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">Loading...</h2>
        <p className="text-amber-700">Preparing your order confirmation</p>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouPageFallback />}>
      <ThankYouPageContent />
    </Suspense>
  )
} 