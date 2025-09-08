"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Store,
  Star,
} from "lucide-react"
import DeleteProductButton from '@/components/admin/DeleteProductButton'

interface Brand {
  id: string
  name: string
  slug: string
  primary_color: string
  secondary_color: string
}

interface Product {
  id: string
  brand_id: string
  title: string
  slug: string
  sku: string
  price: number
  compare_at_price?: number
  inventory_quantity: number
  low_stock_threshold: number
  featured_image?: string
  is_active: boolean
  created_at: string
  brand?: Brand
  product_variants?: {
    id: string
    title: string
    sku: string
    price: number
    inventory_quantity: number
    is_active: boolean
    size?: string
    color?: string
    barcode?: string
  }[]
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchProducts()
    fetchBrands()
  }, [])

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          brand_id,
          title,
          slug,
          sku,
          price,
          compare_at_price,
          inventory_quantity,
          low_stock_threshold,
          featured_image,
          is_active,
          created_at,
          brand:brands (
            id,
            name,
            slug,
            primary_color,
            secondary_color
          ),
          product_variants (
            id,
            title,
            sku,
            price,
            inventory_quantity,
            is_active,
            size,
            color,
            barcode
          ),
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
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProducts(data || [])
      }
    } catch (err) {
      setError('Failed to fetch products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('id, name, slug, primary_color, secondary_color, accent_color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!fetchError) {
        setBrands(data || [])
      }
    } catch (err) {
      console.error('Error fetching brands:', err)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active)

    const matchesBrand = brandFilter === 'all' || 
      product.brand_id === brandFilter

    return matchesSearch && matchesStatus && matchesBrand
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 right-20 w-32 h-32 bg-amber-400/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-32 left-32 w-24 h-24 bg-orange-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 sm:mb-8"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-red-800">❌ Products Loading Error</h2>
                <p className="text-red-700 font-mono text-xs sm:text-sm">{error}</p>
                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-red-600">
                  <p><strong>Most likely cause:</strong> RLS permissions issue</p>
                  <p><strong>Fix:</strong> Run <code className="bg-red-100 px-2 py-1 rounded text-xs">UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com'</code> in Supabase SQL Editor</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg"
                >
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Products</h1>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Manage products across Kiowa, Omogebyify, and MiniMe brands</p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full lg:w-auto"
              >
                <Link href="/admin/products/new">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium w-full lg:w-auto justify-center">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {[
              {
                title: "Total Products",
                value: products.length,
                icon: Package,
                color: "from-amber-500 to-orange-600",
                bgColor: "bg-amber-500"
              },
              {
                title: "Active Products",
                value: products.filter(p => p.is_active).length,
                icon: TrendingUp,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Products with Variants",
                value: products.filter(p => p.product_variants && p.product_variants.length > 0).length,
                icon: ShoppingBag,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              },
              {
                title: "Products with Filters",
                value: products.filter(p => p.product_filters && p.product_filters.length > 0).length,
                icon: Filter,
                color: "from-purple-500 to-pink-600",
                bgColor: "bg-purple-500"
              },
              {
                title: "Brands",
                value: brands.length,
                icon: Store,
                color: "from-amber-500 to-orange-600",
                bgColor: "bg-amber-500"
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
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`${stat.bgColor} rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 shadow-lg`}
                      >
                        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                      </motion.div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${stat.color} opacity-10 rounded-full`} />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <dt className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
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
          className="mb-6 sm:mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="all">All Products</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid - Mobile Friendly */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="space-y-6"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
            >
              <Card className="bg-white/90 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50 overflow-hidden">
                <CardContent className="p-6">
                  {/* Main Product Info */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.featured_image ? (
                        <img
                          src={product.featured_image}
                          alt={product.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-200 flex items-center justify-center shadow-md">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{product.title}</h3>
                          <p className="text-sm text-gray-500 truncate">{product.slug}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {product.brand && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: product.brand.primary_color }}
                              />
                              <span className="text-sm font-medium text-gray-700">{product.brand.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">SKU</p>
                          <p className="text-gray-900 font-mono">{product.sku}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Price</p>
                          <div>
                            <p className="text-gray-900 font-semibold">₦{product.price.toLocaleString()}</p>
                            {product.compare_at_price && (
                              <p className="text-gray-500 line-through text-xs">₦{product.compare_at_price.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Stock</p>
                          <p className="text-gray-900 font-semibold">{product.inventory_quantity}</p>
                          <p className="text-gray-500 text-xs">Threshold: {product.low_stock_threshold}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Variants</p>
                          <p className="text-gray-900 font-semibold">{product.product_variants?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Filters */}
                  {product.product_filters && product.product_filters.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 font-medium mb-2">Filters</p>
                      <div className="flex flex-wrap gap-1">
                        {product.product_filters.map((filter) => (
                          <Badge 
                            key={filter.id}
                            variant="outline" 
                            className="text-xs px-2 py-1"
                          >
                            {filter.filter_option.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Variants */}
                  {product.product_variants && product.product_variants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 font-medium mb-2">Variants ({product.product_variants.length})</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {product.product_variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                <Package className="w-3 h-3 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {variant.size && <span className="mr-2">Size: {variant.size}</span>}
                                  {variant.color && <span>Color: {variant.color}</span>}
                                </p>
                                <p className="text-xs text-blue-600">{variant.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-blue-900">₦{variant.price.toLocaleString()}</p>
                              <p className="text-xs text-blue-600">Stock: {variant.inventory_quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <DeleteProductButton productId={product.id} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <Link href="/admin/products/new">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium mx-auto">
                    <Plus className="w-4 h-4" />
                    Add First Product
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 