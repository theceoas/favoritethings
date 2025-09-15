'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Plus, Minus, ShoppingBag, Star, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'
import Image from 'next/image'

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
  // Dress-specific fields
  length?: string
  neckline?: string
  sleeve_type?: string
  occasion?: string
  season?: string
  pattern?: string
  fit_type?: string
  care_instructions?: string
}

interface Product {
  id: string
  title: string
  slug: string
  description?: string
  featured_image?: string
  images?: string[]
  price: number
  compare_at_price?: number
  is_featured: boolean
  is_active: boolean
  inventory_quantity: number
  created_at: string
  updated_at: string
  sku?: string
  variants?: ProductVariant[]
  available_sizes?: string[]
  brands?: {
    name: string
    slug: string
    primary_color: string
  }
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem } = useCartStore()

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands (
            name,
            slug,
            primary_color
          ),
          variants:product_variants (
            id,
            title,
            sku,
            price,
            compare_at_price,
            size,
            color,
            material,
            inventory_quantity,
            is_active,
            is_default,
            barcode
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } else {
        setProduct(data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Price not set'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Price not set'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(numPrice)
  }

  // Check if product is available (either main product or any variant)
  const isProductAvailable = () => {
    if (!product) return false
    
    if (product.variants && product.variants.length > 0) {
      // If has variants, check if any variant has stock
      return product.variants.some(variant => 
        variant.is_active && (variant.inventory_quantity || 0) > 0
      )
    } else {
      // If no variants, check main product inventory
      return (product.inventory_quantity || 0) > 0
    }
  }

  // Get current inventory for selected variant or product
  const getCurrentInventory = () => {
    if (!product) return 0
    
    if (selectedVariant) {
      return selectedVariant.inventory_quantity || 0
    } else if (product.variants && product.variants.length > 0) {
      // If has variants but none selected, return max available
      return Math.max(...product.variants.map(v => v.inventory_quantity || 0))
    } else {
      return product.inventory_quantity || 0
    }
  }

  // Get unique sizes from variants
  const uniqueSizes = product?.variants ? [...new Set(product.variants.map(v => v.size).filter((size): size is string => Boolean(size)))] : []

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    // Find the variant that matches the selected size
    const variant = product?.variants?.find(v => v.size === size && v.is_active)
    setSelectedVariant(variant || null)
    setQuantity(1) // Reset quantity when size changes
  }

  // Get current price based on selected variant or product
  const currentPrice = selectedVariant?.price || product?.price || 0
  const currentComparePrice = selectedVariant?.compare_at_price || product?.compare_at_price

  const handleShare = async () => {
    if (!product) return
    
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this product: ${product.title}`,
          url: url,
        })
      } catch (error) {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Product link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }



  const handleAddToCart = async () => {
    if (!product) return
    
    if (uniqueSizes.length > 0 && !selectedSize && !selectedVariant) {
      toast.error('Please select a size')
      return
    }

    setIsAddingToCart(true)
    
    try {
      // Enhanced Safari compatibility with proper async handling
       await new Promise((resolve, reject) => {
         try {
           // Ensure product has required properties for addItem
            const productForCart = {
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              featured_image: product.featured_image,
              sku: product.sku || '',
              inventory_quantity: product.inventory_quantity ?? 0,
              track_inventory: true
            }
            addItem(productForCart, selectedVariant || undefined, quantity)
           // Small delay to ensure state updates properly in Safari
           setTimeout(resolve, 50)
         } catch (error) {
           reject(error)
         }
       })
      
      toast.success(`${product.title} added to cart!`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  // Get all images
  const allImages = [product.featured_image, ...(product.images || [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left side - Images */}
          <div className="space-y-6">
            {/* Main large image */}
            <div className="aspect-[9/16] relative bg-gray-50 rounded-lg overflow-hidden">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[currentImageIndex] || '/placeholder-image.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-6 left-6 space-y-2">
                {product.is_featured && (
                  <Badge className="bg-black text-white text-sm px-3 py-1.5 font-normal">
                    NEW
                  </Badge>
                )}
                {currentComparePrice && currentComparePrice > currentPrice && (
                  <Badge className="bg-red-600 text-white text-sm px-3 py-1.5 font-normal">
                    -{Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Additional images grid */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-[9/16] relative overflow-hidden rounded-lg transition-opacity ${
                      currentImageIndex === index ? 'opacity-100 ring-2 ring-black' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image || '/placeholder-image.jpg'}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Product info */}
          <div className="lg:pl-8">
            <div className="max-w-lg">
              {/* Product title */}
              <h1 className="text-2xl font-normal text-black mb-4 uppercase tracking-wide">
                {product.title}
              </h1>
              
              {/* Price */}
              <div className="flex items-center space-x-4 mb-8">
                <span className="text-2xl font-normal text-black">
                  {formatPrice(currentPrice)}
                </span>
                {currentComparePrice && currentComparePrice > currentPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(currentComparePrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="text-base text-gray-700 mb-8 leading-relaxed">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Size selection */}
              {uniqueSizes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-normal text-black mb-4 uppercase tracking-wide">
                    Size
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {uniqueSizes.map((size) => {
                       const variant = product?.variants?.find(v => v.size === size && v.is_active)
                       const isOutOfStock = !variant || (variant.inventory_quantity || 0) <= 0
                      
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && handleSizeSelect(size)}
                          disabled={isOutOfStock}
                          className={`w-12 h-12 rounded-full border text-sm font-normal transition-all flex items-center justify-center relative ${
                            selectedSize === size
                              ? 'border-black bg-black text-white'
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 bg-white text-black hover:border-black'
                          }`}
                        >
                          {size}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-0.5 bg-gray-400 rotate-45 absolute"></div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <h3 className="text-sm font-normal text-black mb-4 uppercase tracking-wide">
                  Quantity
                </h3>
                <div className="flex items-center border border-gray-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-6 py-4 text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-8 py-4 text-base border-l border-r border-gray-300 min-w-[80px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= getCurrentInventory()}
                    className="px-6 py-4 text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to cart button */}
              <div className="mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !isProductAvailable()}
                  type="button"
                  style={{ 
                    backgroundColor: product.brands?.primary_color || '#F97316',
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  className="w-full h-14 text-base font-normal uppercase tracking-wide border-0 rounded-lg active:scale-98 transition-transform"
                >
                  {isAddingToCart ? (
                    'Adding...'
                  ) : !isProductAvailable() ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Add to Bag
                    </>
                  )}
                </Button>
              </div>

              {/* Product details */}
              <div className="space-y-3 text-sm text-gray-600 uppercase tracking-wide mb-8">
                {product.sku && (
                  <div>
                    Ref. {selectedVariant?.sku || product.sku}
                  </div>
                )}
                <div>
                  {product.brands?.name || 'Unknown Brand'}
                </div>
              </div>

              {/* Additional product info sections */}
              <div className="space-y-4">
                <details className="border-t border-gray-200 pt-4">
                  <summary className="text-sm font-normal uppercase tracking-wide cursor-pointer hover:text-gray-600">
                    Composition and Care
                  </summary>
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                    <p>Care instructions and composition details would go here.</p>
                  </div>
                </details>
                
                <details className="border-t border-gray-200 pt-4">
                  <summary className="text-sm font-normal uppercase tracking-wide cursor-pointer hover:text-gray-600">
                    Size Guide
                  </summary>
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                    <p>Size guide information would go here.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}