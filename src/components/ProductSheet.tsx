'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, ShoppingBag, Star, Eye, Plus, Minus, Share2, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSimpleCartStore } from '@/lib/store/simpleCartStore'
import { toast } from 'sonner'

interface Product {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price?: number
  featured_image?: string
  images?: string[]
  is_featured: boolean
  is_active: boolean
  inventory_quantity: number
  brand_id: string
  created_at: string
  sku?: string
  description?: string
  variants?: ProductVariant[]
  available_sizes?: string[]
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
  featured_image?: string
}

interface ProductSheetProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  brandColor: string
  brandName: string
}

export default function ProductSheet({ 
  product, 
  isOpen, 
  onClose, 
  brandColor,
  brandName 
}: ProductSheetProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const { addItem } = useSimpleCartStore()

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Price not set'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Price not set'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(numPrice)
  }

  if (!product) return null

  // Get all images (featured + additional)
  const allImages = [product.featured_image, ...(product.images || [])].filter(Boolean)
  
  // Get available sizes (from variants or available_sizes)
  const availableSizes = product.variants?.map(v => v.size).filter((size): size is string => Boolean(size)) || product.available_sizes || []
  const uniqueSizes = [...new Set(availableSizes)].filter((size): size is string => Boolean(size))

  // Get current price (from selected variant or base product)
  const currentPrice = selectedVariant?.price || product.price
  const currentComparePrice = selectedVariant?.compare_at_price || product.compare_at_price

  // Add to cart functionality using simplified approach like product cards
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAdding || !product) return
    
    setIsAdding(true)
    try {
      addItem({
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: currentPrice,
        featured_image: product.featured_image,
        sku: selectedVariant?.sku || product.sku || ''
      })
      toast.success(`${product.title} added to cart!`)
    } catch (error) {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAdding(false)
    }
  }

  // Check if product is available
  const isProductAvailable = () => {
    if (selectedVariant) {
      return selectedVariant.is_active && selectedVariant.inventory_quantity > 0
    }
    return product.is_active && product.inventory_quantity > 0
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    // Find variant with this size
    const variant = product.variants?.find(v => v.size === size)
    setSelectedVariant(variant || null)
  }

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize('')
      setSelectedVariant(null)
      setCurrentImageIndex(0)
    }
  }, [product?.id])

  // Update URL when sheet opens
  useEffect(() => {
    if (isOpen && product?.slug) {
      const currentUrl = window.location.pathname
      const newUrl = `/products/${product.slug}`
      
      // Only update if we're not already on the product page
      if (currentUrl !== newUrl && !currentUrl.includes('/products/')) {
        window.history.pushState({}, '', newUrl)
      }
    }
  }, [isOpen, product?.slug])

  const handleShare = async () => {
    if (!product) return
    
    const url = `${window.location.origin}/products/${product.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this product: ${product.title}`,
          url: url,
        })
      } catch (error) {
        // Fallback to clipboard if share fails
        copyToClipboard(url)
      }
    } else {
      // Fallback for browsers without Web Share API
      copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleOpenInNewPage = () => {
    if (product?.slug) {
      window.open(`/products/${product.slug}`, '_blank')
    }
  }

  const handleBackClick = () => {
    onClose()
    router.back()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-none overflow-y-auto p-0">
        {/* Minimal header like Zara */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewPage}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Zara-style layout */}
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Images (like Zara) */}
          <div className="lg:w-1/2 bg-gray-50">
            {/* Main large image */}
            <div className="aspect-[3/4] relative bg-white">
              {allImages.length > 0 && allImages[currentImageIndex] ? (
                <Image
                  src={allImages[currentImageIndex]!}
                  alt={product.title}
                  fill
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
              
              {/* Badges - positioned like Zara */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.is_featured && (
                  <Badge className="bg-black text-white text-xs px-2 py-1 font-normal">
                    NEW
                  </Badge>
                )}
                {currentComparePrice && currentComparePrice > currentPrice && (
                  <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-normal">
                    -{Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Additional images grid - like Zara's thumbnail layout */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-2 gap-0">
                {allImages.slice(1, 5).map((image, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentImageIndex(index + 1)}
                    className={`aspect-[3/4] relative overflow-hidden transition-opacity ${
                      currentImageIndex === index + 1 ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image!}
                      alt={`${product.title} ${index + 2}`}
                      fill
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Product info (like Zara) */}
          <div className="lg:w-1/2 p-6 lg:p-8">
            <div className="max-w-md">
              {/* Product title - Zara style */}
              <h1 className="text-lg font-normal text-black mb-2 uppercase tracking-wide">
                {product.title}
              </h1>
              
              {/* Price - Zara style */}
              <div className="flex items-center space-x-3 mb-8">
                <span className="text-lg font-normal text-black">
                  {formatPrice(currentPrice)}
                </span>
                {currentComparePrice && currentComparePrice > currentPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(currentComparePrice)}
                  </span>
                )}
              </div>

              {/* Description - minimal like Zara */}
              {product.description && (
                <div className="text-sm text-gray-700 mb-8 leading-relaxed">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Size selection - Zara style */}
              {uniqueSizes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-normal text-black mb-3 uppercase tracking-wide">
                    Size
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {uniqueSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`aspect-square border text-sm font-normal transition-all ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 bg-white text-black hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to cart button - Safari-compatible + button approach */}
              <div className="mb-8">
                {isProductAvailable() ? (
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-12 h-12 p-0 bg-white border-2 border-black hover:bg-black hover:text-white rounded-full transition-all duration-200 flex items-center justify-center"
                  >
                    {isAdding ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    ) : (
                      <span className="text-xl font-bold">+</span>
                    )}
                  </Button>
                ) : (
                  <Badge className="bg-red-500 text-white text-sm px-4 py-2">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Product details - minimal like Zara */}
              <div className="space-y-3 text-xs text-gray-600 uppercase tracking-wide">
                {product.sku && (
                  <div>
                    Ref. {selectedVariant?.sku || product.sku}
                  </div>
                )}
                <div>
                  {brandName}
                </div>
              </div>

              {/* Additional product info sections - like Zara */}
              <div className="mt-8 space-y-4">
                <details className="border-t border-gray-200 pt-4">
                  <summary className="text-sm font-normal uppercase tracking-wide cursor-pointer hover:text-gray-600">
                    Composition and Care
                  </summary>
                  <div className="mt-3 text-xs text-gray-600 leading-relaxed">
                    <p>Care instructions and composition details would go here.</p>
                  </div>
                </details>
                
                <details className="border-t border-gray-200 pt-4">
                  <summary className="text-sm font-normal uppercase tracking-wide cursor-pointer hover:text-gray-600">
                    Size Guide
                  </summary>
                  <div className="mt-3 text-xs text-gray-600 leading-relaxed">
                    <p>Size guide information would go here.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}