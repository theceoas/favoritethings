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

export default function MiniMeBrandPage() {
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

      // Fetch collections for this brand (sample collections for now)
      const sampleCollections: Collection[] = [
        {
          id: '1',
          name: 'Fun & Playful',
          description: 'Vibrant designs for the young at heart',
          image_url: '/images/collections/fun-playful.jpg',
          is_featured: true,
          is_active: true,
          product_count: productsData?.filter((p: Product) => p.title.toLowerCase().includes('fun')).length || 0
        },
        {
          id: '2',
          name: 'Bright & Bold',
          description: 'Colorful pieces that spark joy',
          image_url: '/images/collections/bright-bold.jpg',
          is_featured: true,
          is_active: true,
          product_count: productsData?.filter((p: Product) => p.title.toLowerCase().includes('bright')).length || 0
        },
        {
          id: '3',
          name: 'Modern Comfort',
          description: 'Cozy designs with contemporary flair',
          image_url: '/images/collections/modern-comfort.jpg',
          is_featured: false,
          is_active: true,
          product_count: productsData?.filter((p: Product) => p.title.toLowerCase().includes('comfort')).length || 0
        }
      ]
      setCollections(sampleCollections)

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

      {/* Collections Section */}
      {collections.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="py-6 sm:py-12"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-xl sm:text-3xl font-bold text-green-800 mb-4 sm:mb-8 text-center">
              Collections
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {collections.slice(0, 2).map((collection) => (
                <motion.div
                  key={collection.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="group cursor-pointer"
                >
                  <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-green-200/50 overflow-hidden">
                    <div className="relative h-24 sm:h-32 lg:h-48 bg-gradient-to-br from-green-100 to-yellow-100">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full relative overflow-hidden">
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-green-400" />
                        </div>
                      )}
                      {collection.is_featured && (
                        <Badge className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-green-500 text-white text-xs">
                          <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                          <span className="hidden sm:inline">Featured</span>
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-green-800 mb-1 sm:mb-2 line-clamp-1">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-green-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-green-600">
                          {collection.product_count} products
                        </span>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
                          View All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

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
          <AnimatePresence>
            {filteredAndSortedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {filteredAndSortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="group cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <Card className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-green-200/50 overflow-hidden">
                      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-green-100 to-yellow-100">
                        {product.featured_image ? (
                          <img
                            src={product.featured_image}
                            alt={product.title}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-green-400" />
                          </div>
                        )}
                        
                        {product.is_featured && (
                          <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                            {getDiscountPercentage(product.price, product.compare_at_price)}% OFF
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-green-800 mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-green-800">
                            {formatPrice(product.price)}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.compare_at_price)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">
                            Stock: {product.inventory_quantity}
                          </span>
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
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
              <Package className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                No products found
              </h3>
              <p className="text-green-700 mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={() => {
                  setPriceRange([0, 1000])
                  setSelectedCollections([])
                  setSearchTerm('')
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
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
        brandColor={brand?.primary_color || '#10B981'}
        brandName={brand?.name || 'MiniMe'}
      />
    </div>
  )
} 