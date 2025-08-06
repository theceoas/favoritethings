'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/database'

interface CategoryFormProps {
  category?: Tables<'categories'>
}

interface Filter {
  id: string
  name: string
  color: string
  slug: string
}

interface FilterAssignment {
  filter_id: string
  is_required: boolean
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingFilters, setIsLoadingFilters] = useState(false)
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([])
  const [selectedFilters, setSelectedFilters] = useState<FilterAssignment[]>([])
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active !== undefined ? category.is_active : true,
  })

  // Load available filters and existing assignments
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingFilters(true)
      try {
        // Load filters and assignments in parallel for speed
        const promises = [
          supabase
            .from('category_filters')
            .select('id, name, color, slug')
            .eq('is_active', true)
            .order('sort_order')
        ]

        if (category?.id) {
          promises.push(
            supabase
              .from('category_filter_assignments')
              .select('filter_id, is_required')
              .eq('category_id', category.id)
          )
        }

        const results = await Promise.all(promises)
        const [filtersResult, assignmentsResult] = results

        if (filtersResult.error) throw filtersResult.error
        setAvailableFilters(filtersResult.data || [])

        if (assignmentsResult) {
          if (assignmentsResult.error) throw assignmentsResult.error
          setSelectedFilters(assignmentsResult.data || [])
        }
      } catch (error) {
        console.error('Error loading filter data:', error)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    loadData()
  }, [category])

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !category) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, category])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev => {
      const exists = prev.find(f => f.filter_id === filterId)
      if (exists) {
        return prev.filter(f => f.filter_id !== filterId)
      } else {
        return [...prev, { filter_id: filterId, is_required: false }]
      }
    })
  }

  const handleRequiredToggle = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.map(f => 
        f.filter_id === filterId 
          ? { ...f, is_required: !f.is_required }
          : f
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        sort_order: parseInt(formData.sort_order.toString()),
        is_active: formData.is_active,
      }

      let categoryId: string

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id)

        if (error) throw error
        categoryId = category.id
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select('id')
          .single()

        if (error) throw error
        categoryId = data.id
      }

      // Update filter assignments
      // First, delete existing assignments
      await supabase
        .from('category_filter_assignments')
        .delete()
        .eq('category_id', categoryId)

      // Then, insert new assignments
      if (selectedFilters.length > 0) {
        const assignments = selectedFilters.map((filter, index) => ({
          category_id: categoryId,
          filter_id: filter.filter_id,
          is_required: filter.is_required,
          sort_order: index
        }))

        const { error: assignmentError } = await supabase
          .from('category_filter_assignments')
          .insert(assignments)

        if (assignmentError) throw assignmentError
      }

      router.push('/admin/categories')
      router.refresh()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error saving category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="category-slug"
            />
            <p className="text-xs text-[#4F4032]/60 mt-1">
              This will be used in URLs: /products?category={formData.slug}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            placeholder="Brief description of this category"
          />
        </div>
      </div>

      {/* Visual & SEO */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Visual & SEO</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Category Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="https://example.com/category-image.jpg"
            />
            <p className="text-xs text-[#4F4032]/60 mt-1">
              Recommended size: 400x300px for best display
            </p>
          </div>

          {/* Image Preview */}
          {formData.image_url && (
            <div>
              <label className="block text-sm font-medium text-[#4F4032] mb-2">
                Preview
              </label>
              <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={formData.image_url} 
                  alt="Category preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Assignment */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Product Filters</h3>
        <p className="text-sm text-[#4F4032]/80 mb-4">
          Select which filters should be available for products in this category
        </p>
        
        {isLoadingFilters ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6A41A1]"></div>
            <span className="ml-3 text-[#4F4032]/60">Loading filters...</span>
          </div>
        ) : availableFilters.length > 0 ? (
          <div className="space-y-3">
            {availableFilters.map((filter) => {
              const isSelected = selectedFilters.find(sf => sf.filter_id === filter.id)
              const isRequired = isSelected?.is_required || false
              
              return (
                <div key={filter.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => handleFilterToggle(filter.id)}
                      className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: filter.color }}
                    />
                    <div>
                      <span className="text-sm font-medium text-[#4F4032]">{filter.name}</span>
                      <p className="text-xs text-[#4F4032]/60">/{filter.slug}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => handleRequiredToggle(filter.id)}
                          className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 scale-75"
                        />
                        <span className="ml-1 text-red-600">Required</span>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
            
            {selectedFilters.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  {selectedFilters.length} filter(s) assigned to this category
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Products in this category will be able to use these filters for organization.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-[#4F4032]/60 text-sm mb-2">No filters available</p>
            <p className="text-[#4F4032]/40 text-xs">
              Create filters first to assign them to categories
            </p>
          </div>
        )}
      </div>

      {/* Settings */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-[#4F4032]/60 mt-1">
              Lower numbers appear first in navigation
            </p>
          </div>

          <div className="flex items-center space-y-3 pt-8">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-[#4F4032]">Category is active</span>
            </label>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#6A41A1]/5 rounded-lg">
          <h4 className="font-medium text-[#6A41A1] mb-2">Category Display Rules</h4>
          <div className="text-sm text-[#4F4032]/80 space-y-1">
            <p>• Active categories appear in the main navigation</p>
            <p>• Sort order determines the position in menus (lower = first)</p>
            <p>• Categories with products will show product counts</p>
            <p>• Category pages are accessible at: /products?category={formData.slug}</p>
            <p>• Assigned filters will be available for products in this category</p>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-[#4F4032] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  )
} 