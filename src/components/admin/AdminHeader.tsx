'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import NotificationDialog from './NotificationDialog'
import {
  Eye,
  Cog,
  LogOut,
  User as UserIcon,
  Activity,
  Bell,
  Search,
} from "lucide-react"

export default function AdminHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('admin_notifications_count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_notifications'
          },
          (payload) => {
            console.log('🔔 AdminHeader - Notification change detected:', payload)
            // Add a longer delay to prevent conflicts with dialog state updates
            setTimeout(() => {
              console.log('🔄 AdminHeader - Fetching unread count after real-time change')
              fetchUnreadCount()
            }, 1500)
          }
        )
        .subscribe()

      // Also fetch count periodically as backup
      const interval = setInterval(fetchUnreadCount, 30000) // Every 30 seconds

      return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
      }
    }
  }, [user])

  const fetchUnreadCount = async () => {
    try {
      console.log('🔍 Fetching unread notification count...')
      
      // Use the count query for better performance
      const { count, error } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) {
        console.error('Error fetching notifications count:', error)
        setUnreadCount(0)
        return
      }

      const unreadCount = count || 0
      console.log('📊 Unread count:', unreadCount)
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50"
      >
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </motion.header>
    )
  }

  if (!user) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50"
      >
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm">Please sign in</p>
            </div>
          </div>
        </div>
      </motion.header>
    )
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center space-x-4">
          {/* Mobile spacing for hamburger menu */}
          <div className="lg:hidden w-10"></div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg"
          />
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Manage your fashion empire</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
          {/* Search Bar - Hidden on mobile, visible on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:flex items-center space-x-2 bg-gray-100/50 rounded-xl px-4 py-2"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-500 focus:outline-none"
            />
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNotificationDialogOpen(true)}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            <NotificationDialog
              isOpen={isNotificationDialogOpen}
              onClose={() => {
                setIsNotificationDialogOpen(false)
                // Force refresh the unread count when dialog closes
                fetchUnreadCount()
              }}
              onUnreadCountChange={(count) => {
                console.log('📊 AdminHeader received unread count update:', count)
                setUnreadCount(count)
              }}
            />
          </motion.div>

          {/* Quick Actions - Hidden on mobile and tablet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden xl:flex items-center space-x-3"
          >
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400/20 text-gray-700 rounded-xl hover:bg-yellow-400/30 transition-all duration-300"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View Store</span>
            </Button>
          </motion.div>

          {/* User Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <Button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              variant="ghost"
              className="flex items-center space-x-2 sm:space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span className="text-sm sm:text-lg font-bold text-white">
                  {user.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </motion.div>
              <div className="hidden lg:block text-left">
                <div className="font-medium text-gray-800">{user.email?.split('@')[0] || 'Admin'}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            </Button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50">
                    <p className="text-sm font-medium text-gray-800">{user.email || 'admin@favoritethings.ng'}</p>
                    <p className="text-xs text-gray-500">Administrator Account</p>
                  </div>
                  
                  <div className="py-2">
                    <Button
                      onClick={() => router.push('/')}
                      variant="ghost"
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-yellow-400/10 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 mr-3" />
                      View Store
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-blue-400/10 transition-all duration-300"
                    >
                      <Cog className="w-4 h-4 mr-3" />
                      Settings
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
} 