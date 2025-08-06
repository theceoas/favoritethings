'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { getProductImage } from '@/lib/utils/imageUtils'
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalItems,
    getSubtotal,
    getTaxAmount,
    refreshInventory
  } = useCartStore()

  const [mounted, setMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefreshInventory = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const result = await refreshInventory()
      if (result && (result.removedItems.length > 0 || result.quantityChanges.length > 0)) {
        // Could show a toast notification here about changes
        console.log('Cart updated with latest inventory')
      }
    } catch (error) {
      console.error('Failed to refresh inventory:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Prevent rendering on server
  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-amber-50/50 backdrop-blur-sm z-40"
          onClick={closeCart}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-amber-200">
            <h2 className="text-2xl font-bold text-amber-800">
              Shopping Cart ({getTotalItems()})
            </h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={handleRefreshInventory}
                  disabled={isRefreshing}
                  className="p-2 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  title="Refresh inventory"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            <button
              onClick={closeCart}
              className="p-2 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBagIcon className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-800 mb-2">Your cart is empty</h3>
                <p className="text-amber-700 mb-6">Add some items to get started</p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-sm"
                  >
                    {/* Product Image */}
                    <div className="relative w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden flex-shrink-0">
                      {(() => {
                        const imageUrl = getProductImage(item.featured_image, [])
                        return imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.title}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="w-8 h-8 text-amber-400" />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-amber-800 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-amber-700">₦{item.price.toLocaleString()}</p>
                      <p className="text-xs text-amber-600">SKU: {item.sku}</p>
                      
                      {/* Stock Status */}
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.inventory_quantity === 0 ? 'bg-red-500' :
                          item.inventory_quantity <= 3 ? 'bg-orange-500' :
                          item.inventory_quantity <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className={`text-xs ${
                          item.inventory_quantity === 0 ? 'text-red-600' :
                          item.inventory_quantity <= 3 ? 'text-orange-600' :
                          item.inventory_quantity <= 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.inventory_quantity === 0 ? 'Out of stock' :
                           item.inventory_quantity <= 3 ? `Only ${item.inventory_quantity} left` :
                           item.inventory_quantity <= 10 ? 'Limited stock' : 'In stock'}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-amber-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                        disabled={item.quantity >= item.inventory_quantity}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Totals and Checkout */}
          {items.length > 0 && (
            <div className="border-t border-amber-200 p-6 space-y-4 bg-white/50">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">Subtotal</span>
                  <span className="font-medium text-amber-800">₦{getSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">Tax (7.5%)</span>
                  <span className="font-medium text-amber-800">₦{getTaxAmount().toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-2xl font-semibold hover:bg-amber-700 transition-all duration-300 flex items-center justify-center"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full border-2 border-amber-600 text-amber-600 py-3 px-4 rounded-2xl font-medium hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  View Cart
                </Link>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="w-full text-amber-700 py-2 px-4 text-center hover:text-amber-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 