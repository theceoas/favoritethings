'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  Star,
  ShoppingBag,
  Heart,
  Eye,
  Package,
  TrendingUp,
  Sparkles,
  Search
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
  sku?: string // Added sku for list view
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

interface Collection {
  id: string
  name: string
  description?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  product_count: number
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
  const [collections, setCollections] = useState<Collection[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and sort states
  
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name' | 'featured'>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [allFilterOptions, setAllFilterOptions] = useState<Map<string, { category: string, option: string, count: number }>>(new Map())

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
        .eq('slug', 'kiowa')
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
      console.log('Kiowa products fetched:', productsData)
      setProducts(productsData || [])

      // Fetch collections for this brand
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select(`
          *,
          product_collections (
            product_id
          )
        `)
        .eq('is_active', true)
        .eq('brand_id', brandData.id)
        .order('sort_order', { ascending: true })

      if (collectionsError) {
        console.error('Error fetching collections:', collectionsError)
        setCollections([])
      } else {
        // Add product count to collections
        const collectionsWithCounts = collectionsData?.map(collection => {
          const productCount = collection.product_collections?.length || 0
          
          return {
            ...collection,
            product_count: productCount
          }
        }) || []
        
        setCollections(collectionsWithCounts)
      }

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
      
      // Price range filter - handle null/undefined/string values
      const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price
      if (productPrice === null || productPrice === undefined || isNaN(productPrice)) {
        // Don't filter out products with invalid prices for now
      } else if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
        return false
      }
      
      // Filter by selected filter options
      if (selectedCollections.length > 0) {
        const productHasSelectedFilter = selectedCollections.some(selectedFilter => {
          const [categoryName, optionName] = selectedFilter.split('-')
          return product.product_filters?.some(filter => 
            filter.filter_option.filter_category.name === categoryName &&
            filter.filter_option.name === optionName
          )
        })
        if (!productHasSelectedFilter) {
          return false
        }
      }
      
