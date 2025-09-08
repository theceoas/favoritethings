'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Package, 
  Star, 
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  product_count: number
  brand_slug?: string
  brand_id?: string
  brands?: {
    id: string
    name: string
    slug: string
  }
}

interface Brand {
  id: string
  name: string
  slug: string
  primary_color: string
  secondary_color: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const router = useRouter()

  // Check for brand query parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const brandParam = urlParams.get('brand')
    if (brandParam) {
      setSelectedBrand(brandParam)
    }
  }, [])

  // Fetch all collections and brands on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch collections
      const collectionsResponse = await fetch('/api/collections')
      const collectionsResult = await collectionsResponse.json()
      
      if (!collectionsResponse.ok) {
        throw new Error(collectionsResult.error || 'Failed to fetch collections')
      }
      
      setCollections(collectionsResult.collections || [])
      console.log('Collections fetched:', collectionsResult.collections)

      // Fetch brands
      const brandsResponse = await fetch('/api/brands')
      const brandsResult = await brandsResponse.json()
      
      if (brandsResponse.ok) {
        setBrands(brandsResult.brands || [])
        console.log('Brands fetched:', brandsResult.brands)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCollectionClick = (collection: Collection) => {
    router.push(`/collections/${collection.slug}`)
  }

  const filteredCollections = selectedBrand === 'all' 
    ? collections 
    : collections.filter(collection => collection.brand_slug === selectedBrand)

  const groupedCollections = brands.map(brand => ({
    ...brand,
    collections: collections.filter(collection => {
      // Try to match by brand_slug first, then by brand_id if available
      const matches = collection.brand_slug === brand.slug || 
             collection.brand_id === brand.id ||
             collection.brands?.slug === brand.slug ||
             collection.brands?.id === brand.id
      
      if (matches) {
        console.log(`Collection "${collection.name}" matched to brand "${brand.name}"`)
      }
      
      return matches
    })
  })).filter(brand => brand.collections.length > 0)

  console.log('Grouped collections:', groupedCollections)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-700">Loading collections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-32 pb-16 px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-amber-800 mb-6"
          >
            Our <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Collections</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-amber-700 max-w-3xl mx-auto"
          >
            Discover our curated collections organized by brand, each offering unique styles and exceptional quality.
          </motion.p>
        </div>
      </motion.div>

      {/* Brand Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-6 mb-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant={selectedBrand === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedBrand('all')}
              className={selectedBrand === 'all' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                : 'border-amber-300 text-amber-700 hover:bg-amber-50'
              }
            >
              All Brands
            </Button>
            {brands.map((brand) => (
              <Button
                key={brand.slug}
                variant={selectedBrand === brand.slug ? 'default' : 'outline'}
                onClick={() => setSelectedBrand(brand.slug)}
                className={selectedBrand === brand.slug 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                  : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                }
              >
                {brand.name}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Collections by Brand */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="py-12 px-6"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          {selectedBrand === 'all' ? (
            // Show collections grouped by brand
            groupedCollections.map((brand, brandIndex) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + brandIndex * 0.1 }}
                className="space-y-8"
              >
                {/* Brand Header */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: brand.primary_color }}
                    />
                    <h2 className="text-3xl font-bold text-amber-800">{brand.name}</h2>
                  </div>
                  <p className="text-amber-700 text-lg">
                    {brand.collections.length} Collection{brand.collections.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Featured Collections */}
                {brand.collections.filter(c => c.is_featured).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-amber-700 text-center">Featured Collections</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {brand.collections.filter(c => c.is_featured).map((collection, index) => (
                        <motion.div
                          key={collection.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + brandIndex * 0.1 + index * 0.1 }}
                          onClick={() => handleCollectionClick(collection)}
                          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-amber-200/50 overflow-hidden"
                        >
                          {/* Collection Image */}
                          <div className="aspect-[3/2] bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
                            {collection.image_url ? (
                              <img
                                src={collection.image_url}
                                alt={collection.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400" />
                              </div>
                            )}
                            
                            {/* Featured Badge */}
                            {collection.is_featured && (
                              <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-amber-500 text-white text-xs">
                                <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                <span className="hidden sm:inline">Featured</span>
                              </Badge>
                            )}

                            {/* Product Count */}
                            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                              {collection.product_count || 0} Products
                            </div>
                          </div>

                          {/* Collection Info */}
                          <div className="p-3 sm:p-4 lg:p-6">
                            <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-amber-800 mb-2 group-hover:text-orange-700 transition-colors line-clamp-1">
                              {collection.name}
                            </h3>
                            
                            {collection.description && (
                              <p className="text-amber-700 text-xs sm:text-sm mb-3 line-clamp-2 hidden sm:block">
                                {collection.description}
                              </p>
                            )}

                            {/* View Collection Button */}
                            <div className="flex items-center text-amber-600 font-medium group-hover:text-orange-600 transition-colors text-xs sm:text-sm">
                              <span>View Collection</span>
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Collections */}
                {brand.collections.filter(c => !c.is_featured).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-semibold text-amber-700">All Collections</h3>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md"
                        onClick={() => setSelectedBrand(brand.slug)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        View All Collections
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {brand.collections.filter(c => !c.is_featured).slice(0, 3).map((collection, index) => (
                        <motion.div
                          key={collection.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + brandIndex * 0.1 + index * 0.1 }}
                          onClick={() => handleCollectionClick(collection)}
                          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-amber-200/50 overflow-hidden"
                        >
                          {/* Collection Image */}
                          <div className="aspect-[3/2] bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
                            {collection.image_url ? (
                              <img
                                src={collection.image_url}
                                alt={collection.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400" />
                              </div>
                            )}
                            
                            {/* Product Count */}
                            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                              {collection.product_count || 0} Products
                            </div>
                          </div>

                          {/* Collection Info */}
                          <div className="p-3 sm:p-4 lg:p-6">
                            <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-amber-800 mb-2 group-hover:text-orange-700 transition-colors line-clamp-1">
                              {collection.name}
                            </h3>
                            
                            {collection.description && (
                              <p className="text-amber-700 text-xs sm:text-sm mb-3 line-clamp-2 hidden sm:block">
                                {collection.description}
                              </p>
                            )}

                            {/* View Collection Button */}
                            <div className="flex items-center text-amber-600 font-medium group-hover:text-orange-600 transition-colors text-xs sm:text-sm">
                              <span>View Collection</span>
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            // Show collections for selected brand
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-800 mb-4">
                  {brands.find(b => b.slug === selectedBrand)?.name} Collections
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredCollections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    onClick={() => handleCollectionClick(collection)}
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-amber-200/50 overflow-hidden"
                  >
                    {/* Collection Image */}
                    <div className="aspect-[3/2] bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {collection.is_featured && (
                        <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-amber-500 text-white text-xs">
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                          <span className="hidden sm:inline">Featured</span>
                        </Badge>
                      )}

                      {/* Product Count */}
                      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                        {collection.product_count || 0} Products
                      </div>
                    </div>

                    {/* Collection Info */}
                    <div className="p-3 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-amber-800 mb-2 group-hover:text-orange-700 transition-colors line-clamp-1">
                        {collection.name}
                      </h3>
                      
                      {collection.description && (
                        <p className="text-amber-700 text-xs sm:text-sm mb-3 line-clamp-2 hidden sm:block">
                          {collection.description}
                        </p>
                      )}

                      {/* View Collection Button */}
                      <div className="flex items-center text-amber-600 font-medium group-hover:text-orange-600 transition-colors text-xs sm:text-sm">
                        <span>View Collection</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredCollections.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Package className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-amber-800 mb-2">
                No Collections Found
              </h3>
              <p className="text-amber-700">
                {selectedBrand === 'all' 
                  ? "We're working on adding collections to our store."
                  : `No collections found for ${brands.find(b => b.slug === selectedBrand)?.name}.`
                }
              </p>
              {collections.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-amber-700 mb-4">Debug Info:</h4>
                  <div className="text-left max-w-2xl mx-auto bg-white/50 p-4 rounded-lg">
                    <p className="text-sm text-amber-600">Total collections: {collections.length}</p>
                    <p className="text-sm text-amber-600">Total brands: {brands.length}</p>
                    <p className="text-sm text-amber-600">Grouped collections: {groupedCollections.length}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-amber-700">Collections:</p>
                      {collections.map(collection => (
                        <p key={collection.id} className="text-xs text-amber-600 ml-2">
                          • {collection.name} (brand: {collection.brand_slug || collection.brands?.slug || 'unknown'})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  )
} 