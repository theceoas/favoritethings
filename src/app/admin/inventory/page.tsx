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
  variants?: ProductVariant[]
  featured_image?: string
  type?: 'product' | 'other' // Add type to distinguish between products and others
  category?: 'snacks' | 'accessories' // For others items
  price?: number // For others items
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
  const [others, setOthers] = useState<ProductWithInventory[]>([])
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
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'products' | 'others'>('all')
  
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

      await Promise.all([loadProducts(), loadOthers(), loadPromotions()])
      setLoading(false)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/login')
    }
  }

  const loadProducts = async () => {
    try {
      // Get products with their variants
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          sku,
          barcode,
          inventory_quantity,
          low_stock_threshold,
          track_inventory,
          is_active,
          featured_image,
          variants:product_variants (
            id,
            title,
            sku,
            barcode,
            inventory_quantity,
            low_stock_threshold,
            track_inventory,
            is_active,
            size,
            color,
            material
          )
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (productsError) {
        console.error('Error loading products:', productsError)
        toast.error('Failed to load products')
      } else if (productsData) {
        // Add type field to distinguish products from others
        const productsWithType = productsData.map(product => ({
          ...product,
          type: 'product' as const
        }))
        setProducts(productsWithType)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    }
  }

  const loadOthers = async () => {
    try {
      const { data, error } = await supabase
        .from('others')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && data) {
        // Transform others data to match ProductWithInventory interface
        const transformedOthers = data.map(item => ({
          id: item.id,
          title: item.name,
          sku: `OTH-${item.id.slice(0, 8)}`,
          barcode: item.barcode || null,
          inventory_quantity: item.inventory_quantity || 0,
          low_stock_threshold: item.low_stock_threshold || 5,
          track_inventory: item.track_inventory !== false,
          is_active: item.is_active,
          featured_image: item.image_url,
          type: 'other' as const,
          category: item.category,
          price: item.price
        }))
        setOthers(transformedOthers)
      }
    } catch (error) {
      console.error('Error loading others:', error)
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
    await Promise.all([loadProducts(), loadOthers(), loadPromotions()])
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

  const updateOthersInventory = async (itemId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('others')
        .update({ inventory_quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setOthers(prev => prev.map(item => 
        item.id === itemId ? { ...item, inventory_quantity: newQuantity } : item
      ))
      
      setEditingProduct(null)
      setNewQuantity(0)
      toast.success('Others inventory updated')
    } catch (error) {
      console.error('Error updating others inventory:', error)
      toast.error('Failed to update others inventory')
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

  const processOthersQuickSale = async (itemId: string, quantity: number = saleQuantity) => {
    setProcessingQuickSale(itemId)
    try {
      const item = others.find(o => o.id === itemId)
      if (!item) throw new Error('Item not found')

      const newQuantity = Math.max(0, item.inventory_quantity - quantity)
      
      const { error } = await supabase
        .from('others')
        .update({ inventory_quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setOthers(prev => prev.map(item => 
        item.id === itemId ? { ...item, inventory_quantity: newQuantity } : item
      ))
      
      toast.success(`Sale processed: ${quantity} units of ${item.title}`)
    } catch (error) {
      console.error('Error processing others quick sale:', error)
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
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'low_stock' && product.track_inventory && product.inventory_quantity <= product.low_stock_threshold && product.inventory_quantity > 0) ||
      (filter === 'out_of_stock' && product.track_inventory && product.inventory_quantity === 0) ||
      (filter === 'inactive' && !product.is_active)

    const matchesItemType = itemTypeFilter === 'all' || itemTypeFilter === 'products'

    return matchesSearch && matchesFilter && matchesItemType
  })

  const filteredOthers = others.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'low_stock' && item.track_inventory && item.inventory_quantity <= item.low_stock_threshold && item.inventory_quantity > 0) ||
      (filter === 'out_of_stock' && item.track_inventory && item.inventory_quantity === 0) ||
      (filter === 'inactive' && !item.is_active)

    const matchesItemType = itemTypeFilter === 'all' || itemTypeFilter === 'others'

    return matchesSearch && matchesFilter && matchesItemType
  })

  const allItems = [...filteredProducts, ...filteredOthers]

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

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
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
                  className="p-3 sm:p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl sm:rounded-2xl shadow-lg"
                >
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Stock Management</h1>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Track inventory across all brands - Kiowa, Omogebyify, and MiniMe
                    {quickSaleMode 
                      ? ' 🏪 Store Sale Mode: Search products by code and quickly process in-store sales'
                      : ' Monitor and manage inventory levels across all products'
                    }
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                    } px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium w-full sm:w-auto justify-center`}
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
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg font-medium w-full sm:w-auto justify-center"
                  >
                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
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
              className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-orange-800">🏪 In-Store Sale Controls</h3>
                <div className="flex items-center gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-orange-200">
                  <label className="text-xs sm:text-sm font-semibold text-orange-700">Sale Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 sm:w-20 px-2 sm:px-3 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium text-sm"
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
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Item Type Filter */}
                <div>
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as any)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  >
                    <option value="all">All Items</option>
                    <option value="products">Products Only</option>
                    <option value="others">Others Only</option>
                  </select>
                </div>
                
                {/* Filter Dropdown */}
                <div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                  >
                    <option value="all">All Products</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
        >
          {allItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>SKU: {item.sku}</div>
                        {item.barcode && <div>Barcode: {item.barcode}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'other' && (
                        <Badge className="bg-purple-100 text-purple-800">Others</Badge>
                      )}
                      <Badge className={`${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Item Image */}
                  {item.featured_image && (
                    <div className="mb-4">
                      <img 
                        src={item.featured_image} 
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Stock Information */}
                  <div className="space-y-3 mb-4">
                    {item.type === 'product' && item.variants && item.variants.length > 0 ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Variants:</div>
                        {item.variants?.map((variant) => {
                          const stockStatus = getStockStatus(variant.inventory_quantity, variant.low_stock_threshold, variant.track_inventory)
                          return (
                            <div key={variant.id} className="bg-blue-50 rounded-lg p-3 mb-2 border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-blue-900">{variant.title}</span>
                                  {variant.size && (
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                      Size: {variant.size}
                                    </Badge>
                                  )}
                                  {variant.color && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                      Color: {variant.color}
                                    </Badge>
                                  )}
                                </div>
                                <Badge className={`${stockStatus.bg} ${stockStatus.color}`}>
                                  {stockStatus.text}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-blue-700 font-medium">
                                    Stock: {variant.inventory_quantity}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    SKU: {variant.sku}
                                  </span>
                                  {variant.barcode && (
                                    <span className="text-xs text-blue-600">
                                      Barcode: {variant.barcode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!quickSaleMode && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingVariant(variant.id)
                                        setNewQuantity(variant.inventory_quantity)
                                      }}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                    >
                                      <PencilIcon className="w-3 h-3 mr-1" />
                                      Update
                                    </Button>
                                  )}
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
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Stock Level</span>
                          <Badge className={`${getStockStatus(item.inventory_quantity, item.low_stock_threshold, item.track_inventory).bg} ${getStockStatus(item.inventory_quantity, item.low_stock_threshold, item.track_inventory).color}`}>
                            {getStockStatus(item.inventory_quantity, item.low_stock_threshold, item.track_inventory).text}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-800">
                            {item.inventory_quantity} units
                          </span>
                          {quickSaleMode && (
                            <Button
                              onClick={() => processQuickSale(item.id)}
                              disabled={processingQuickSale === item.id || item.inventory_quantity === 0}
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              {processingQuickSale === item.id ? 'Processing...' : 'Quick Sale'}
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
                        setEditingProduct(item.id)
                        setNewQuantity(item.inventory_quantity)
                      }}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Update Stock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Edit Inventory Modal */}
        <AnimatePresence>
          {editingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-bold mb-4">Update Inventory</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const item = allItems.find(i => i.id === editingProduct)
                        if (item) {
                          if (item.type === 'other') {
                            updateOthersInventory(item.id, newQuantity)
                          } else {
                            updateProductInventory(item.id, newQuantity)
                          }
                        }
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Update
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingProduct(null)
                        setNewQuantity(0)
                      }}
                      variant="outline"
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

        {/* Edit Variant Inventory Modal */}
        <AnimatePresence>
          {editingVariant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-bold mb-4 text-blue-900">Update Variant Inventory</h3>
                {(() => {
                  const variant = products
                    .flatMap(p => p.variants || [])
                    .find(v => v.id === editingVariant)
                  return variant ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">{variant.title}</div>
                        <div className="flex gap-2">
                          {variant.size && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              Size: {variant.size}
                            </Badge>
                          )}
                          {variant.color && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                              Color: {variant.color}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">SKU: {variant.sku}</div>
                        <div className="text-xs text-blue-600">Current Stock: {variant.inventory_quantity}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => updateVariantInventory(editingVariant, newQuantity)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Update Variant
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingVariant(null)
                            setNewQuantity(0)
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 