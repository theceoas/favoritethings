'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ShoppingBag, Star, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Product {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price?: number
  featured_image?: string
  is_featured: boolean
  is_active: boolean
  inventory_quantity: number
  brand_id: string
  created_at: string
  sku?: string
}

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  brandColor: string
  brandName: string
}

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  brandColor,
  brandName 
}: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Price not set'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Price not set'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(numPrice)
  }

  const getDiscountPercentage = (price: number | string | null | undefined, comparePrice?: number | string | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    const numComparePrice = typeof comparePrice === 'string' ? parseFloat(comparePrice) : comparePrice
    
    if (!numComparePrice || !numPrice || isNaN(numPrice) || isNaN(numComparePrice) || numComparePrice <= numPrice) return 0
    return Math.round(((numComparePrice - numPrice) / numComparePrice) * 100)
  }

  if (!product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">{brandName}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Content */}
            <div className="p-6">
              {/* Main Image */}
              <div className="relative mb-6">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                  {product.featured_image ? (
                    <img
                      src={product.featured_image}
                      alt={product.title}
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image available
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 space-y-2">
                  {product.is_featured && (
                    <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                      <Star className="w-2 h-2 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                      -{getDiscountPercentage(product.price, product.compare_at_price)}%
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 space-y-2">
                  <Button size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                    <Heart className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
                              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-800">{product.title}</h1>
                  <Button variant="ghost" size="sm">
                    <Heart className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-800">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="text-gray-600">
                    <p className="text-sm leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1"
                    >
                      -
                    </Button>
                    <span className="px-4 py-1 text-sm font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                {product.inventory_quantity > 0 ? (
                  <Button 
                    className="w-full py-4 text-lg font-semibold"
                    style={{ backgroundColor: brandColor }}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <div className="w-full py-4 text-lg font-semibold bg-red-500 text-white rounded-lg flex items-center justify-center">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 