'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface ProductVariant {
  id: string
  title: string
  sku: string
  price: number
  compare_at_price?: number
  size?: string
  color?: string
  material?: string
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  is_default?: boolean
  featured_image?: string
  images?: string[]
}

interface Product {
  id: string
  title: string
  slug: string
  price: number
  featured_image?: string
  sku: string
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
}

interface AddToCartButtonProps {
  product: Product
  variant?: ProductVariant
  quantity?: number
  className?: string
  children?: React.ReactNode
  showVariantInfo?: boolean
}

export default function AddToCartButton({ 
  product, 
  variant, 
  quantity = 1,
  className = '',
  children,
  showVariantInfo = true
}: AddToCartButtonProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCartStore()

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent event bubbling and default behavior for Safari compatibility
    e.preventDefault()
    e.stopPropagation()
    
    if (isAdding) return

    // If the button text is "Select Options", navigate to product page
    const buttonText = children?.toString() || ''
    if (buttonText.includes('Select Options')) {
      router.push(`/products/${product.slug}`)
      return
    }

    setIsAdding(true)
    setError(null)
    
    try {
      console.log('Adding item to cart:', { product, variant, quantity })
      
      // Use the main cart store with proper async handling
      await addItem({
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: variant?.price ?? product.price,
        featured_image: product.featured_image,
        sku: variant?.sku ?? (product.sku || ''),
        inventory_quantity: variant?.inventory_quantity ?? product.inventory_quantity,
        track_inventory: variant?.track_inventory ?? product.track_inventory
      }, variant, quantity)
      
      console.log('Successfully added item to cart')
      
      // Show success feedback
      toast.success(`${product.title} added to cart!`)
      setIsAdded(true)
      setTimeout(() => {
        setIsAdded(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error adding item to cart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart'
      console.error('Error message:', errorMessage)
      setError(errorMessage)
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setIsAdding(false)
    }
  }

  // Determine effective values (variant takes precedence over product)
  const effectivePrice = variant?.price ?? product.price
  const effectiveInventory = variant?.inventory_quantity ?? product.inventory_quantity
  const trackInventory = variant?.track_inventory ?? product.track_inventory
  const isActive = variant?.is_active ?? product.is_active

  // Determine if we can add to cart
  const canAddToCart = isActive && (!trackInventory || effectiveInventory > 0) && !isAdding

  const getStockStatus = () => {
    if (!isActive) return 'Inactive'
    if (!trackInventory) return 'In Stock'
    if (effectiveInventory <= 0) return 'Out of Stock'
    if (effectiveInventory <= 5) return `Low Stock (${effectiveInventory})`
    return 'In Stock'
  }

  const getVariantInfoText = () => {
    if (!variant) return ''
    const parts = []
    if (variant.size) parts.push(variant.size)
    if (variant.color) parts.push(variant.color)
    if (variant.material) parts.push(variant.material)
    return parts.length > 0 ? ` • ${parts.join(' • ')}` : ''
  }

  const getStockStatusColor = () => {
    if (!isActive) return 'bg-gray-300 text-gray-500'
    if (!trackInventory) return 'bg-green-500 text-white'
    if (effectiveInventory <= 0) return 'bg-red-500 text-white'
    if (effectiveInventory <= 5) return 'bg-orange-500 text-white'
    return 'bg-green-500 text-white'
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={!canAddToCart}
        type="button"
        style={{
          WebkitAppearance: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        className={`
          relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${
            canAddToCart
              ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${className}
        `}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Adding...</span>
          </>
        ) : isAdded ? (
          <>
            <CheckIcon className="w-4 h-4" />
            <span>Added!</span>
          </>
        ) : (
          <>
            <ShoppingCartIcon className="w-4 h-4" />
            <span className="flex items-center gap-1">
              {children || (
                <>
                  <span>Add to Cart</span>
                  {(showVariantInfo || variant) && (
                    <span className="text-sm opacity-75">
                      • ₦{effectivePrice.toLocaleString()}
                      {getVariantInfoText()}
                    </span>
                  )}
                </>
              )}
            </span>
          </>
        )}
      </button>

      {!isAdding && !isAdded && (
        <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${getStockStatusColor()}`}>
          {getStockStatus()}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2 border border-red-200 shadow-sm">
          {error}
        </div>
      )}
    </div>
  )
}