'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { getProductImage } from '@/lib/utils/imageUtils'
import CartButton from '@/components/CartButton'
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getSubtotal,
    getTaxAmount,
    refreshInventory
  } = useCartStore()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Refresh inventory when cart page loads
    if (items.length > 0) {
      refreshInventory()
    }
  }, [])

  // Prevent rendering on server
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-amber-800 mb-2">Loading...</h2>
          <p className="text-amber-700">Preparing your cart</p>
        </div>
      </div>
    )
  }

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

      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </Link>
            </motion.div>

            {/* Brand Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-full mb-8 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Kiowa</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-800 mb-6"
            >
              Shopping Cart
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg sm:text-xl text-amber-700 max-w-2xl mx-auto leading-relaxed"
            >
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
            </motion.p>
          </motion.div>

          {items.length === 0 ? (
            /* Empty Cart */
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-12 text-center max-w-2xl mx-auto"
            >
              <ShoppingBag className="w-24 h-24 text-amber-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-amber-800 mb-4">Your cart is empty</h2>
              <p className="text-amber-700 mb-8 max-w-md mx-auto">
                Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
              </p>
              <Link href="/brands">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Continue Shopping
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-6"
                >
                  {/* Clear Cart Button */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-amber-800">Cart Items</h2>
                    <motion.button
                      onClick={clearCart}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Clear All
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.product_id}-${item.variant_id || 'default'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-28 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                            <img
                              src={getProductImage(item.featured_image)}
                              alt={item.title}
                              className="max-w-full max-h-full w-auto h-auto"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-amber-800 truncate">{item.title}</h3>
                          {item.variant_title && (
                            <p className="text-sm text-amber-600">{item.variant_title}</p>
                          )}
                          <p className="text-lg font-bold text-amber-800">₦{item.price.toLocaleString()}</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 bg-white border border-amber-300 rounded-lg flex items-center justify-center hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4 text-amber-700" />
                          </motion.button>
                          
                          <span className="w-12 text-center font-semibold text-amber-800">
                            {item.quantity}
                          </span>
                          
                          <motion.button
                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 bg-white border border-amber-300 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-amber-700" />
                          </motion.button>
                        </div>

                        {/* Remove Button */}
                        <motion.button
                          onClick={() => removeItem(item.product_id, item.variant_id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-6 sticky top-8"
                >
                  <h2 className="text-xl font-semibold text-amber-800 mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Subtotal</span>
                      <span className="font-semibold text-amber-800">₦{getSubtotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Tax</span>
                      <span className="font-semibold text-amber-800">₦{getTaxAmount().toLocaleString()}</span>
                    </div>
                    <div className="border-t border-amber-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-amber-800">Total</span>
                        <span className="text-lg font-bold text-amber-800">
                          ₦{(getSubtotal() + getTaxAmount()).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-8 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
} 