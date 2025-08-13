'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  UserPlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  UserIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { 
  Users, 
  UserPlus, 
  Star, 
  Clock, 
  TrendingUp, 
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Mail,
  Download,
  Shield,
  Calendar,
} from "lucide-react"

interface Customer {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'customer' | 'admin'
  phone?: string
  created_at: string
  updated_at: string
  email_verified?: boolean
  is_active?: boolean
  marketing_consent?: boolean
  last_login?: string
  // Computed fields
  total_orders: number
  total_spent: number
  last_order_date?: string
  favorite_categories: string[]
  customer_segment: 'vip' | 'new' | 'inactive' | 'regular'
}

interface CustomerStats {
  totalCustomers: number
  newCustomers: number
  vipCustomers: number
  inactiveCustomers: number
  totalRevenue: number
  averageOrderValue: number
}

const segmentColors = {
  vip: 'bg-purple-100 text-purple-800',
  new: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  regular: 'bg-blue-100 text-blue-800'
}

const segmentIcons = {
  vip: StarIcon,
  new: UserPlusIcon,
  inactive: ClockIcon,
  regular: UserIcon
}

export default function CustomersPage() {
  console.log('🚀 CustomersPage component loaded!')
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [brandFilter, setBrandFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState('all')
  const [spendingRange, setSpendingRange] = useState('all')
  const [orderCountRange, setOrderCountRange] = useState('all')
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomers: 0,
    vipCustomers: 0,
    inactiveCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  })

  const sortOptions = [
    { id: 'newest', name: 'Most Recent' },
    { id: 'oldest', name: 'Oldest First' },
    { id: 'highest-spender', name: 'Highest Spender' },
    { id: 'most-orders', name: 'Most Orders' },
    { id: 'name-asc', name: 'Name A-Z' },
    { id: 'name-desc', name: 'Name Z-A' }
  ]

  useEffect(() => {
    console.log('🔄 CustomersPage useEffect triggered')
    fetchCustomers()
  }, [])

  const refreshData = () => {
    console.log('🔄 Refreshing customer data...')
    fetchCustomers()
    fetchStats()
  }

  // Fetch stats when customers change
  useEffect(() => {
    console.log('🔄 Customers changed, fetching stats. Customer count:', customers.length)
    fetchStats()
  }, [customers])

    const fetchCustomers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching customers...')
      
      // Fetch customers from profiles table (this is where customer data is stored)
      console.log('🔍 Fetching from profiles table...')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError)
        return
      }

      console.log('✅ Profiles fetched:', profiles?.length || 0)
      console.log('📋 Sample profiles:', profiles?.slice(0, 3))
      console.log('📋 All profiles:', profiles)
      const allCustomers = profiles || []

      // Fetch addresses to get phone numbers
      let addresses: any[] = []
      try {
        const { data: addressesData, error: addressesError } = await supabase
          .from('addresses')
          .select('user_id, phone, type')
          .not('phone', 'is', null)

        if (addressesError) {
          console.warn('⚠️ Addresses table not accessible:', addressesError)
        } else {
          addresses = addressesData || []
          console.log('✅ Addresses fetched:', addresses.length)
        }
      } catch (addressesTableError) {
        console.warn('⚠️ Addresses table not found, continuing without address data')
      }

      // Fetch all orders to calculate customer stats
      let orders: any[] = []
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('user_id, email, total, created_at, status')
          .not('status', 'in', ['cancelled', 'refunded']) // Include all orders except cancelled/refunded

        if (ordersError) {
          console.warn('⚠️ Orders table not accessible or doesn\'t exist:', ordersError)
        } else {
          orders = ordersData || []
          console.log('✅ Orders fetched:', orders.length)
          console.log('📋 Sample orders:', orders?.slice(0, 3))
          console.log('📋 All orders with user_id:', orders.map(o => ({ user_id: o.user_id, email: o.email, total: o.total })))
        }
      } catch (ordersTableError) {
        console.warn('⚠️ Orders table not found, continuing without order data')
      }

                 // Process and combine the data
           const customersWithStats = allCustomers.map((customer: any) => {
             // Match orders to this customer using user_id and email as fallback
             const customerId = customer.id
             const customerEmail = customer.email
             
             // Try to match by user_id first, then by email as fallback
             let customerOrders = orders.filter(order => order.user_id === customerId) || []
             
             // If no orders found by user_id, try matching by email
             if (customerOrders.length === 0) {
               customerOrders = orders.filter(order => order.email === customerEmail) || []
             }
             
             const totalSpent = customerOrders.reduce((sum, order) => {
               let orderTotal = 0
               if (typeof order.total === 'string') {
                 orderTotal = parseFloat(order.total) || 0
               } else if (typeof order.total === 'number') {
                 orderTotal = order.total
               }
               
               // If the total seems to be in kobo (very large numbers), convert to naira
               if (orderTotal > 1000000) { // If more than 1 million, likely in kobo
                 orderTotal = orderTotal / 100
               }
               
               return sum + orderTotal
             }, 0)
             const totalOrders = customerOrders.length
             const lastOrder = customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

             // Debug logging for order matching
             if (customer.email === 'ogfarmboy01@gmail.com') {
               console.log('🔍 Debug customer order matching:', {
                 customerId,
                 customerEmail: customer.email,
                 allOrders: orders.length,
                 customerOrders: customerOrders.length,
                 customerOrdersData: customerOrders,
                 totalSpent,
                 totalOrders,
                 matchingMethod: customerOrders.length > 0 ? (orders.find(o => o.user_id === customerId) ? 'user_id' : 'email') : 'none'
               })
             }

             // Get phone numbers from addresses
             const customerAddresses = addresses.filter(addr => addr.user_id === customerId) || []
             const addressPhones = customerAddresses.map(addr => addr.phone).filter(Boolean)
             const primaryPhone = customer.phone || addressPhones[0] || null

        // Determine customer segment
        let segment: 'vip' | 'new' | 'inactive' | 'regular' = 'regular'
        const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)) : Infinity
        const daysSinceRegistration = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))

        if (totalSpent > 50000) {
          segment = 'vip'
        } else if (daysSinceRegistration <= 30) {
          segment = 'new'
        } else if (daysSinceLastOrder > 90) {
          segment = 'inactive'
        }

                     return {
               id: customer.id || customer.user_id,
               email: customer.email,
               full_name: customer.full_name || customer.name,
               avatar_url: customer.avatar_url,
               role: customer.role || 'customer',
               phone: primaryPhone,
               created_at: customer.created_at,
               updated_at: customer.updated_at,
               email_verified: customer.email_verified,
               is_active: customer.is_active !== false, // Default to true if not specified
               marketing_consent: customer.marketing_consent,
               last_login: customer.last_login || null, // Handle missing column
               total_orders: totalOrders,
               total_spent: totalSpent,
               last_order_date: lastOrder?.created_at,
               favorite_categories: [], // TODO: Implement category analysis
               customer_segment: segment
             }
      })

      console.log('✅ Processed customers:', customersWithStats.length)
      console.log('📋 Sample processed customers:', customersWithStats.slice(0, 3))
      console.log('📋 All processed customers:', customersWithStats)
      setCustomers(customersWithStats)
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching customer stats...')
      
      // Fetch customers count
      const { data: customerProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'customer')
      
      const totalCustomers = customerProfiles?.length || 0
      
      // Fetch orders for revenue calculation - use the same logic as in fetchCustomers
      let orders: any[] = []
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('user_id, email, total, status, created_at')
          .not('status', 'in', ['cancelled', 'refunded']) // Include all orders except cancelled/refunded

        if (ordersError) {
          console.warn('⚠️ Orders table not accessible or doesn\'t exist:', ordersError)
        } else {
          orders = ordersData || []
          console.log('✅ Stats orders fetched:', orders.length)
          console.log('📋 Sample orders for stats:', orders.slice(0, 3))
          console.log('📋 All orders for stats:', orders.map(o => ({ user_id: o.user_id, email: o.email, total: o.total })))
        }
      } catch (ordersTableError) {
        console.warn('⚠️ Orders table not found, continuing without order data')
      }

      // Calculate total revenue from all orders
      const totalRevenue = orders.reduce((sum, order) => {
        // Handle both string and number formats, and convert from kobo to naira if needed
        let orderTotal = 0
        if (typeof order.total === 'string') {
          orderTotal = parseFloat(order.total) || 0
        } else if (typeof order.total === 'number') {
          orderTotal = order.total
        }
        
        // If the total seems to be in kobo (very large numbers), convert to naira
        if (orderTotal > 1000000) { // If more than 1 million, likely in kobo
          orderTotal = orderTotal / 100
        }
        
        return sum + orderTotal
      }, 0)
      
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

      // Calculate customer segments based on current customers state
      const newCustomers = customers.filter(c => c.customer_segment === 'new').length
      const inactiveCustomers = customers.filter(c => c.customer_segment === 'inactive').length

      const newStats = {
        totalCustomers,
        newCustomers,
        vipCustomers: 0, // Remove VIP customers
        inactiveCustomers,
        totalRevenue,
        averageOrderValue
      }

      console.log('📊 Stats calculation:', {
        totalCustomers: newStats.totalCustomers,
        totalRevenue: newStats.totalRevenue,
        ordersCount: orders.length,
        sampleOrders: orders.slice(0, 3),
        revenueCalculation: orders.map(o => {
          let orderTotal = 0
          if (typeof o.total === 'string') {
            orderTotal = parseFloat(o.total) || 0
          } else if (typeof o.total === 'number') {
            orderTotal = o.total
          }
          
          if (orderTotal > 1000000) {
            orderTotal = orderTotal / 100
          }
          
          return { 
            original: o.total, 
            parsed: orderTotal,
            type: typeof o.total
          }
        })
      })

      console.log('✅ Stats calculated:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSegment = segmentFilter === 'all' || customer.customer_segment === segmentFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && customer.is_active) ||
      (statusFilter === 'inactive' && !customer.is_active)

    return matchesSearch && matchesSegment && matchesStatus
  })

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'highest-spender':
        return b.total_spent - a.total_spent
      case 'most-orders':
        return b.total_orders - a.total_orders
      case 'name-asc':
        return (a.full_name || a.email).localeCompare(b.full_name || b.email)
      case 'name-desc':
        return (b.full_name || b.email).localeCompare(a.full_name || a.email)
      default:
        return 0
    }
  })

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const selectAllCustomers = () => {
    setSelectedCustomers(prev => 
      prev.length === filteredCustomers.length 
        ? [] 
        : filteredCustomers.map(c => c.id)
    )
  }

  const exportCustomers = () => {
    // TODO: Implement export functionality
    console.log('Exporting customers:', selectedCustomers.length)
  }

  const bulkUpdateStatus = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .in('id', selectedCustomers)

      if (error) throw error

      setCustomers(prev => prev.map(customer => 
        selectedCustomers.includes(customer.id) 
          ? { ...customer, is_active: isActive }
          : customer
      ))
      setSelectedCustomers([])
    } catch (error) {
      console.error('Error bulk updating customers:', error)
    }
  }

  const bulkUpdateMarketingConsent = async (consent: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ marketing_consent: consent })
        .in('id', selectedCustomers)

      if (error) throw error

      setCustomers(prev => prev.map(customer => 
        selectedCustomers.includes(customer.id) 
          ? { ...customer, marketing_consent: consent }
          : customer
      ))
      setSelectedCustomers([])
    } catch (error) {
      console.error('Error bulk updating marketing consent:', error)
    }
  }

  const sendBulkEmail = async (type: 'welcome' | 'promotional' | 'newsletter') => {
    // TODO: Implement email sending functionality
    console.log(`Sending ${type} email to ${selectedCustomers.length} customers`)
    setSelectedCustomers([])
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"
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
                  className="p-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-lg"
                >
                  <Users className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Customer Management</h1>
                  <p className="text-gray-600 text-lg">Monitor customers across all brands - Kiowa, Omogebyify, and MiniMe</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={exportCustomers}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Total Customers",
                value: customers.length, // Use actual customers array length instead of stats
                icon: Users,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              },
              {
                title: "New Customers",
                value: customers.filter(c => c.customer_segment === 'new').length, // Use actual customers array
                icon: UserPlus,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Total Revenue",
                value: `₦${stats.totalRevenue.toLocaleString()}`,
                icon: TrendingUp,
                color: "from-yellow-500 to-orange-600",
                bgColor: "bg-yellow-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Segments</option>
                  <option value="vip">VIP</option>
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
        >
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600 text-lg">Loading customers...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && sortedCustomers.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || segmentFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'No customers have been added yet.'}
                </p>
                {searchTerm || segmentFilter !== 'all' || statusFilter !== 'all' ? (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSegmentFilter('all')
                      setStatusFilter('all')
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={refreshData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Customer Table */}
          {!loading && sortedCustomers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={selectAllCustomers}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200/50">
                  {sortedCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {customer.avatar_url ? (
                              <Image
                                className="h-10 w-10 rounded-full"
                                src={customer.avatar_url}
                                alt={customer.full_name || customer.email}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(customer.full_name || customer.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.phone ? (
                            customer.phone
                          ) : (
                            <span className="text-gray-400">No Phone</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.total_orders}</div>
                        <div className="text-sm text-gray-500">
                          {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'No orders'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{customer.total_spent.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={segmentColors[customer.customer_segment]}>
                          {customer.customer_segment.charAt(0).toUpperCase() + customer.customer_segment.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/customers/${customer.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 