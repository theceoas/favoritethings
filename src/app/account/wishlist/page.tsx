'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { getProductImage } from '@/lib/utils/imageUtils'
import { useCartStore } from '@/lib/store/cartStore'
import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from '@/components/ui/CustomModal'
import {
  ArrowLeftIcon,
  HeartIcon,
  ShoppingCartIcon,
  TrashIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface WishlistItem {
  id: string
  created_at: string
  products: {
    id: string
    title: string
    price: number
    featured_image?: string
    slug: string
    sku: string
    stock_quantity: number
    is_active: boolean
    product_variants?: {
      id: string
      title: string
      price: number
      sku: string
      stock_quantity: number
    }[]
  }
}

export default function WishlistPage() {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [user, setUser] = useState<any>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  
  const { modalState, closeModal, confirm, success, error: showError } = useCustomModal()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin?redirect=/account/wishlist')
        return
      }
      setUser(user)
      await fetchWishlist(user.id)
    }
    getUser()
  }, [router])

  const fetchWishlist = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          products (
            id,
            title,
            price,
            featured_image,
            slug,
            sku,
            stock_quantity,
            is_active,
            product_variants (
              id,
              title,
              price,
              sku,
              stock_quantity
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter out products that no longer exist or are inactive
      const activeItems = (data || []).filter(item => 
        item.products && item.products.is_active
      )
      
      setWishlistItems(activeItems)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (wishlistItemId: string) => {
    setRemoving(wishlistItemId)
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistItemId)

      if (error) throw error
      
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      showError('Remove Failed', 'Failed to remove item from wishlist. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  const addToCart = async (product: WishlistItem['products']) => {
    setAddingToCart(product.id)
    try {
      // Use the first variant if available, otherwise use the main product
      const variant = product.product_variants?.[0]
      const itemToAdd = {
        product_id: product.id,
        title: product.title,
        price: variant?.price || product.price,
        sku: variant?.sku || product.sku,
        image: product.featured_image,
        variant_id: variant?.id,
        variant_title: variant?.title,
        max_quantity: variant?.stock_quantity || product.stock_quantity
      }

      await addItem(itemToAdd, 1)
      
      // Show success message
      success('Added to Cart', 'Item added to cart successfully!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      showError('Add to Cart Failed', 'Failed to add item to cart. Please try again.')
    } finally {
      setAddingToCart(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const isInStock = (product: WishlistItem['products']) => {
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.some(variant => variant.stock_quantity > 0)
    }
    return product.stock_quantity > 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your wishlist...</p>
                  </div>
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
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
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-1">Items you've saved for later</p>
            </div>
            <div className="flex items-center space-x-2">
              <HeartIconSolid className="w-6 h-6 text-red-500" />
              <span className="text-lg font-semibold text-gray-900">
                {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Save items you love to your wishlist and shop them later.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
            >
              <HeartIcon className="w-5 h-5 mr-2" />
              Start Wishlist
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {item.products.featured_image ? (
                    <Image
                      src={getProductImage(item.products.featured_image)}
                      alt={item.products.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <HeartIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Quick Actions Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/products/${item.products.slug}`}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={removing === item.id}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* Stock Status */}
                  {!isInStock(item.products) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <Link
                      href={`/products/${item.products.slug}`}
                      className="font-semibold text-gray-900 hover:text-[#6A41A1] transition-colors line-clamp-2"
                    >
                      {item.products.title}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-[#6A41A1]">
                        {formatCurrency(item.products.price)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.5</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants Info */}
                  {item.products.product_variants && item.products.product_variants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600">
                        {item.products.product_variants.length} variant{item.products.product_variants.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(item.products)}
                      disabled={!isInStock(item.products) || addingToCart === item.products.id}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      {addingToCart === item.products.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={removing === item.id}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-gray-500 mt-3">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wishlist Actions */}
        {wishlistItems.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Wishlist Actions</h3>
                <p className="text-sm text-gray-600">Manage your saved items</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    const inStockItems = wishlistItems.filter(item => isInStock(item.products))
                    if (inStockItems.length === 0) {
                      showError('No Items Available', 'No items in stock to add to cart')
                      return
                    }
                    const confirmed = await confirm(
                      'Add All to Cart',
                      `Add all ${inStockItems.length} in-stock items to cart?`,
                      'Add All',
                      'Cancel'
                    )
                    if (confirmed) {
                      inStockItems.forEach(item => addToCart(item.products))
                    }
                  }}
                  className="px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
                >
                  Add All to Cart
                </button>
                <button
                  onClick={async () => {
                    const confirmed = await confirm(
                      'Clear Wishlist',
                      'Remove all items from your wishlist?',
                      'Clear All',
                      'Cancel'
                    )
                    if (confirmed) {
                      wishlistItems.forEach(item => removeFromWishlist(item.id))
                    }
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Wishlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Tips */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-3">❤️ Wishlist Tips</h3>
          <ul className="space-y-2 text-red-800 text-sm">
            <li>• Your wishlist is saved to your account and syncs across devices</li>
            <li>• Get notified when items go on sale or come back in stock</li>
            <li>• Share your wishlist with friends and family</li>
            <li>• Items in your wishlist are reserved for 24 hours when you add them to cart</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 