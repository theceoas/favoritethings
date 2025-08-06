'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useRequireAuth } from '@/hooks/useAuthValidation'
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  CogIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface UserStats {
  totalOrders: number
  totalSpent: number
  savedAddresses: number
  wishlistItems: number
  lastOrderDate?: string
}

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, isValid } = useRequireAuth('/auth/login?redirect=/account')
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    savedAddresses: 0,
    wishlistItems: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isValid && user) {
      fetchUserData(user.id)
    }
  }, [isValid, user])

  const fetchUserData = async (userId: string) => {
    setLoading(true)
    try {
      // Fetch user statistics
      const [ordersResult, addressesResult, wishlistResult] = await Promise.all([
        supabase
          .from('orders')
          .select('total, created_at')
          .eq('user_id', userId)
          .neq('status', 'cancelled'),
        supabase
          .from('addresses')
          .select('id')
          .eq('user_id', userId),
        supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', userId)
      ])

      const orders = ordersResult.data || []
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
      const lastOrderDate = orders.length > 0 ? orders[orders.length - 1].created_at : undefined

      setStats({
        totalOrders: orders.length,
        totalSpent,
        savedAddresses: addressesResult.data?.length || 0,
        wishlistItems: wishlistResult.data?.length || 0,
        lastOrderDate
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your account...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return null // Hook will handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name || user?.email}!
          </p>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <HeartIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MapPinIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saved Addresses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedAddresses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/account/orders"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                  <p className="text-sm text-gray-600">View order history and track shipments</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/account/wishlist"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <HeartIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Wishlist</h3>
                  <p className="text-sm text-gray-600">Manage your saved items</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/account/addresses"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <MapPinIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                  <p className="text-sm text-gray-600">Manage shipping and billing addresses</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-gray-900">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <div className="flex items-center">
                <span className="text-gray-900 mr-2">{profile?.role || 'customer'}</span>
                {profile?.role === 'admin' && (
                  <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  {new Date(user?.created_at || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.lastOrderDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Last Order</p>
                  <p className="text-sm text-gray-600">
                    {new Date(stats.lastOrderDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <Link
                href="/account/orders"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        )}

        {/* Quick Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Settings</h2>
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <CogIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-600">Sign out from your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 