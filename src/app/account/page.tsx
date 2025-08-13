'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useRequireAuth } from '@/hooks/useAuthValidation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { Sparkles, Star, Zap } from 'lucide-react'

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-gray-600 font-medium">Loading your account...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return null // Hook will handle redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
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
          className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"
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
          className="absolute bottom-32 right-32 w-24 h-24 bg-black/10 rounded-full blur-xl"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-full mb-6 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">My Account</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 leading-tight">
            Welcome back,
            <br />
            <span className="text-yellow-500 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {profile?.full_name || user?.email?.split('@')[0]}
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your orders, wishlist, and account settings all in one place.
          </p>
        </motion.div>

        {/* Account Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
            <div className="flex items-center">
                  <div className="p-3 bg-blue-400 rounded-xl group-hover:bg-blue-500 transition-colors">
                    <ShoppingBagIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
            <div className="flex items-center">
                  <div className="p-3 bg-green-400 rounded-xl group-hover:bg-green-500 transition-colors">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-6">
            <div className="flex items-center">
                  <div className="p-3 bg-red-400 rounded-xl group-hover:bg-red-500 transition-colors">
                    <HeartIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
              </div>
            </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
            <div className="flex items-center">
                  <div className="p-3 bg-purple-400 rounded-xl group-hover:bg-purple-500 transition-colors">
                    <MapPinIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saved Addresses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedAddresses}</p>
              </div>
            </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          <Link href="/account/orders">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                      <div className="p-3 bg-blue-400 rounded-xl group-hover:bg-blue-500 transition-colors">
                        <ShoppingBagIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                  <p className="text-sm text-gray-600">View order history and track shipments</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/account/wishlist">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                      <div className="p-3 bg-red-400 rounded-xl group-hover:bg-red-500 transition-colors">
                        <HeartIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Wishlist</h3>
                  <p className="text-sm text-gray-600">Manage your saved items</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/account/addresses">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                      <div className="p-3 bg-purple-400 rounded-xl group-hover:bg-purple-500 transition-colors">
                        <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                  <p className="text-sm text-gray-600">Manage shipping and billing addresses</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-12"
        >
          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-yellow-400 rounded-xl mr-4">
                  <UserIcon className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <p className="text-lg text-gray-900 font-medium">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <p className="text-lg text-gray-900 font-medium">{user?.email}</p>
                  </div>
            </div>
                <div className="space-y-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="flex items-center">
                      <span className="text-lg text-gray-900 font-medium mr-2 capitalize">{profile?.role || 'customer'}</span>
                {profile?.role === 'admin' && (
                        <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
              <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-lg text-gray-900 font-medium">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        {stats.lastOrderDate && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mb-12"
          >
            <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-green-400 rounded-xl mr-4">
                    <ShoppingBagIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-400 rounded-lg">
                        <ShoppingBagIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-lg font-medium text-gray-900">Last Order</p>
                        <p className="text-gray-600">
                    {new Date(stats.lastOrderDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
                    <Link href="/account/orders">
                      <Button className="bg-green-400 text-white hover:bg-green-500 rounded-full">
                View Details
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
              </Link>
            </div>
          </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gray-400 rounded-xl mr-4">
                  <CogIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Quick Settings</h2>
              </div>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="flex items-center w-full text-left p-4 rounded-xl hover:bg-white/50 transition-colors group"
                >
                  <div className="p-2 bg-red-400 rounded-lg group-hover:bg-red-500 transition-colors">
                    <CogIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-900">Sign Out</p>
                    <p className="text-gray-600">Sign out from your account</p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 