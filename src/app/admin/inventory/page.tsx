'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  PencilIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
} from "lucide-react"

interface ProductWithInventory {
  id: string
  title: string
  sku: string
  barcode?: string
  inventory_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
  has_variants: boolean
  variants?: ProductVariant[]
  featured_image?: string
}

interface ProductVariant {
  id: string
  title: string
  sku: string
  barcode?: string
  inventory_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
  size?: string
  color?: string
  material?: string
}

interface Promotion {
  id: string
  code: string
  description: string
  discount_percent: number
  usage_limit: number
  times_used: number
  is_active: boolean
  valid_from: string
  valid_until: string
}

export default function InventoryManagementPage() {
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'inactive'>('all')
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)
  const [quickSaleMode, setQuickSaleMode] = useState(false)
  const [saleQuantity, setSaleQuantity] = useState<number>(1)
  const [processingQuickSale, setProcessingQuickSale] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState('all')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/403')
        return
      }

      await Promise.all([loadProducts(), loadPromotions()])
      setLoading(false)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/login')
    }
  }

  const loadProducts = async () => {
    try {
      // Try using the products_with_variants view first
      const { data: viewData, error: viewError } = await supabase
        .from('products_with_variants')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (viewError) {
        console.log('Products view not available, using fallback query:', viewError.message)
        
        // Fallback: Get products directly
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('title', { ascending: true })

        if (!productsError && productsData) {
          setProducts(productsData)
        }
      } else if (viewData) {
        setProducts(viewData)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    }
  }

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPromotions(data)
      }
    } catch (error) {
      console.error('Error loading promotions:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadProducts(), loadPromotions()])
    setRefreshing(false)
    toast.success('Inventory refreshed')
  }

  const updateProductInventory = async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ inventory_quantity: newQuantity })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, inventory_quantity: newQuantity } : p
      ))
      
      setEditingProduct(null)
      setNewQuantity(0)
      toast.success('Inventory updated')
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast.error('Failed to update inventory')
    }
  }

  const updateVariantInventory = async (variantId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', variantId)

      if (error) throw error

      setProducts(prev => prev.map(p => ({
        ...p,
        variants: p.variants?.map(v => 
          v.id === variantId ? { ...v, inventory_quantity: newQuantity } : v
        )
      })))
      
      setEditingVariant(null)
      setNewQuantity(0)
      toast.success('Variant inventory updated')
    } catch (error) {
      console.error('Error updating variant inventory:', error)
      toast.error('Failed to update variant inventory')
    }
  }

  const processQuickSale = async (productId: string, quantity: number = saleQuantity) => {
    setProcessingQuickSale(productId)
    try {
      const product = products.find(p => p.id === productId)
      if (!product) throw new Error('Product not found')

      const newQuantity = Math.max(0, product.inventory_quantity - quantity)
      
      const { error } = await supabase
        .from('products')
        .update({ inventory_quantity: newQuantity })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, inventory_quantity: newQuantity } : p
      ))
      
      toast.success(`Sale processed: ${quantity} units of ${product.title}`)
    } catch (error) {
      console.error('Error processing quick sale:', error)
      toast.error('Failed to process sale')
    } finally {
      setProcessingQuickSale(null)
    }
  }

  const processVariantQuickSale = async (variantId: string, quantity: number = saleQuantity) => {
    setProcessingQuickSale(variantId)
    try {
      const product = products.find(p => p.variants?.some(v => v.id === variantId))
      const variant = product?.variants?.find(v => v.id === variantId)
      
      if (!variant) throw new Error('Variant not found')

      const newQuantity = Math.max(0, variant.inventory_quantity - quantity)
      
      const { error } = await supabase
        .from('product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', variantId)

      if (error) throw error

      setProducts(prev => prev.map(p => ({
        ...p,
        variants: p.variants?.map(v => 
          v.id === variantId ? { ...v, inventory_quantity: newQuantity } : v
        )
      })))
      
      toast.success(`Sale processed: ${quantity} units of ${variant.title}`)
    } catch (error) {
      console.error('Error processing variant quick sale:', error)
      toast.error('Failed to process sale')
    } finally {
      setProcessingQuickSale(null)
    }
  }

  const getStockStatus = (quantity: number, threshold: number, trackInventory: boolean) => {
    if (!trackInventory) {
      return { color: 'text-gray-700', bg: 'bg-gray-100', text: 'Not Tracked' }
    } else if (quantity === 0) {
      return { color: 'text-red-700', bg: 'bg-red-100', text: 'Out of Stock' }
    } else if (quantity <= threshold) {
      return { color: 'text-orange-700', bg: 'bg-orange-100', text: 'Low Stock' }
    } else {
      return { color: 'text-green-700', bg: 'bg-green-100', text: 'In Stock' }
    }
  }

  const getPromoStatus = (promo: Promotion) => {
    const now = new Date()
    const validFrom = new Date(promo.valid_from)
    const validUntil = new Date(promo.valid_until)
    
    if (!promo.is_active) {
      return { color: 'text-red-700', bg: 'bg-red-100', text: 'Inactive' }
    } else if (now < validFrom) {
      return { color: 'text-blue-700', bg: 'bg-blue-100', text: 'Pending' }
    } else if (now > validUntil) {
      return { color: 'text-red-700', bg: 'bg-red-100', text: 'Expired' }
    } else {
      return { color: 'text-green-700', bg: 'bg-green-100', text: 'Active' }
    }
  }

  const filteredProducts = products.filter(product => {
    // Search filter - include barcode/product code search for both products and variants
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.variants && product.variants.some(variant => 
                           variant.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           variant.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           variant.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
                         ))
    
    if (!matchesSearch) return false

    // Status filter
    const totalStock = product.has_variants 
      ? product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0
      : product.inventory_quantity

    switch (filter) {
      case 'out_of_stock':
        return totalStock === 0
      case 'low_stock':
        return totalStock > 0 && totalStock <= product.low_stock_threshold
      case 'inactive':
        return !product.is_active
      default:
        return true
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
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
          className="absolute top-20 right-20 w-32 h-32 bg-orange-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg"
                >
                  <Package className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Stock Management</h1>
                  <p className="text-gray-600 text-lg">Track inventory across all brands - Kiowa, Omogebyify, and MiniMe
                    {quickSaleMode 
                      ? '🏪 Store Sale Mode: Search products by code and quickly process in-store sales'
                      : 'Monitor and manage inventory levels across all products'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Quick Sale Mode Toggle */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setQuickSaleMode(!quickSaleMode)}
                    variant={quickSaleMode ? "default" : "outline"}
                    className={`${
                      quickSaleMode 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    } px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium`}
                  >
                    🏪 {quickSaleMode ? 'Exit Store Mode' : 'Store Sale Mode'}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg font-medium"
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Sale Controls - Show when in store mode */}
        <AnimatePresence>
          {quickSaleMode && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6 mb-8 shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-orange-800">🏪 In-Store Sale Controls</h3>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-orange-200">
                  <label className="text-sm font-semibold text-orange-700">Sale Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Filter Dropdown */}
              <div className="lg:w-48">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Products</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{product.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>SKU: {product.sku}</div>
                        {product.barcode && <div>Barcode: {product.barcode}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.has_variants && (
                        <Badge className="bg-blue-100 text-blue-800">Variants</Badge>
                      )}
                      <Badge className={`${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="space-y-3 mb-4">
                    {product.has_variants ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Variants:</div>
                        {product.variants?.map((variant) => {
                          const stockStatus = getStockStatus(variant.inventory_quantity, variant.low_stock_threshold, variant.track_inventory)
                          return (
                            <div key={variant.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-800">{variant.title}</span>
                                <Badge className={`${stockStatus.bg} ${stockStatus.color}`}>
                                  {stockStatus.text}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Stock: {variant.inventory_quantity}
                                </span>
                                {quickSaleMode && (
                                  <Button
                                    onClick={() => processVariantQuickSale(variant.id)}
                                    disabled={processingQuickSale === variant.id || variant.inventory_quantity === 0}
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                  >
                                    {processingQuickSale === variant.id ? 'Processing...' : 'Quick Sale'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Stock Level</span>
                          <Badge className={`${getStockStatus(product.inventory_quantity, product.low_stock_threshold, product.track_inventory).bg} ${getStockStatus(product.inventory_quantity, product.low_stock_threshold, product.track_inventory).color}`}>
                            {getStockStatus(product.inventory_quantity, product.low_stock_threshold, product.track_inventory).text}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-800">
                            {product.inventory_quantity} units
                          </span>
                          {quickSaleMode && (
                            <Button
                              onClick={() => processQuickSale(product.id)}
                              disabled={processingQuickSale === product.id || product.inventory_quantity === 0}
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              {processingQuickSale === product.id ? 'Processing...' : 'Quick Sale'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product.id)
                        setNewQuantity(product.inventory_quantity)
                      }}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Stock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Edit Stock Modal */}
        <AnimatePresence>
          {editingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Update Stock Level</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => updateProductInventory(editingProduct, newQuantity)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProduct(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 