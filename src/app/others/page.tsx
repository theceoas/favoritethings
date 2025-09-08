'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowLeft,
  Search,
  Filter,
  ShoppingBag,
  Package,
  Coffee
} from "lucide-react"

interface OtherItem {
  id: string
  name: string
  description: string
  image_url?: string
  category: 'snacks' | 'accessories'
  price: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function OthersPage() {
  const [others, setOthers] = useState<OtherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchOthers()
  }, [])

  const fetchOthers = async () => {
    try {
      const supabase = createClient()
      
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('others')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('Supabase error fetching others:', error)
        setOthers([])
      } else {
        setOthers(data || [])
      }
    } catch (error) {
      console.error('Error fetching others:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOthers = others.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Snacks & Accessories</h1>
                <p className="text-sm text-gray-600">Discover our collection of delicious snacks and beautiful accessories</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  Account
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              >
                <option value="all">All Categories</option>
                <option value="snacks">Snacks</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredOthers.length} items found
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOthers.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="h-64 relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${
                        item.category === 'snacks' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.category === 'snacks' ? <Coffee className="w-3 h-3 mr-1" /> : <Package className="w-3 h-3 mr-1" />}
                        {item.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                      <p className="text-sm opacity-90 mb-2">{item.description}</p>
                      <p className="text-lg font-semibold">₦{item.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOthers.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'No items are currently available.'
              }
            </p>
            {(searchTerm || categoryFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 