      return true
    })
    .sort((a, b) => {
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
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        default:
          return 0
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

      {/* Collections Section */}
      {collections.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="py-6 sm:py-12"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-xl sm:text-3xl font-bold text-amber-800 mb-4 sm:mb-8 text-center">
              Collections
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {collections.slice(0, 2).map((collection) => (
                <motion.div
                  key={collection.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="group cursor-pointer"
                >
                  <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-amber-200/50 overflow-hidden">
                    <div className="relative h-24 sm:h-32 lg:h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full relative overflow-hidden">
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-amber-400" />
                        </div>
                      )}
                      {collection.is_featured && (
                        <Badge className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-amber-500 text-white text-xs">
                          <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                          <span className="hidden sm:inline">Featured</span>
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-amber-800 mb-1 sm:mb-2 line-clamp-1">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-amber-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-amber-600">
                          {collection.product_count} products
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 text-xs sm:text-sm px-1 sm:px-2"
                        >
                          <span className="hidden sm:inline">View</span>
                          →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {/* Show remaining collections on larger screens */}
              {collections.slice(2).map((collection) => (
                <motion.div
                  key={collection.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="group cursor-pointer hidden lg:block"
                >
                  <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-amber-200/50 overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full relative overflow-hidden">
                          <Package className="w-16 h-16 text-amber-400" />
                        </div>
                      )}
                      {collection.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-amber-800 mb-2">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-amber-700 text-sm mb-3">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-600">
                          {collection.product_count} products
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        >
                          View Collection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {/* See All Collections Button - Mobile Only */}
              {collections.length > 2 && (
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="lg:hidden"
                  onClick={() => router.push('/collections?brand=kiowa')}
                >
                  <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-amber-200/50 overflow-hidden cursor-pointer">
                    <div className="relative h-24 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
                      <div className="text-center">
                        <Package className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <span className="text-xs text-amber-600 font-medium">+{collections.length - 2} more</span>
                      </div>
                    </div>
                    <CardContent className="p-2 text-center">
                      <h3 className="text-sm font-semibold text-amber-800 mb-1">
                        See All Collections
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 text-xs px-1"
                      >
                        View All →
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Featured Products Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="py-12"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-amber-800 mb-2">
              Featured Products
            </h2>
            <p className="text-amber-700">
              Discover our most popular and trending pieces
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.is_featured).slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-[3/4] bg- relative overflow-hiddengradient-to-br from-amber-100 to-orange-100">
                      {product.featured_image ? (
                        <img
                          src={product.featured_image}
                          alt={product.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full relative overflow-hidden">
                          <Package className="w-16 h-16 text-amber-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 space-y-1">
                      {product.is_featured && (
                        <Badge className="bg-amber-500 text-white text-xs px-2 py-1">
                          <Star className="w-2 h-2 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <Badge className="bg-[#6A41A1] text-white text-xs px-2 py-1">
                          -{getDiscountPercentage(product.price, product.compare_at_price)}%
                        </Badge>
                      )}
                    </div>

                    {/* Quick Add Button */}
                    <div className="absolute bottom-3 right-3">
                      <Button size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                        <span className="text-lg font-bold text-[#6A41A1]">+</span>
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-amber-800 text-sm line-clamp-2">
                        {product.title}
                      </h3>
                      <Badge className="bg-amber-100 text-amber-800 text-xs ml-2 flex-shrink-0">
                        New
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-amber-600">
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-amber-600 font-medium">4.8</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-600">
                        124 reviews
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Products Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="py-12"
      >
        <div className="container mx-auto px-4">
          {/* Header with stats and controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-amber-800 mb-2">
                Products
              </h2>
              <p className="text-amber-700">
                {filteredAndSortedProducts.length} of {products.length} products
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400" />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="featured">Featured First</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-amber-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-none bg-[#6A41A1] text-white hover:bg-[#5A3A91]"
                  className="rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#4F4032]">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="text-[#6A41A1] hover:text-[#4F4032]"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Clear Filters */}
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPriceRange([0, 100000])
                        setSelectedCollections([])
                        setSearchTerm('')
                      }}
                      className="text-sm text-[#6A41A1] hover:text-[#4F4032] p-0"
                    >
                      CLEAR FILTERS
                    </Button>
                  </div>

                  {/* Sort By */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-[#4F4032] mb-4">SORT BY</h4>
                    <div className="space-y-3">
                      {[
                        { value: 'newest', label: 'NEW' },
                        { value: 'price-low', label: 'ASCENDING PRICE' },
                        { value: 'price-high', label: 'DESCENDING PRICE' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="sort"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="mr-3 text-[#6A41A1] focus:ring-[#6A41A1]"
                          />
                          <span className="text-sm text-[#4F4032]">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Filter Categories */}
                  {(() => {
                    // Group by category using the state
                    const groupedFilters = new Map<string, { option: string, count: number }[]>()
                    Array.from(allFilterOptions.values()).forEach(filter => {
                      if (!groupedFilters.has(filter.category)) {
                        groupedFilters.set(filter.category, [])
                      }
                      groupedFilters.get(filter.category)!.push({
                        option: filter.option,
                        count: filter.count
                      })
                    })
                    
                    return Array.from(groupedFilters.entries()).map(([category, options]) => (
                      <div key={category} className="mb-8">
                        <h4 className="font-semibold text-[#4F4032] mb-4">{category.toUpperCase()}</h4>
                        <div className="space-y-3">
                          {options.map((option, index) => (
                            <label key={index} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedCollections.includes(`${category}-${option.option}`)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCollections([...selectedCollections, `${category}-${option.option}`])
                                  } else {
                                    setSelectedCollections(selectedCollections.filter(id => id !== `${category}-${option.option}`))
                                  }
                                }}
                                className="mr-3 text-[#6A41A1] focus:ring-[#6A41A1]"
                              />
                              <span className="text-sm text-[#4F4032]">
                                {option.option} ({option.count})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}

                  {/* View Results Button */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <Button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-[#6A41A1] hover:bg-[#5A3A91] text-white"
                    >
                      VIEW RESULTS
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid/List */}
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
              >
                {filteredAndSortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <div 
                      className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="relative">
                        <div className="aspect-[3/4] bg- relative overflow-hiddengray-100">
                          {product.featured_image ? (
                            <img
                              src={product.featured_image}
                              alt={product.title}
                              className="w-full h-full"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div className="w-full h-full relative overflow-hidden">
                              <Package className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 space-y-1">
                          {product.is_featured && (
                            <Badge className="bg-amber-500 text-white text-xs px-2 py-1">
                              <Star className="w-2 h-2 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <Badge className="bg-[#6A41A1] text-white text-xs px-2 py-1">
                              -{getDiscountPercentage(product.price, product.compare_at_price)}%
                            </Badge>
                          )}
                        </div>



                        {/* Quick Add Button */}
                        <div className="absolute bottom-2 right-2">
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
                            <span className="text-lg font-bold text-[#6A41A1]">+</span>
                          </Button>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="font-medium text-[#4F4032] mb-1 line-clamp-2 text-sm">
                          {product.title}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#4F4032]">
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
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredAndSortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <Card 
                      className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg overflow-hidden">
                              {product.featured_image ? (
                                <img
                                  src={product.featured_image}
                                  alt={product.title}
                                  className="w-full h-full"
                                  style={{ objectFit: "cover" }}
                                />
                              ) : (
                                <div className="w-full h-full relative overflow-hidden">
                                  <Package className="w-8 h-8 text-amber-400" />
                                </div>
                              )}
                            </div>
                            {product.is_featured && (
                              <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs">
                                <Star className="w-3 h-3 mr-1" />
                              </Badge>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">
                              {product.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-amber-700 mb-2">
                              <span>SKU: {product.sku}</span>
                              <span>Stock: {product.inventory_quantity}</span>
                            </div>

                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl font-bold text-amber-800">
                                {formatPrice(product.price)}
                              </span>
                              {product.compare_at_price && product.compare_at_price > product.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.compare_at_price)}
                                </span>
                              )}
                            </div>
                            <Button 
                              className="bg-amber-600 hover:bg-amber-700 text-white"
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
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

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
                  setPriceRange([0, 1000])
                  setSelectedCollections([])
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