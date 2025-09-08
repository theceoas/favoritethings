'use client'

import { motion } from "framer-motion"
import Image from "next/image"
import { Package, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/cartStore"
import { toast } from "sonner"
import { isProductAvailable } from "@/lib/utils/inventory"

interface Product {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price?: number
  featured_image?: string
  images?: string[]
  inventory_quantity?: number
  available_sizes?: string[]
  is_featured?: boolean
  is_active?: boolean
  has_variants?: boolean
  track_inventory?: boolean
  variants?: ProductVariant[]
}

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
  is_active: boolean
  is_default?: boolean
  track_inventory?: boolean
  allow_backorder?: boolean
  featured_image?: string
}

interface ProductTileWithQuickAddProps {
  product: Product
  onClick: (product: Product) => void
  formatPrice: (price: number) => string
  index?: number
  showSizes?: boolean
}

export default function ProductTileWithQuickAdd({ 
  product, 
  onClick, 
  formatPrice, 
  index = 0,
  showSizes = false 
}: ProductTileWithQuickAddProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem } = useCartStore()
  
  // Get primary and secondary images
  const primaryImage = product.featured_image
  const secondaryImage = product.images && product.images.length > 0 
    ? product.images.find(img => img !== product.featured_image) || product.images[0]
    : null

  const hasSecondaryImage = secondaryImage && secondaryImage !== primaryImage

  // Get available sizes
  const availableSizes = product.variants?.map(v => v.size).filter(Boolean) || product.available_sizes || []
  const uniqueSizes = [...new Set(availableSizes)]

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If product has sizes, show size selector
    if (uniqueSizes.length > 0) {
      setShowSizeSelector(true)
      return
    }

    // Add to cart directly if no sizes
    await addToCart()
  }

  const addToCart = async (size?: string) => {
    setIsAddingToCart(true)
    
    try {
      let selectedVariant = null
      if (size && product.variants) {
        selectedVariant = product.variants.find(v => v.size === size) || null
      }

      await addItem(product, selectedVariant, 1)
      toast.success(`${product.title} added to cart!`)
      setShowSizeSelector(false)
      setSelectedSize('')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleSizeSelect = async (size: string) => {
    setSelectedSize(size)
    await addToCart(size)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer relative"
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowSizeSelector(false)
      }}
    >
      {/* Full-bleed image with 9:16 aspect ratio */}
      <div className="aspect-[9/16] relative overflow-hidden bg-gray-100">
        {primaryImage && !imageError ? (
          <div className="relative w-full h-full">
            {/* Primary Image */}
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              className={`object-cover object-top transition-all duration-500 ${
                hasSecondaryImage && isHovered 
                  ? 'opacity-0 scale-105' 
                  : 'opacity-100 group-hover:scale-105'
              }`}
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            
            {/* Secondary Image - Cross-fade on hover */}
            {hasSecondaryImage && (
              <Image
                src={secondaryImage}
                alt={product.title}
                fill
                className={`object-cover object-top transition-all duration-500 absolute inset-0 ${
                  isHovered 
                    ? 'opacity-100 scale-105' 
                    : 'opacity-0 scale-100'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Quick Add Button */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={handleQuickAdd}
            size="sm"
            className="w-8 h-8 p-0 bg-white hover:bg-gray-100 text-gray-900 rounded-full shadow-md border border-gray-200"
            disabled={isAddingToCart || product.inventory_quantity === 0}
          >
            {isAddingToCart ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Size Selector Popup */}
        {showSizeSelector && uniqueSizes.length > 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 m-4 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-medium mb-3 text-center">Select Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    disabled={isAddingToCart}
                    className="px-3 py-2 text-sm border rounded-md hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSizeSelector(false)
                }}
                className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Optional: Show sizes on hover */}
        {showSizes && product.available_sizes && product.available_sizes.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-xs text-gray-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded text-center">
              {product.available_sizes.join(', ')}
            </div>
          </div>
        )}
        
        {/* Out of stock overlay */}
        {!isProductAvailable(product) && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product info - clean text below image */}
      <div className="mt-3 space-y-1">
        <h3 className="text-sm text-gray-900 font-normal line-clamp-2 leading-tight">
          {product.title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 font-medium">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
} 