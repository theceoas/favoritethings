'use client'

import { OptimizedMotionCard } from './OptimizedMotion'
import Image from "next/image"
import { Package } from "lucide-react"
import { useState } from "react"
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
  variants?: Array<{
    id: string
    is_active: boolean
    inventory_quantity: number
    track_inventory?: boolean
    allow_backorder?: boolean
  }>
}

interface ProductTileProps {
  product: Product
  onClick: (product: Product) => void
  formatPrice: (price: number) => string
  index?: number
  showSizes?: boolean
}

export default function ProductTile({ 
  product, 
  onClick, 
  formatPrice, 
  index = 0,
  showSizes = false 
}: ProductTileProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Get primary and secondary images
  const primaryImage = product.featured_image
  const secondaryImage = product.images && product.images.length > 0 
    ? product.images.find(img => img !== product.featured_image) || product.images[0]
    : null

  const hasSecondaryImage = secondaryImage && secondaryImage !== primaryImage

  return (
    <OptimizedMotionCard
      className="group cursor-pointer"
      onClick={() => {
        if (product.inventory_quantity && product.inventory_quantity > 0) {
          onClick({
            ...product,
            inventory_quantity: product.inventory_quantity
          })
        } else {
          onClick(product)
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Full-bleed image with 9:16 aspect ratio (perfect for fashion) */}
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
    </OptimizedMotionCard>
  )
}