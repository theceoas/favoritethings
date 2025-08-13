'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  HeartIcon,
  StarIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid'

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
}

interface Address {
  id: string
  type: 'shipping' | 'billing' | 'both'
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  created_at: string
  order_items: {
    id: string
    title: string
    quantity: number
    price: number
    products?: {
      title: string
      featured_image?: string
    }
  }[]
}

interface WishlistItem {
  id: string
  created_at: string
  products: {
    id: string
    title: string
    price: number
    featured_image?: string
  }
}

interface CustomerMetrics {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string
  favoriteCategories: string[]
  lifetimeValue: number
  orderFrequency: number
  returnRate: number
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notes, setNotes] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  useEffect(() => {
    if (customerId) {
      fetchCustomerData()
    }
  }, [customerId])

  const fetchCustomerData = async () => {
    setLoading(true)
    try {
      // Fetch customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single()

      if (profileError) throw profileError
      setCustomer(profile)

      // Fetch addresses with phone numbers
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', customerId)
        .order('is_default', { ascending: false })

      setAddresses(addressData || [])

      // Get phone numbers from addresses
      const addressPhones = addressData?.filter(addr => addr.phone).map(addr => addr.phone) || []

      // Fetch orders with items
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total,
          created_at,
          order_items (
            id,
            title,
            quantity,
            price,
            products (
              title,
              featured_image
            )
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })

      setOrders(orderData || [])

      // Fetch wishlist
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          products (
            id,
            title,
            price,
            featured_image
          )
        `)
        .eq('user_id', customerId)

      setWishlist(wishlistData || [])

      // Calculate metrics
      if (orderData) {
        const totalOrders = orderData.length
        const totalSpent = orderData.reduce((sum, order) => sum + order.total, 0)
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
        const lastOrderDate = totalOrders > 0 ? orderData[0].created_at : undefined

        // Calculate order frequency (orders per month)
        const firstOrderDate = totalOrders > 0 ? new Date(orderData[totalOrders - 1].created_at) : new Date()
        const monthsSinceFirst = Math.max(1, (Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        const orderFrequency = totalOrders / monthsSinceFirst

        setMetrics({
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate,
          favoriteCategories: [], // TODO: Calculate from order data
          lifetimeValue: totalSpent, // For now, same as total spent
          orderFrequency,
          returnRate: totalOrders > 1 ? ((totalOrders - 1) / totalOrders) * 100 : 0
        })
      }

    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCustomerStatus = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', customerId)

      if (error) throw error

      setCustomer(prev => prev ? { ...prev, is_active: isActive } : null)
    } catch (error) {
      console.error('Error updating customer status:', error)
    }
  }

  const updateCustomerRole = async (role: 'customer' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', customerId)

      if (error) throw error

      setCustomer(prev => prev ? { ...prev, role } : null)
    } catch (error) {
      console.error('Error updating customer role:', error)
    }
  }

  const getCustomerSegment = () => {
    if (!metrics) return 'new'
    
    if (metrics.totalSpent > 200000) return 'vip'
    if (metrics.totalOrders === 0) return 'new'
    
    const daysSinceLastOrder = metrics.lastOrderDate 
      ? (Date.now() - new Date(metrics.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      : 999
    
    if (daysSinceLastOrder > 180) return 'inactive'
    return 'regular'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      processing: 'text-purple-600 bg-purple-100',
      shipped: 'text-green-600 bg-green-100',
      delivered: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      refunded: 'text-gray-600 bg-gray-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading customer details...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
        <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Customers
        </Link>
      </div>
    )
  }

  const segment = getCustomerSegment()
  const segmentColors = {
    vip: 'text-purple-600 bg-purple-100',
    new: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    regular: 'text-blue-600 bg-blue-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/customers"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-[#6A41A1]">Customer Details</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => updateCustomerStatus(!customer.is_active)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              customer.is_active
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {customer.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <Link
            href={`/admin/customers/${customerId}/edit`}
            className="flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
            {customer.avatar_url ? (
              <Image
                src={customer.avatar_url}
                alt={customer.full_name || customer.email}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {customer.full_name || 'Unnamed Customer'}
              </h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${segmentColors[segment]}`}>
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Customer
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                customer.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {customer.is_active ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-4 h-4 inline mr-1" />
                    Inactive
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center text-gray-600">
                <EnvelopeIcon className="w-5 h-5 mr-2" />
                <span>{customer.email}</span>
              </div>
              {(customer.phone || addresses.some(addr => addr.phone)) && (
                <div className="flex items-center text-gray-600">
                  <PhoneIcon className="w-5 h-5 mr-2" />
                  <div>
                    {customer.phone && <div>{customer.phone}</div>}
                    {addresses.filter(addr => addr.phone && addr.phone !== customer.phone).map((addr, index) => (
                      <div key={index} className="text-sm text-gray-500">
                        {addr.phone} ({addr.type})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="w-5 h-5 mr-2" />
                <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
              {customer.last_login && (
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span>Last login {new Date(customer.last_login).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <EnvelopeIcon className="w-5 h-5 mr-2" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{customer.email}</p>
              <p className="text-xs text-gray-500">
                {customer.email_verified ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>
          
          {(customer.phone || addresses.some(addr => addr.phone)) && (
            <div className="flex items-center space-x-3">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <div>
                {customer.phone && (
                  <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                )}
                {addresses.filter(addr => addr.phone && addr.phone !== customer.phone).map((addr, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {addr.phone} ({addr.type})
                  </p>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{addresses.length} addresses</p>
              <p className="text-xs text-gray-500">Saved locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-[#6A41A1]">{metrics.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-[#6A41A1]/10 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="w-6 h-6 text-[#6A41A1]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-green-600">₦{metrics.totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-3xl font-bold text-blue-600">₦{Math.round(metrics.averageOrderValue).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Return Rate</p>
                <p className="text-3xl font-bold text-purple-600">{Math.round(metrics.returnRate)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: UserIcon },
              { id: 'orders', name: 'Orders', icon: ShoppingBagIcon, count: orders.length },
              { id: 'addresses', name: 'Addresses', icon: MapPinIcon, count: addresses.length }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#6A41A1] text-[#6A41A1]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Email Status</dt>
                      <dd className="mt-1 flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          customer.email_verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {customer.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Marketing Consent</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          customer.marketing_consent 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.marketing_consent ? 'Opted In' : 'Opted Out'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Role</dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Customer
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{orders.length} total orders</span>
                  <button
                    onClick={fetchCustomerData}
                    className="px-3 py-1 text-xs bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                  <p className="text-gray-600">This customer hasn't placed any orders.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-[#6A41A1] hover:text-[#6A41A1]/80"
                          >
                            {order.order_number}
                          </Link>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₦{order.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>{order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {/* Order Items Preview */}
                      {order.order_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Items:</div>
                          <div className="space-y-1">
                            {order.order_items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.title}
                                </span>
                                <span className="text-gray-600">₦{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                            {order.order_items.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{order.order_items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{addresses.length} addresses</span>
                  <button
                    onClick={fetchCustomerData}
                    className="px-3 py-1 text-xs bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h4>
                  <p className="text-gray-600">This customer hasn't saved any addresses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          address.type === 'shipping' 
                            ? 'bg-blue-100 text-blue-800' 
                            : address.type === 'billing'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {address.type}
                        </span>
                        {address.is_default && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{address.first_name} {address.last_name}</p>
                        {address.company && <p className="text-gray-600">{address.company}</p>}
                        <p>{address.address_line_1}</p>
                        {address.address_line_2 && <p>{address.address_line_2}</p>}
                        <p>{address.city}, {address.state} {address.postal_code}</p>
                        <p>{address.country}</p>
                        {address.phone && (
                          <p className="text-gray-600 mt-1">
                            <PhoneIcon className="w-4 h-4 inline mr-1" />
                            {address.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  )
} 