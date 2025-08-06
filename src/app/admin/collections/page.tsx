'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Store,
  Star,
  Image as ImageIcon,
  Sparkles
} from "lucide-react"

interface Collection {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      setCollections(data || [])

    } catch (error) {
      console.error('Error fetching collections:', error)
      setError('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = 
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && collection.is_active) ||
      (statusFilter === 'inactive' && !collection.is_active)

    const matchesFeatured = featuredFilter === 'all' || 
      (featuredFilter === 'featured' && collection.is_featured) ||
      (featuredFilter === 'not-featured' && !collection.is_featured)

    return matchesSearch && matchesStatus && matchesFeatured
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
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
          className="absolute top-20 right-20 w-32 h-32 bg-amber-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-orange-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-2 text-red-800">❌ Collections Loading Error</h2>
                <p className="text-red-700 font-mono text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-amber-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg"
                >
                  <ShoppingBag className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-amber-800 mb-2">Collections</h1>
                  <p className="text-amber-700 text-lg">Manage product collections and featured displays</p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/admin/collections/new">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium">
                    <Plus className="w-4 h-4" />
                    Add Collection
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Collections",
                value: collections.length,
                icon: ShoppingBag,
                color: "from-amber-500 to-orange-600",
                bgColor: "bg-amber-500"
              },
              {
                title: "Active Collections",
                value: collections.filter(c => c.is_active).length,
                icon: TrendingUp,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Featured Collections",
                value: collections.filter(c => c.is_featured).length,
                icon: Star,
                color: "from-yellow-500 to-amber-600",
                bgColor: "bg-yellow-500"
              },
              {
                title: "With Images",
                value: collections.filter(c => c.image_url).length,
                icon: ImageIcon,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`${stat.bgColor} rounded-2xl p-4 shadow-lg`}
                      >
                        <stat.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} opacity-10 rounded-full`} />
                    </div>
                    <div className="space-y-2">
                      <dt className="text-sm font-medium text-amber-700 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-3xl font-bold text-amber-800">
                        {stat.value}
                      </dd>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-amber-200/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Collections</option>
                  <option value="featured">Featured</option>
                  <option value="not-featured">Not Featured</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collections Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-200/50 overflow-hidden">
                {/* Collection Image */}
                <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {collection.is_featured && (
                      <Badge className="bg-amber-500 text-white text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge className={`${collection.is_active ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                      {collection.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-amber-800 mb-2">{collection.name}</h3>
                      <p className="text-amber-700 text-sm line-clamp-2">{collection.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-amber-600">
                      <span>Order: {collection.sort_order}</span>
                      <span>Slug: {collection.slug}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/collections/${collection.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredCollections.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200/50">
              <ShoppingBag className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">No Collections Found</h3>
              <p className="text-amber-700 mb-6">Create your first collection to start organizing your products.</p>
              <Link href="/admin/collections/new">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
} 