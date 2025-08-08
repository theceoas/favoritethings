"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { User, LogIn, UserPlus, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function AuthButtons() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Check if supabase client is available
    if (!supabase) {
      console.warn('Supabase client not available in auth buttons')
      setLoading(false)
      return
    }

    // Get initial session
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      try {
        subscription?.unsubscribe()
      } catch (error) {
        console.error('Error unsubscribing from auth changes:', error)
      }
    }
  }, [])

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const handleSignup = () => {
    router.push("/auth/signup")
  }

  const handleProfile = () => {
    router.push("/account")
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex space-x-2">
        <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex space-x-2">
      {user ? (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleProfile}
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg border border-gray-200"
            >
              <User className="w-4 h-4 mr-2" />
              Account
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg border border-gray-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>
        </>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleLogin}
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg border border-gray-200"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleSignup}
              className="bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </motion.div>
        </>
      )}
    </div>
  )
} 