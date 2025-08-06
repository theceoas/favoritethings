'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">Manage your fashion empire</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Search Bar */}
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
          >
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl"
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                3
              </Badge>
            </Button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:flex items-center space-x-3"
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
              className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span className="text-lg font-bold text-white">
                  {user.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </motion.div>
              <div className="hidden md:block text-left">
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