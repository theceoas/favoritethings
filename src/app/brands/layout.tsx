'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'

interface Brand {
  id: string
  name: string
  slug: string
  primary_color: string
  secondary_color: string
}

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { getTotalItems, openCart } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      setBrands(brandsData || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if we're on the main brands page or a specific brand page
  const isMainBrandsPage = pathname === '/brands'
  const isSpecificBrandPage = pathname.startsWith('/brands/') && pathname !== '/brands'

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Navigation */}
            {isMainBrandsPage ? (
              // On main brands page - show "Back to Home"
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#4F4032]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            ) : (
              // On specific brand page - show "Back to Brands"
              <Link href="/brands">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#4F4032]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Brands
                </Button>
              </Link>
            )}

            {/* Brand Navigation */}
            {!loading && (
              <nav className="hidden sm:flex items-center gap-2">
                {brands.map((brand) => (
                  <Link key={brand.id} href={`/brands/${brand.slug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-[#4F4032] transition-colors"
                      style={{
                        '--tw-ring-color': brand.primary_color,
                      } as React.CSSProperties}
                    >
                      {brand.name}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative text-gray-600 hover:text-[#4F4032]"
                onClick={openCart}
              >
                <ShoppingBag className="w-4 h-4" />
                {mounted && getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#6A41A1] to-[#FFD84D] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium shadow-lg">
                    {getTotalItems()}
                  </span>
                )}
              </Button>

              {/* Home Icon */}
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#4F4032]">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
} 