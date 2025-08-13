"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowLeft,
  Star,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  Trash2,
  Plus,
  Package,
  TrendingUp,
  ShoppingBag,
} from "lucide-react"
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

export default function BrandProductsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null)

  useEffect(() => {
    if (brandId) {
      fetchBrandAndProducts()
    }
  }, [brandId])

  const fetchBrandAndProducts = async () => {
    try {
      const supabase = createClient()
      
      // Fetch brand data
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (brandError) throw brandError
      setBrand(brandData)

      // Fetch products for this brand
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
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      setProducts(productsData || [])

    } catch (err) {
      console.error('Error fetching brand and products:', err)
      setError('Failed to load brand and products')
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (productId: string, currentFeatured: boolean) => {
    setUpdatingProduct(productId)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentFeatured })
        .eq('id', productId)

      if (error) throw error

      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, is_featured: !currentFeatured }
          : product
      ))

      toast.success(`Product ${!currentFeatured ? 'marked as' : 'unmarked from'} featured`)
    } catch (err) {
      console.error('Error updating product:', err)
      toast.error('Failed to update product')
    } finally {
      setUpdatingProduct(null)
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active)

    const matchesFeatured = featuredFilter === 'all' || 
      (featuredFilter === 'featured' && product.is_featured) ||
      (featuredFilter === 'not-featured' && !product.is_featured)

    return matchesSearch && matchesStatus && matchesFeatured
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">Loading products...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Brand not found'}</p>
          <Button 
            onClick={() => router.push('/admin/brands')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Brands
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin/brands')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Brands
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{brand.name} Products</h1>
                <p className="text-sm text-gray-600">Manage products and featured status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBrandAndProducts}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Products",
                value: products.length,
                icon: Package,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              },
              {
                title: "Active Products",
                value: products.filter(p => p.is_active).length,
                icon: ShoppingBag,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Featured Products",
                value: products.filter(p => p.is_featured).length,
                icon: Star,
                color: "from-yellow-500 to-orange-600",
                bgColor: "bg-yellow-500"
              },
              {
                title: "In Stock",
                value: products.filter(p => p.inventory_quantity > 0).length,
                icon: TrendingUp,
                color: "from-purple-500 to-pink-600",
                bgColor: "bg-purple-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`${stat.bgColor} rounded-2xl p-4 shadow-lg`}
                      >
                        <stat.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} opacity-10 rounded-full`} />
                    </div>
                    <div className="space-y-2">
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-3xl font-bold text-gray-800">
                        {stat.value}
                      </dd>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Featured Filter */}
              <div className="lg:w-48">
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Products</option>
                  <option value="featured">Featured</option>
                  <option value="not-featured">Not Featured</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50">
                <CardContent className="p-6">
                  {/* Product Image */}
                  <div className="relative mb-4">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
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
                    </div>
                    
                    {/* Featured Badge */}
                    {product.is_featured && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                          <Star className="w-2 h-2 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{product.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>SKU: {product.sku || 'N/A'}</div>
                      <div>Price: {formatPrice(product.price)}</div>
                      <div>Stock: {product.inventory_quantity}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={product.is_featured ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFeatured(product.id, product.is_featured)}
                      disabled={updatingProduct === product.id}
                      className={`flex-1 ${product.is_featured ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                    >
                      {updatingProduct === product.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4 mr-2" />
                      )}
                      {product.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || featuredFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No products are currently available for this brand.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || featuredFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setFeaturedFilter('all')
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
} 