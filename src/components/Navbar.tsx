'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { CSSLogo } from './Logo'
import { validateUserSession, clearValidationCache } from '@/lib/supabase/auth-validation'
import { clearAllAuthData } from '@/lib/supabase/auth-utils'
import { useCartStore } from '@/lib/store/cartStore'
import { logger } from '@/lib/utils/logger'
import { 
  ShoppingBagIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const { items, openCart } = useCartStore()
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  // Memoize the user check function to prevent recreating it on every render
  const checkUser = useCallback(async () => {
    const validation = await validateUserSession()
    setUser(validation.isValid ? validation.user : null)
  }, [])

  useEffect(() => {
    setIsMounted(true)
    
    // Initial user check
    checkUser()

    // Listen for auth changes and validate each time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      // Clear validation cache on auth state change
      clearValidationCache()
      
      if (session?.user) {
        // When user signs in, validate the session
        const validation = await validateUserSession()
        setUser(validation.isValid ? validation.user : null)
      } else {
        // User signed out
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [checkUser])

  // Memoize categories fetch function
  const fetchCategories = useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (!error && data) {
          setCategories(data)
        }
      } catch (error) {
      logger.error('Error fetching categories:', error)
        setCategories([])
    }
  }, [])

  useEffect(() => {
    // Fetch active categories only when component is mounted on client
    if (isMounted) {
      fetchCategories()
    }
  }, [isMounted, fetchCategories])

  const handleLogout = async () => {
    try {
      // Use the more robust logout method
      await clearAllAuthData()
      setIsUserMenuOpen(false)
      setUser(null) // Clear user state immediately
      
      // Force a hard redirect to ensure clean state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to simple signout
      await supabase.auth.signOut()
      setIsUserMenuOpen(false)
      setUser(null)
      router.push('/auth/login')
    }
  }

  // Main navigation items (without categories)
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: 'Products', href: '/products' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-xl sticky top-0 z-50 border-b border-[#6A41A1]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <CSSLogo size="medium" withLink={false} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[#4F4032] hover:text-[#6A41A1] px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-[#6A41A1]/5 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#6A41A1] transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
              </Link>
            ))}
            
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="text-[#4F4032] hover:text-[#6A41A1] px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-[#6A41A1]/5 relative group flex items-center space-x-1"
              >
                <span>Categories</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#6A41A1] transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
              </button>

              {/* Categories Dropdown Menu */}
              {isCategoriesOpen && isMounted && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#6A41A1]/20 py-6 px-4 z-50">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[#6A41A1] mb-2">Shop by Category</h3>
                    <p className="text-sm text-[#4F4032]/70">Find exactly what you're looking for</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href="/products"
                      className="flex items-center px-4 py-3 rounded-xl hover:bg-[#6A41A1]/10 transition-all duration-300 group"
                      onClick={() => setIsCategoriesOpen(false)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-lg flex items-center justify-center mr-3">
                        <ShoppingBagIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-[#4F4032] group-hover:text-[#6A41A1]">All Products</div>
                        <div className="text-xs text-[#4F4032]/60">Browse everything</div>
                      </div>
                    </Link>
                    
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="flex items-center px-4 py-3 rounded-xl hover:bg-[#6A41A1]/10 transition-all duration-300 group"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#6A41A1]/20 to-[#FFD84D]/20 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-xs font-semibold text-[#6A41A1]">
                            {category.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-[#4F4032] group-hover:text-[#6A41A1]">{category.name}</div>
                          <div className="text-xs text-[#4F4032]/60">Explore collection</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search Icon */}
            <button className="p-2 text-[#4F4032]/70 hover:text-[#6A41A1] hover:bg-[#6A41A1]/10 rounded-xl transition-all duration-300">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Cart */}
            <button 
              onClick={openCart}
              className="relative p-2 text-[#4F4032]/70 hover:text-[#6A41A1] hover:bg-[#6A41A1]/10 rounded-xl transition-all duration-300"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#6A41A1] to-[#FFD84D] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-[#6A41A1]/10 rounded-xl transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-semibold text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#6A41A1]/20 py-4 z-50">
                    <div className="px-4 py-2 border-b border-[#6A41A1]/10 mb-2">
                      <p className="text-sm font-medium text-[#6A41A1]">Welcome back!</p>
                      <p className="text-xs text-[#4F4032]/60 truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/account"
                      className="flex items-center px-4 py-2 text-sm text-[#4F4032] hover:bg-[#6A41A1]/10 hover:text-[#6A41A1] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center px-4 py-2 text-sm text-[#4F4032] hover:bg-[#6A41A1]/10 hover:text-[#6A41A1] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingBagIcon className="w-4 h-4 mr-2" />
                      My Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center px-4 py-2 text-sm text-[#4F4032] hover:bg-[#6A41A1]/10 hover:text-[#6A41A1] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Wishlist
                    </Link>
                    <hr className="my-2 border-[#6A41A1]/10" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-[#6A41A1] hover:text-[#FFD84D] px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-[#6A41A1]/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-[#6A41A1] to-[#FFD84D] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-[#4F4032]/70 hover:text-[#6A41A1] hover:bg-[#6A41A1]/10 rounded-xl transition-all duration-300"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-[#6A41A1]/10 relative z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 text-[#4F4032] hover:text-[#6A41A1] hover:bg-[#6A41A1]/10 rounded-xl font-medium transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Categories */}
            <div className="pt-2">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-[#4F4032] hover:text-[#6A41A1] hover:bg-[#6A41A1]/10 rounded-xl font-medium transition-all duration-300"
              >
                <span>Categories</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isCategoriesOpen && isMounted && (
                <div className="mt-2 ml-4 space-y-1 relative z-60">
                  <Link
                    href="/products"
                    className="block px-4 py-2 text-[#4F4032]/80 hover:text-[#6A41A1] hover:bg-[#6A41A1]/5 rounded-lg transition-all duration-300"
                    onClick={() => { setIsMenuOpen(false); setIsCategoriesOpen(false); }}
                  >
                    All Products
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      className="block px-4 py-2 text-[#4F4032]/80 hover:text-[#6A41A1] hover:bg-[#6A41A1]/5 rounded-lg transition-all duration-300"
                      onClick={() => { setIsMenuOpen(false); setIsCategoriesOpen(false); }}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for dropdowns */}
      {(isCategoriesOpen || isUserMenuOpen || isMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsCategoriesOpen(false);
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </nav>
  )
}