'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  FunnelIcon,
  ChevronDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
} from "lucide-react"

interface OrderItem {
  id: string
  product_id: string
  title: string
  variant_title?: string
  sku: string
  quantity: number
  price: number
  total: number
  products?: {
    title: string
    featured_image?: string
  }
}

interface Order {
  id: string
  order_number: string
  user_id?: string
  email: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  currency: string
  shipping_address: any
  billing_address: any
  tracking_number?: string
  notes?: string
  delivery_method: 'shipping' | 'pickup'
  pickup_date?: string
  pickup_time?: string
  customer_phone?: string
  delivery_phone?: string
  special_instructions?: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [brandFilter, setBrandFilter] = useState('all')
  const [groupByStatus, setGroupByStatus] = useState(true) // Default to group by status
  const [totalStats, setTotalStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    confirmedOrders: 0,
    todayOrders: 0
  })

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            title,
            variant_title,
            sku,
            quantity,
            price,
            total,
            products (
              title,
              featured_image
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, total, created_at')

      if (ordersData) {
        const totalOrders = ordersData.length
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
        const confirmedOrders = ordersData.filter(order => order.status === 'confirmed').length
        const todayOrders = ordersData.filter(order => 
          new Date(order.created_at) >= today
        ).length

        setTotalStats({
          totalOrders,
          totalRevenue,
          confirmedOrders,
          todayOrders
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    orderId: string
    newStatus: string
    order: Order
    deliveryPhone?: string
  } | null>(null)

  const updateOrderStatus = async (orderId: string, status: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    // Check if status change requires confirmation
    if (status === 'shipped' || status === 'delivered') {
      setPendingStatusUpdate({ orderId, newStatus: status, order })
      setShowStatusConfirm(true)
      return
    }

    // Update status immediately for other statuses
    await performStatusUpdate(orderId, status, order)
  }

  const performStatusUpdate = async (orderId: string, status: string, order: Order, deliveryPhone?: string) => {
    try {
      const updateData: any = { status }
      if (deliveryPhone) {
        updateData.delivery_phone = deliveryPhone
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: status as any, delivery_phone: deliveryPhone || o.delivery_phone } : o
      ))

      // Trigger webhooks for specific statuses
      if (status === 'shipped') {
        await triggerShippedWebhook(order, deliveryPhone)
        // Create notification for shipped order
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_shipped',
              orderNumber: order.order_number,
              orderId: order.id
            })
          })
        } catch (notificationError) {
          console.error('❌ Failed to create shipped notification:', notificationError)
        }
      } else if (status === 'delivered') {
        await triggerDeliveredWebhook(order)
        // Create notification for delivered order
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_delivered',
              orderNumber: order.order_number,
              orderId: order.id
            })
          })
        } catch (notificationError) {
          console.error('❌ Failed to create delivered notification:', notificationError)
        }
      }

    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const triggerShippedWebhook = async (order: Order, deliveryPhone?: string) => {
    try {
      console.log('🚚 Triggering shipped webhook for order:', order.order_number)
      
      const webhookData = {
        order_id: order.id,
        order_number: order.order_number,
        customer_email: order.email,
        customer_phone: order.customer_phone,
        delivery_phone: deliveryPhone || order.delivery_phone,
        total_amount: order.total,
        currency: order.currency,
        status: 'shipped',
        payment_status: order.payment_status,
        delivery_method: order.delivery_method,
        items: order.order_items,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        created_at: order.created_at,
        shipped_at: new Date().toISOString(),
        webhook_type: 'order_shipped',
        customer_details: {
          email: order.email,
          phone: order.customer_phone,
          delivery_phone: deliveryPhone || order.delivery_phone,
          name: order.shipping_address?.first_name + ' ' + order.shipping_address?.last_name,
          address: order.shipping_address
        }
      }

      const response = await fetch('https://n8n.srv942568.hstgr.cloud/webhook-test/e8485f7a-5575-4dcc-beb8-6a8dc6387085', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      })

      if (response.ok) {
        console.log('✅ Shipped webhook triggered successfully')
      } else {
        console.warn('⚠️ Shipped webhook failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Error triggering shipped webhook:', error)
    }
  }

  const triggerDeliveredWebhook = async (order: Order) => {
    try {
      console.log('📦 Triggering delivered webhook for order:', order.order_number)
      
      const webhookData = {
        order_id: order.id,
        order_number: order.order_number,
        customer_email: order.email,
        customer_phone: order.customer_phone,
        total_amount: order.total,
        currency: order.currency,
        status: 'delivered',
        payment_status: order.payment_status,
        delivery_method: order.delivery_method,
        items: order.order_items,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        created_at: order.created_at,
        delivered_at: new Date().toISOString(),
        webhook_type: 'order_delivered',
        customer_details: {
          email: order.email,
          phone: order.customer_phone,
          name: order.shipping_address?.first_name + ' ' + order.shipping_address?.last_name,
          address: order.shipping_address
        }
      }

      const response = await fetch('https://n8n.srv942568.hstgr.cloud/webhook-test/d65bb04c-a839-4b91-9500-b7a2b1696d45', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      })

      if (response.ok) {
        console.log('✅ Delivered webhook triggered successfully')
      } else {
        console.warn('⚠️ Delivered webhook failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Error triggering delivered webhook:', error)
    }
  }

  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return

    await performStatusUpdate(
      pendingStatusUpdate.orderId, 
      pendingStatusUpdate.newStatus, 
      pendingStatusUpdate.order,
      pendingStatusUpdate.deliveryPhone
    )
    
    setShowStatusConfirm(false)
    setPendingStatusUpdate(null)
  }

  const cancelStatusUpdate = () => {
    setShowStatusConfirm(false)
    setPendingStatusUpdate(null)
  }

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, payment_status: paymentStatus as any } : order
      ))
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  // Group orders by status
  const groupedOrders = groupByStatus ? filteredOrders.reduce((groups, order) => {
    const status = order.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(order)
    return groups
  }, {} as Record<string, Order[]>) : {}

  // Define the logical order of statuses for display
  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

  // Get status counts for group headers
  const getStatusCount = (status: string) => {
    return filteredOrders.filter(order => order.status === status).length
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const selectAllOrders = () => {
    setSelectedOrders(prev => 
      prev.length === filteredOrders.length 
        ? [] 
        : filteredOrders.map(order => order.id)
    )
  }

  const bulkUpdateStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', selectedOrders)

      if (error) throw error

      setOrders(prev => prev.map(order => 
        selectedOrders.includes(order.id) ? { ...order, status: status as any } : order
      ))
      setSelectedOrders([])
    } catch (error) {
      console.error('Error bulk updating orders:', error)
    }
  }

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
          className="absolute top-20 right-20 w-32 h-32 bg-green-400/10 rounded-full blur-xl"
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
                  className="p-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-lg"
                >
                  <Package className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Order Management</h1>
                  <p className="text-gray-600 text-lg">Monitor orders across all brands - Kiowa, Omogebyify, and MiniMe</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setGroupByStatus(!groupByStatus)}
                    variant={groupByStatus ? "default" : "outline"}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Group by Status
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={fetchOrders}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Orders",
                value: totalStats.totalOrders,
                icon: Package,
                color: "from-purple-500 to-indigo-600",
                bgColor: "bg-purple-500"
              },
              {
                title: "Total Revenue",
                value: `₦${totalStats.totalRevenue.toLocaleString()}`,
                icon: TrendingUp,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Confirmed Orders",
                value: totalStats.confirmedOrders,
                icon: ClockIcon,
                color: "from-yellow-500 to-orange-600",
                bgColor: "bg-yellow-500"
              },
              {
                title: "Today's Orders",
                value: totalStats.todayOrders,
                icon: Calendar,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
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
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders Display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="space-y-6"
        >
          {groupByStatus ? (
            // Group by Status View
            statusOrder
              .filter(status => groupedOrders[status] && groupedOrders[status].length > 0)
              .map((status) => {
                const statusOrders = groupedOrders[status]
                return (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
                  >
                    {/* Status Group Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[status]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {getStatusCount(status)} orders
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Orders in this status */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/30">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-200/30">
                          {statusOrders.map((order, index) => (
                            <motion.tr
                              key={order.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50/30 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{order.email}</div>
                                {order.customer_phone && (
                                  <div className="text-sm text-gray-500">{order.customer_phone}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {order.order_items?.length || 0} items
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className={`text-xs px-2 py-1 rounded-md border-0 focus:ring-2 focus:ring-blue-500 ${statusColors[order.status]}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="refunded">Refunded</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={paymentStatusColors[order.payment_status]}>
                                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  ₦{order.total.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(order.created_at).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <Link href={`/admin/orders/${order.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )
              })
          ) : (
            // Regular Table View
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200/50">
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.email}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.order_items?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-md border-0 focus:ring-2 focus:ring-blue-500 ${statusColors[order.status]}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={paymentStatusColors[order.payment_status]}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₦{order.total.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Status Update Confirmation Modal */}
      {showStatusConfirm && pendingStatusUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Status Update
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to mark order <strong>{pendingStatusUpdate.order.order_number}</strong> as <strong>{pendingStatusUpdate.newStatus}</strong>?
              </p>
              
              {/* Delivery Phone Number Field - Only show for shipped status */}
              {pendingStatusUpdate.newStatus === 'shipped' && (
                <div className="mb-6 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter delivery person's phone number"
                    value={pendingStatusUpdate.deliveryPhone || ''}
                    onChange={(e) => setPendingStatusUpdate(prev => 
                      prev ? { ...prev, deliveryPhone: e.target.value } : null
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be included in the webhook notification
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-6">
                This will trigger an email notification to the customer.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={cancelStatusUpdate}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStatusUpdate}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 