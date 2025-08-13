'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Star,
  ShoppingBag,
  Heart,
  Eye,
  Package,
  TrendingUp,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ProductDetailModal from '@/components/ProductDetailModal'
import CartIcon from '@/components/CartIcon'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'

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
  product_filters?: {
    id: string
    filter_option: {
      id: string
      name: string
      value: string
      filter_category: {
        id: string
        name: string
        type: string
      }
    }
  }[]
}

interface Brand {
  id: string
  name: string
  slug: string
  description: string
  logo_url?: string
  primary_color: string
  secondary_color: string
}

export default function KiowaBrandPage() {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name' | 'featured'>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [allFilterOptions, setAllFilterOptions] = useState<Map<string, { category: string, option: string, count: number }>>(new Map())
  const [showBestSellers, setShowBestSellers] = useState(false)
  const [showNewArrivals, setShowNewArrivals] = useState(false)

  useEffect(() => {
    fetchBrandData()
  }, [])

  const fetchBrandData = async () => {
    try {
      const supabase = createClient()
      
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', 'kiowa')
        .single()

      if (brandError) throw brandError
      setBrand(brandData)

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_filters (
            id,
            filter_option:filter_options (
              id,
              name,
              value,
              filter_category:filter_categories (
                id,
                name,
                type
              )
            )
          )
        `)
        .eq('brand_id', brandData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      console.log('All Kiowa products:', productsData)
      console.log('Featured products:', productsData?.filter(p => p.is_featured))
      setProducts(productsData || [])

      const { data: allFilterCategories, error: filterError } = await supabase
        .from('filter_categories')
        .select(`
          id,
          name,
          type,
          filter_options (
            id,
            name,
            value,
            product_filters (
              product_id
            )
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (filterError) {
        console.error('Error fetching filter options:', filterError)
      } else if (allFilterCategories) {
        const filterOptionsMap = new Map<string, { category: string, option: string, count: number }>()
        
        allFilterCategories.forEach((category: any) => {
          category.filter_options?.forEach((option: any) => {
            const key = `${category.name}-${option.name}`
            const productCount = option.product_filters?.length || 0
            
            filterOptionsMap.set(key, {
              category: category.name,
              option: option.name,
              count: productCount
            })
          })
        })
        
        setAllFilterOptions(filterOptionsMap)
      }
    } catch (error) {
      console.error('Error fetching brand data:', error)
      setError('Failed to load brand data')
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedProducts = products
    .filter(product => {
      if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price
      if (productPrice === null || productPrice === undefined || isNaN(productPrice)) {
        return true
      } else if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      const aFeatured = a.is_featured ? 1 : 0
      const bFeatured = b.is_featured ? 1 : 0
      
      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured
      }
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.title.localeCompare(b.title)
        case 'featured':
          return 0
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800">Loading Kiowa...</p>
        </div>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-800 mb-4">Error Loading Brand</h1>
          <p className="text-amber-700">{error || 'Brand not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brand.primary_color}20, ${brand.secondary_color}20)`
        }}
      >
        <div className="container mx-auto px-4 py-16">
          <div className="text-center relative">
            {brand.logo_url && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src={brand.logo_url}
                alt={brand.name}
                className="h-24 mx-auto mb-6"
              />
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-amber-800 mb-4"
            >
              {brand.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-amber-700 max-w-2xl mx-auto leading-relaxed"
            >
              {brand.description}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Best Sellers Card */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="py-6 sm:py-12"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              className="group cursor-pointer"
              onClick={() => setShowBestSellers(!showBestSellers)}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-amber-500 p-3 rounded-full">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-amber-800 mb-1">
                          Featured Products
                        </h2>
                        <p className="text-amber-700 text-sm">
                          Our handpicked featured products
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-amber-600 font-medium">
                        {products.filter(p => p.is_featured).length} featured products
                      </span>
                      {showBestSellers ? (
                        <ChevronUp className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Expanded Best Sellers Products */}
            {showBestSellers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {filteredAndSortedProducts.filter(p => p.is_featured).slice(0, 5).map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 aspect-[3/4]">
                        <div className="relative h-48 bg-gray-100">
                          {product.featured_image ? (
                            <img
                              src={product.featured_image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {product.is_featured && (
                            <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          
                          {product.compare_at_price && product.compare_at_price > product.price && !product.is_featured && (
                            <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
                              {getDiscountPercentage(product.price, product.compare_at_price)}% OFF
                            </Badge>
                          )}
                          
                          {product.inventory_quantity === 0 && (
                            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                              Out of Stock
                            </Badge>
                          )}
                          
                          <Button
                            size="sm"
                            className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (product.inventory_quantity > 0) {
                                addItem({
                                  id: product.id,
                                  title: product.title,
                                  slug: product.slug,
                                  price: product.price,
                                  featured_image: product.featured_image,
                                  sku: product.sku || '',
                                  inventory_quantity: product.inventory_quantity,
                                  track_inventory: true
                                })
                                toast.success(`${product.title} added to cart!`)
                              }
                            }}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                            {product.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-600">
                              {formatPrice(product.price)}
                            </span>
                            {product.compare_at_price && product.compare_at_price > product.price && (
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(product.compare_at_price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Main Products Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="py-6 sm:py-12"
      >
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-800 mb-2">
                All Products
              </h2>
              <p className="text-amber-700">
                {filteredAndSortedProducts.length} products available
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-amber-200 rounded-md text-amber-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="featured">Featured First</option>
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Search Products
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-amber-700 self-center">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
                      className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      setPriceRange([0, 100000])
                    }}
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredAndSortedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 aspect-[3/4]">
                  <div className="relative h-48 bg-gray-100">
                    {product.featured_image ? (
                      <img
                        src={product.featured_image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {product.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    
                    {product.compare_at_price && product.compare_at_price > product.price && !product.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
                        {getDiscountPercentage(product.price, product.compare_at_price)}% OFF
                      </Badge>
                    )}
                    
                    {product.inventory_quantity === 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                        Out of Stock
                      </Badge>
                    )}
                    
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (product.inventory_quantity > 0) {
                          addItem({
                            id: product.id,
                            title: product.title,
                            slug: product.slug,
                            price: product.price,
                            featured_image: product.featured_image,
                            sku: product.sku || '',
                            inventory_quantity: product.inventory_quantity,
                            track_inventory: true
                          })
                          toast.success(`${product.title} added to cart!`)
                        }
                      }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">
                No products found
              </h3>
              <p className="text-amber-700 mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={() => {
                  setPriceRange([0, 100000])
                  setSearchTerm('')
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        brandColor={brand?.primary_color || '#F59E0B'}
        brandName={brand?.name || 'Kiowa'}
      />
    </div>
  )
} 