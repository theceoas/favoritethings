'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
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
  Image as ImageIcon,
  Sparkles,
  Package,
  Coffee,
  PencilIcon,
  TrashIcon
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'

interface OtherItem {
  id: string
  name: string
  description: string
  image_url?: string
  category: 'snacks' | 'accessories'
  price: number
  barcode?: string
  inventory_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function AdminOthersPage() {
  const [others, setOthers] = useState<OtherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<OtherItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    image_url: '',
    category: 'snacks' as 'snacks' | 'accessories',
    price: 0,
    barcode: '',
    inventory_quantity: 0,
    low_stock_threshold: 5,
    track_inventory: true,
    is_active: true,
    sort_order: 0
  })

  useEffect(() => {
    fetchOthers()
  }, [])

  const fetchOthers = async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('others')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      setOthers(data || [])

    } catch (error) {
      console.error('Error fetching others:', error)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const filteredOthers = others.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.is_active) ||
      (statusFilter === 'inactive' && !item.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleCreateItem = async () => {
    if (!newItem.name || !newItem.description || newItem.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('others')
        .insert([newItem])
        .select()
        .single()

      if (error) throw error

      setOthers(prev => [data, ...prev])
      setNewItem({
        name: '',
        description: '',
        image_url: '',
        category: 'snacks',
        price: 0,
        barcode: '',
        inventory_quantity: 0,
        low_stock_threshold: 5,
        track_inventory: true,
        is_active: true,
        sort_order: 1
      })
      setIsDialogOpen(false)
      toast.success('Item created successfully!')

    } catch (error: any) {
      console.error('Error creating item:', error)
      toast.error(`Failed to create item: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('others')
        .delete()
        .eq('id', id)

      if (error) throw error

      setOthers(prev => prev.filter(item => item.id !== id))
      toast.success('Item deleted successfully!')

    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast.error(`Failed to delete item: ${error.message}`)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('others')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setOthers(prev => prev.map(item => 
        item.id === id ? { ...item, is_active: !currentStatus } : item
      ))
      toast.success(`Item ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)

    } catch (error: any) {
      console.error('Error updating item status:', error)
      toast.error(`Failed to update item status: ${error.message}`)
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

  const handleEdit = (item: OtherItem) => {
    setNewItem({
      name: item.name,
      description: item.description,
      image_url: item.image_url || '',
      category: item.category,
      price: item.price,
      barcode: item.barcode || '',
      inventory_quantity: item.inventory_quantity,
      low_stock_threshold: item.low_stock_threshold,
      track_inventory: item.track_inventory,
      is_active: item.is_active,
      sort_order: item.sort_order
    })
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    if (!newItem.name || !newItem.description || newItem.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('others')
        .update({
          name: newItem.name,
          description: newItem.description,
          image_url: newItem.image_url,
          category: newItem.category,
          price: newItem.price,
          barcode: newItem.barcode || null,
          inventory_quantity: newItem.inventory_quantity,
          low_stock_threshold: newItem.low_stock_threshold,
          track_inventory: newItem.track_inventory,
          is_active: newItem.is_active,
          sort_order: newItem.sort_order
        })
        .eq('id', editingItem.id)
        .select()
        .single()

      if (error) throw error

      setOthers(prev => prev.map(item => 
        item.id === editingItem.id ? data : item
      ))
      setNewItem({
        name: '',
        description: '',
        image_url: '',
        category: 'snacks',
        price: 0,
        barcode: '',
        inventory_quantity: 0,
        low_stock_threshold: 5,
        track_inventory: true,
        is_active: true,
        sort_order: 0
      })
      setEditingItem(null)
      setIsDialogOpen(false)
      toast.success('Item updated successfully!')

    } catch (error: any) {
      console.error('Error updating item:', error)
      toast.error(`Failed to update item: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      image_url: '',
      category: 'snacks',
      price: 0,
      barcode: '',
      inventory_quantity: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      is_active: true,
      sort_order: 0
    })
    setEditingItem(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
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
          className="absolute top-20 right-20 w-32 h-32 bg-purple-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-pink-400/10 rounded-full blur-xl"
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
                  className="p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-lg"
                >
                  <Package className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Others Management</h1>
                  <p className="text-gray-600 text-lg">Manage snacks, accessories, and other items</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) {
                    resetForm()
                  }
                }}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium">
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                    <DialogDescription>
                      {editingItem ? 'Edit an existing snack or accessory item.' : 'Create a new snack or accessory item.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Item name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'snacks' | 'accessories' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="snacks">Snacks</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={newItem.barcode}
                        onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                        placeholder="Barcode number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inventory_quantity">Stock Quantity</Label>
                      <Input
                        id="inventory_quantity"
                        type="number"
                        value={newItem.inventory_quantity}
                        onChange={(e) => setNewItem({ ...newItem, inventory_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={newItem.low_stock_threshold}
                        onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: parseInt(e.target.value) || 5 })}
                        placeholder="5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Item description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="image_url">Image URL</Label>
                      <ImageUpload
                        value={newItem.image_url}
                        onChange={(url) => setNewItem({ ...newItem, image_url: url })}
                        bucket="others-images"
                        folder="others"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="track_inventory"
                        type="checkbox"
                        checked={newItem.track_inventory}
                        onChange={(e) => setNewItem({ ...newItem, track_inventory: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="track_inventory">Track Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={newItem.is_active}
                        onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={editingItem ? handleUpdateItem : handleCreateItem}
                      disabled={isCreating}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {isCreating ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                    </Button>
                    {editingItem && (
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="snacks">Snacks</option>
                  <option value="accessories">Accessories</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOthers.map((item) => {
                  const stockStatus = getStockStatus(item.inventory_quantity, item.low_stock_threshold, item.track_inventory)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.category === 'snacks' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>₦{item.price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.inventory_quantity}</span>
                          <Badge className={`${stockStatus.bg} ${stockStatus.color}`}>
                            {stockStatus.text}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {item.barcode || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            size="sm"
                            variant="outline"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteItem(item.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 