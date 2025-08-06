'use client'

import Link from 'next/link'
import { PlusIcon, PencilIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import DeleteCollectionButton from '@/components/admin/DeleteCollectionButton'
import FeaturedToggleButton from '@/components/admin/FeaturedToggleButton'
import SimpleFeaturedToggle from '@/components/admin/SimpleFeaturedToggle'
import FeaturedCollectionsManager from '@/components/admin/FeaturedCollectionsManager'
import { useCollections } from './CollectionsProvider'

export default function AdminCollectionsContent() {
  console.log('🔥 AdminCollectionsContent rendering')
  
  try {
    const { collections, isLoading } = useCollections()
    console.log('🔥 AdminCollectionsContent - collections:', collections?.length, 'isLoading:', isLoading)
    
    const featuredCount = collections?.filter(c => c.is_featured).length || 0
    console.log('🔥 Featured count:', featuredCount)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#6A41A1] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-[#6A41A1]">Loading collections...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#6A41A1]">Collections</h1>
          <p className="text-[#4F4032]/80 mt-1">Organize products into curated collections</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex items-center px-6 py-3 bg-[#6A41A1] text-white rounded-2xl hover:bg-[#6A41A1]/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Collection
        </Link>
      </div>

      {/* Featured Collections Management */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#6A41A1] flex items-center">
            <StarIcon className="h-6 w-6 mr-2 text-[#FFD84D]" />
            Featured Collections Management
          </h2>
          <span className="text-sm text-[#4F4032]/60">
            {featuredCount}/3 featured (homepage limit)
          </span>
        </div>
        
        <div className="space-y-3">
          <p className="text-[#4F4032]/80 text-sm">
            Featured collections appear on your website's homepage. Click the star icon on any collection to toggle its featured status.
          </p>
          
          {featuredCount > 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You have {featuredCount} featured collections, but only the first 3 (by sort order) will appear on the homepage.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-[#4F4032]/70">
            <div className="flex items-center">
              <StarIconSolid className="h-4 w-4 text-[#FFD84D] mr-2" />
              <span>Featured (shows on homepage)</span>
            </div>
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-[#4F4032]/40 mr-2" />
              <span>Not featured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Collections Preview */}
      {featuredCount > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-[#6A41A1] mb-4 flex items-center">
            <StarIconSolid className="h-5 w-5 mr-2 text-[#FFD84D]" />
            Currently Featured on Homepage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collections?.filter(c => c.is_featured).sort((a, b) => a.sort_order - b.sort_order).slice(0, 3).map((collection, index) => (
              <div key={collection.id} className="bg-gradient-to-br from-[#6A41A1]/5 to-[#FFD84D]/5 rounded-xl p-4 border border-[#6A41A1]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#6A41A1] bg-[#6A41A1]/10 px-2 py-1 rounded-full">
                    Position #{index + 1}
                  </span>
                  <FeaturedToggleButton 
                    collectionId={collection.id} 
                    collectionName={collection.name}
                    isFeatured={collection.is_featured}
                  />
                </div>
                <h4 className="font-medium text-[#4F4032] text-sm mb-1">{collection.name}</h4>
                <p className="text-xs text-[#4F4032]/60 line-clamp-2">
                  {collection.description || 'No description'}
                </p>
                <div className="mt-2 flex justify-between items-center text-xs text-[#4F4032]/60">
                  <span>
                    {Array.isArray(collection.product_collections) 
                      ? collection.product_collections.length 
                      : 0} products
                  </span>
                  <Link
                    href={`/admin/collections/${collection.id}/edit`}
                    className="text-[#6A41A1] hover:underline"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {featuredCount > 3 && (
            <p className="text-xs text-[#4F4032]/60 mt-3 text-center">
              + {featuredCount - 3} more featured collections (not shown on homepage due to 3-item limit)
            </p>
          )}
        </div>
      )}

      {/* Quick Featured Management */}
      <FeaturedCollectionsManager collections={collections} />

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections?.map((collection) => (
          <div 
            key={collection.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {/* Collection Image */}
            <div className="h-32 bg-gradient-to-br from-[#6A41A1]/20 to-[#FFD84D]/20 rounded-xl mb-4 overflow-hidden relative">
              {collection.image_url ? (
                <img 
                  src={collection.image_url} 
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[#6A41A1]/40 text-sm font-medium">No Image</span>
                </div>
              )}
              
              {/* Featured Badge */}
              {collection.is_featured && (
                <div className="absolute top-2 right-2 bg-[#FFD84D] text-[#6A41A1] px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <StarIconSolid className="h-3 w-3 mr-1" />
                  Featured
                </div>
              )}
            </div>

            {/* Collection Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#4F4032]">{collection.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  collection.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {collection.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-[#4F4032]/60">/{collection.slug}</p>
              
              {collection.description && (
                <p className="text-sm text-[#4F4032]/80 line-clamp-2">{collection.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-[#4F4032]/60">
                  {Array.isArray(collection.product_collections) 
                    ? collection.product_collections.length 
                    : 0} products
                </span>
                
                <div className="flex items-center space-x-2">
                  <SimpleFeaturedToggle 
                    collectionId={collection.id} 
                    collectionName={collection.name}
                    isFeatured={collection.is_featured}
                  />
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="text-[#4F4032]/60 hover:text-[#6A41A1] transition-colors p-1"
                    title="View Collection"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/collections/${collection.id}/edit`}
                    className="text-[#4F4032]/60 hover:text-[#6A41A1] transition-colors p-1"
                    title="Edit Collection"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <DeleteCollectionButton collectionId={collection.id} collectionName={collection.name} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!collections || collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-12">
            <StarIcon className="h-16 w-16 text-[#6A41A1]/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#6A41A1] mb-2">No Collections Yet</h3>
            <p className="text-[#4F4032]/60 mb-6">
              Create your first collection to organize your products
            </p>
            <Link
              href="/admin/collections/new"
              className="inline-flex items-center px-6 py-3 bg-[#6A41A1] text-white rounded-2xl hover:bg-[#6A41A1]/90 transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Collection
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
  } catch (error) {
    console.error('❌ AdminCollectionsContent error:', error)
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Collections</h2>
          <p className="text-red-600">
            There was an error loading the collections. Please check the console for details.
          </p>
        </div>
      </div>
    )
  }
} 