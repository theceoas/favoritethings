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
import ProductSheet from '@/components/ProductSheet'
import ProductTileWithQuickAdd from '@/components/ProductTileWithQuickAdd'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'
import { isProductAvailable } from '@/lib/utils/inventory'

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

interface Brand {
  id: string
  name: string
  slug: string
  description: string
  logo_url?: string
  primary_color: string
  secondary_color: string
}

export default function MiniMeBrandPage() {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name' | 'featured'>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [allFilterOptions, setAllFilterOptions] = useState<Map<string, { category: string, option: string, count: number }>>(new Map())
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
  const [showFeaturedProducts, setShowFeaturedProducts] = useState(false)

  useEffect(() => {
    fetchBrandData()
  }, [])

  const fetchBrandData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch brand data
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', 'minime')
        .single()

      if (brandError) throw brandError
      setBrand(brandData)

      // Fetch products for this brand with filters
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
      console.log('MiniMe products fetched:', productsData)
      setProducts(productsData || [])

      // Fetch all filter options for the filter panel
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

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      // Search filter
      if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Price range filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false
      }
      
      // Filter options
      if (selectedFilters.size > 0) {
        const productFilterKeys = product.product_filters?.map(filter => 
          `${filter.filter_option.filter_category.name}-${filter.filter_option.name}`
        ) || []
        
        const hasMatchingFilter = Array.from(selectedFilters).some(selectedFilter => 
          productFilterKeys.includes(selectedFilter)
        )
        
        if (!hasMatchingFilter) {
          return false
        }
      }
      
      return true
    })
    .sort((a, b) => {
      // Always show featured products first
      const aFeatured = a.is_featured ? 1 : 0
      const bFeatured = b.is_featured ? 1 : 0
      
      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured
      }
      
      // Then apply the selected sort
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
          return 0 // Already sorted by featured status
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
    // Navigate to individual product page
    window.location.href = `/products/${product.slug}`
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleFilterToggle = (filterKey: string) => {
    const newSelectedFilters = new Set(selectedFilters)
    if (newSelectedFilters.has(filterKey)) {
      newSelectedFilters.delete(filterKey)
    } else {
      newSelectedFilters.add(filterKey)
    }
    setSelectedFilters(newSelectedFilters)
  }

  const clearAllFilters = () => {
    setSelectedFilters(new Set())
    setPriceRange([0, 100000])
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800">Loading MiniMe...</p>
        </div>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 relative overflow-hidden">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">Error Loading Brand</h1>
          <p className="text-green-700">{error || 'Brand not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
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
            {/* Cart Icon - Top Right */}
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="sm" className="text-green-800 hover:text-green-600">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            </div>
            
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
              className="text-5xl font-bold text-green-800 mb-4"
            >
              {brand.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-green-700 max-w-2xl mx-auto leading-relaxed"
            >
              {brand.description}
            </motion.p>
          </div>
        </div>
      </motion.div>

            {/* Featured Products Card */}
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
              onClick={() => setShowFeaturedProducts(!showFeaturedProducts)}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-500 p-3 rounded-full">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-1">
                          Featured Products
                        </h2>
                        <p className="text-green-700 text-sm">
                          Our handpicked featured products
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">
                        {products.filter(p => p.is_featured).length} featured products
                      </span>
                      {showFeaturedProducts ? (
                        <ChevronUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Expanded Featured Products */}
            {showFeaturedProducts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {products
                    .filter(p => p.is_featured)
                    .slice(0, 5)
                    .map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group cursor-pointer"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300">
                          <div className="relative">
                            <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                              {product.featured_image ? (
                                <img
                                  src={product.featured_image}
                                  alt={product.title}
                                  className="w-full h-full"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                            </div>
                            
                            {/* Badges */}
                            <div className="absolute top-2 left-2 space-y-1">
                              <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                              {product.compare_at_price && product.compare_at_price > product.price && (
                                <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                                  -{getDiscountPercentage(product.price, product.compare_at_price)}%
                        </Badge>
                      )}
                    </div>

                            {/* Quick Add Button */}
                            <div className="absolute bottom-2 right-2">
                              {isProductAvailable(product) ? (
                                <Button 
                                  size="sm" 
                                  className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await addItem({
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
                                    } catch (error) {
                                      toast.error('Failed to add item to cart')
                                    }
                                  }}
                                >
                                  <span className="text-lg font-bold text-green-600">+</span>
                                </Button>
                              ) : (
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-xs font-bold text-white">×</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-medium text-[#4F4032] mb-1 line-clamp-2 text-sm">
                              {product.title}
                      </h3>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-green-600">
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

      {/* Products Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="py-6 sm:py-12"
      >
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-700"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name</option>
                  <option value="featured">Featured</option>
                </select>
                

              </div>
            </div>
          </div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          >
                {filteredAndSortedProducts.map((product, index) => (
                  <ProductTileWithQuickAdd
                    key={product.id}
                    product={product}
                    onClick={handleProductClick}
                    formatPrice={formatPrice}
                    index={index}
                    showSizes={false}
                  />
                ))}
              </motion.div>
                

          {/* Empty State */}
          {filteredAndSortedProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                No products found
              </h3>
              <p className="text-green-700 mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={clearAllFilters}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Product Detail Sheet */}
      <ProductSheet
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        brandColor={brand?.primary_color || '#10B981'}
        brandName={brand?.name || 'MiniMe'}
      />
    </div>
  )
} 