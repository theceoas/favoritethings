'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import SyncCustomersButton from './sync-button'
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
    fetchCustomers()
    fetchStats()
  }, [])

  const refreshData = () => {
    fetchCustomers()
    fetchStats()
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // Then, get orders data for each customer
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total, created_at, status')
        .eq('status', 'delivered')

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
      }

      // Process and combine the data
      const customersWithStats = profiles.map(profile => {
        const customerOrders = orders?.filter(order => order.user_id === profile.id) || []
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        const totalOrders = customerOrders.length
        const lastOrder = customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        // Determine customer segment
        let segment: 'vip' | 'new' | 'inactive' | 'regular' = 'regular'
        const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)) : Infinity
        const daysSinceRegistration = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

        if (totalSpent > 50000) {
          segment = 'vip'
        } else if (daysSinceRegistration <= 30) {
          segment = 'new'
        } else if (daysSinceLastOrder > 90) {
          segment = 'inactive'
        }

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          phone: profile.phone,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          email_verified: profile.email_verified,
          is_active: profile.is_active,
          marketing_consent: profile.marketing_consent,
          last_login: profile.last_login,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: lastOrder?.created_at,
          favorite_categories: [], // TODO: Implement category analysis
          customer_segment: segment
        }
      })

      setCustomers(customersWithStats)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .eq('status', 'delivered')

      if (orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

        setStats({
          totalCustomers: customers.length,
          newCustomers: customers.filter(c => c.customer_segment === 'new').length,
          vipCustomers: customers.filter(c => c.customer_segment === 'vip').length,
          inactiveCustomers: customers.filter(c => c.customer_segment === 'inactive').length,
          totalRevenue,
          averageOrderValue
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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
        : filteredCustomers.map(customer => customer.id)
    )
  }

  const exportCustomers = () => {
    const csvContent = [
      ['Email', 'Name', 'Phone', 'Total Orders', 'Total Spent', 'Segment', 'Status'],
      ...filteredCustomers.map(customer => [
        customer.email,
        customer.full_name || '',
        customer.phone || '',
        customer.total_orders.toString(),
        customer.total_spent.toString(),
        customer.customer_segment,
        customer.is_active ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
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
                  <SyncCustomersButton onSync={refreshData} />
                </motion.div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Customers",
                value: stats.totalCustomers,
                icon: Users,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              },
              {
                title: "New Customers",
                value: stats.newCustomers,
                icon: UserPlus,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "VIP Customers",
                value: stats.vipCustomers,
                icon: Star,
                color: "from-purple-500 to-pink-600",
                bgColor: "bg-purple-500"
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
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex gap-4">
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
                      <div className="text-sm text-gray-900">{customer.phone || 'No Phone'}</div>
                      <div className="text-sm text-gray-500">
                        {customer.email_verified ? 'Verified' : 'Unverified'}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
        </motion.div>
      </div>
    </div>
  )
} 