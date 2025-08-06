'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Package,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Brand {
  id: string
  name: string
  slug: string
  description: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  is_active: boolean
  sort_order: number
}

interface BrandStats {
  productCount: number
  featuredProductCount: number
  activeProductCount: number
}

export default function BrandsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandStats, setBrandStats] = useState<Record<string, BrandStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      
      // Fetch all active brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (brandsError) throw brandsError
      setBrands(brandsData || [])

      // Fetch stats for each brand
      const stats: Record<string, BrandStats> = {}
      
      for (const brand of brandsData || []) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, is_featured, is_active')
          .eq('brand_id', brand.id)

        const products = productsData || []
        stats[brand.id] = {
          productCount: products.length,
          featuredProductCount: products.filter((p: any) => p.is_featured).length,
          activeProductCount: products.filter((p: any) => p.is_active).length
        }
      }
      
      setBrandStats(stats)

    } catch (error) {
      console.error('Error fetching brands:', error)
      setError('Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-800">Loading brands...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-purple-800 mb-4">Error Loading Brands</h1>
          <p className="text-purple-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-amber-800 mb-4"
            >
              Our Brands
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-amber-700 max-w-2xl mx-auto leading-relaxed"
            >
              Discover our curated collection of premium brands, each offering unique styles and exceptional quality for your home.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Brands Grid */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="py-12"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <Link href={`/brands/${brand.slug}`}>
                  <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-200/50 overflow-hidden h-full">
                    <div 
                      className="relative h-64 bg-gradient-to-br p-6"
                      style={{
                        background: `linear-gradient(135deg, ${brand.primary_color}20, ${brand.secondary_color}20)`
                      }}
                    >
                      {brand.logo_url && (
                        <motion.img
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-16 mx-auto mb-4"
                        />
                      )}
                      
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-amber-800 mb-2">
                          {brand.name}
                        </h2>
                        <p className="text-amber-700 text-sm leading-relaxed">
                          {brand.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2">
                                                      <div className="text-lg font-bold text-amber-800">
                            {brandStats[brand.id]?.productCount || 0}
                          </div>
                          <div className="text-xs text-amber-600">Products</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2">
                          <div className="text-lg font-bold text-amber-800">
                            {brandStats[brand.id]?.featuredProductCount || 0}
                          </div>
                          <div className="text-xs text-amber-600">Featured</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2">
                          <div className="text-lg font-bold text-amber-800">
                            {brandStats[brand.id]?.activeProductCount || 0}
                          </div>
                          <div className="text-xs text-amber-600">Active</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className="text-xs"
                            style={{
                              backgroundColor: brand.primary_color,
                              color: 'white'
                            }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                          {brandStats[brand.id]?.featuredProductCount > 0 && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 group-hover:translate-x-1 transition-transform"
                        >
                          Explore
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="py-16"
      >
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Discover Your Perfect Style
            </h2>
            <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
              Each brand offers a unique perspective on home design. Explore our collections to find the perfect pieces for your space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50"
                onClick={() => router.push('/collections')}
              >
                <Package className="w-5 h-5 mr-2" />
                Shop All Collections
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-amber-600"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Trending Now
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
} 