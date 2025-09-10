'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import ProductSheet from '@/components/ProductSheet'
import ProductTileWithQuickAdd from '@/components/ProductTileWithQuickAdd'
import { useSimpleCartStore } from '@/lib/store/simpleCartStore'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Search,
  Filter,
  ShoppingBag,
  Star,
  Package,
  Plus
} from "lucide-react"

interface ProductData {
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
  brand_id: string
  created_at: string
  updated_at: string
  sku?: string
  track_inventory: boolean
  brands?: {
    name: string
    slug: string
    primary_color: string
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const { addItem, loadFromStorage } = useSimpleCartStore()
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
    // Load cart from storage when page loads
    loadFromStorage()
  }, [loadFromStorage])

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands (
            name,
            slug,
            primary_color
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching products:', error)
        setProducts([])
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (product: ProductData) => {
    // Navigate to individual product page using Next.js router
    router.push(`/products/${product.slug}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
    // Load cart from storage when sheet closes
    loadFromStorage()
  }

  const handleAddToCart = (product: ProductData, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      addItem({
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        featured_image: product.featured_image,
        sku: product.sku || ''
      })
      toast.success(`${product.title} added to cart!`)
    } catch (error) {
      toast.error('Failed to add item to cart')
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

  const getDiscountPercentage = (price: number | string | null | undefined, comparePrice?: number | string | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    const numComparePrice = typeof comparePrice === 'string' ? parseFloat(comparePrice) : comparePrice
    
    if (!numComparePrice || !numPrice || isNaN(numPrice) || isNaN(numComparePrice) || numComparePrice <= numPrice) return 0
    return Math.round(((numComparePrice - numPrice) / numComparePrice) * 100)
  }

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brands?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesBrand = brandFilter === 'all' || product.brands?.slug === brandFilter

      return matchesSearch && matchesBrand
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name-asc':
          return a.title.localeCompare(b.title)
        case 'name-desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

  const uniqueBrands = Array.from(new Set(products.map(p => p.brands?.slug).filter(Boolean)))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
              <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">All Products</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>
                    {products.find(p => p.brands?.slug === brand)?.brands?.name || brand}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredAndSortedProducts.length} products found
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {filteredAndSortedProducts.map((product, index) => (
              <ProductTileWithQuickAdd
                key={product.id}
                product={product as any}
                onClick={(p: any) => handleProductClick(p)}
                formatPrice={formatPrice}
                index={index}
                showSizes={true}
              />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || brandFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'No products are currently available.'
              }
            </p>
            {(searchTerm || brandFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setBrandFilter('all')
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Sheet */}
      <ProductSheet
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        brandColor={selectedProduct?.brands?.primary_color || '#F97316'}
        brandName={selectedProduct?.brands?.name || 'Unknown Brand'}
      />
    </div>
  )
}