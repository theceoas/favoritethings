"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from '@/lib/supabase/client'
import DashboardStats from '@/components/admin/DashboardStats'
import RecentOrders from '@/components/admin/RecentOrders'
import LowStockProducts from '@/components/admin/LowStockProducts'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart3,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Settings,
  Plus,
  Eye,
  Activity,
  Zap,
  Star,
  Shield,
} from "lucide-react"

interface DashboardData {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  recentOrders: any[]
  lowStockProducts: any[]
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    recentOrders: [],
    lowStockProducts: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState('overview')

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()
      
      try {
        const [
          { count: totalProducts },
          { count: totalOrders },
          { count: totalCustomers },
          { data: recentOrders },
          { data: lowStockProducts }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
          supabase
            .from('orders')
            .select('id, order_number, email, status, total, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('products')
            .select('id, title, sku, barcode, inventory_quantity, low_stock_threshold, track_inventory, is_active')
            .eq('is_active', true)
            .eq('track_inventory', true)
            .order('inventory_quantity', { ascending: true })
            .limit(10)
        ])

        setDashboardData({
          totalProducts: totalProducts || 0,
          totalOrders: totalOrders || 0,
          totalCustomers: totalCustomers || 0,
          recentOrders: recentOrders || [],
          lowStockProducts: lowStockProducts || []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const testNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      })
      const result = await response.json()
      console.log('Test notification result:', result)
      alert('Test notification created! Check the bell icon.')
    } catch (error) {
      console.error('Error creating test notification:', error)
      alert('Error creating test notification')
    }
  }

  const checkNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notifications/debug')
      const result = await response.json()
      console.log('Notification status:', result)
      alert(`Notifications: ${result.unreadNotifications} unread, ${result.totalNotifications} total`)
    } catch (error) {
      console.error('Error checking notification status:', error)
      alert('Error checking notification status')
    }
  }

  const clearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'POST'
      })
      const result = await response.json()
      console.log('Clear notifications result:', result)
      alert('All notifications cleared!')
      // Refresh the page to update the count
      window.location.reload()
    } catch (error) {
      console.error('Error clearing notifications:', error)
      alert('Error clearing notifications')
    }
  }

  const quickActions = [
    {
      title: "Add Product",
      description: "Create a new product listing",
      icon: Plus,
      color: "from-blue-500 to-indigo-600",
      href: "/admin/products/new"
    },
    {
      title: "View Orders",
      description: "Manage customer orders",
      icon: Package,
      color: "from-green-500 to-emerald-600",
      href: "/admin/orders"
    },
    {
      title: "Inventory",
      description: "Check stock levels",
      icon: BarChart3,
      color: "from-orange-500 to-red-600",
      href: "/admin/inventory"
    },
    {
      title: "Analytics",
      description: "View business insights",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
      href: "/admin/analytics"
    }
  ]

  const performanceMetrics = [
    {
      label: "Conversion Rate",
      value: "3.2%",
      change: "+0.8%",
      positive: true,
      icon: TrendingUp
    },
    {
      label: "Avg Order Value",
      value: "₦45,200",
      change: "+12.5%",
      positive: true,
      icon: ShoppingBag
    },
    {
      label: "Customer Satisfaction",
      value: "4.8/5",
      change: "+0.2",
      positive: true,
      icon: Star
    },
    {
      label: "Return Rate",
      value: "2.1%",
      change: "-0.5%",
      positive: true,
      icon: Shield
    }
  ]

  if (isLoading) {
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
          className="absolute top-20 right-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg"
                >
                  <BarChart3 className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage your fashion empire with style
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                  <Activity className="w-4 h-4 mr-2" />
                  Live
                </Badge>
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
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
          <DashboardStats 
            totalProducts={dashboardData.totalProducts}
            totalOrders={dashboardData.totalOrders}
            totalCustomers={dashboardData.totalCustomers}
          />
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <metric.icon className="w-8 h-8 text-blue-600" />
                      <Badge className={`${metric.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {metric.change}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {metric.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Notification Test Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-800">Notification System Test</h2>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={testNotification}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Create Test Notification
              </Button>
              <Button
                onClick={checkNotificationStatus}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Check Notification Status
              </Button>
              <Button
                onClick={clearAllNotifications}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Clear All Notifications
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <div className={`h-2 bg-gradient-to-r ${action.color}`} />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-gradient-to-r ${action.color} rounded-xl text-white`}>
                          <action.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <RecentOrders orders={dashboardData.recentOrders} />
          <LowStockProducts products={dashboardData.lowStockProducts} />
        </motion.div>
      </div>
    </div>
  )
} 