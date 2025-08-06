'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Filter {
  id: string
  name: string
  slug: string
  color: string
}

interface FilterOption {
  id: string
  filter_id: string
  name: string
  slug: string
  is_active: boolean
}

interface FilterWithOptions extends Filter {
  options: FilterOption[]
}

interface ProductFilter {
  filterId: string
  filterOptionId: string
  value: string // Display value
}

interface ProductFilterSelectorProps {
  selectedCategories: string[]
  productFilters: ProductFilter[]
  onFiltersChange: (filters: ProductFilter[]) => void
}

export default function ProductFilterSelector({ 
  selectedCategories, 
  productFilters, 
  onFiltersChange 
}: ProductFilterSelectorProps) {
  const [availableFilters, setAvailableFilters] = useState<FilterWithOptions[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchAvailableFilters()
    } else {
      setAvailableFilters([])
      setLoading(false)
    }
  }, [selectedCategories])

  // Safety timeout to prevent infinite loading (reduced timeout)
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Filter loading timeout - stopping loading state')
        setLoading(false)
        setAvailableFilters([])
      }, 2000) // 2 second timeout

      return () => clearTimeout(timeout)
    }
  }, [loading])

  const fetchAvailableFilters = async () => {
    console.log('🔍 Starting filter fetch for categories:', selectedCategories)
    setLoading(true)
    try {
      // Simplified: Just try to fetch and gracefully handle any errors
      const { data: assignedFilters, error: filtersError } = await supabase
        .from('category_filter_assignments')
        .select(`
          filter_id,
          category_filters!inner (
            id,
            name,
            slug,
            color
          )
        `)
        .in('category_id', selectedCategories)
        .eq('category_filters.is_active', true)

      // If any error occurs (table doesn't exist, permissions, etc.), just show no filters
      if (filtersError) {
        console.log('Filter system not available:', filtersError.message)
        setAvailableFilters([])
        return
      }

      // Get unique filter IDs
      const uniqueFilterIds = [...new Set(assignedFilters?.map((af: any) => af.filter_id) || [])]

      if (uniqueFilterIds.length === 0) {
        setAvailableFilters([])
        return
      }

      // Get filter options for these filters
      const { data: filterOptions, error: optionsError } = await supabase
        .from('category_filter_options')
        .select('*')
        .in('filter_id', uniqueFilterIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (optionsError) {
        console.log('Filter options not available:', optionsError.message)
        setAvailableFilters([])
        return
      }

      // Combine filters with their options
      const filterMap = new Map()
      assignedFilters?.forEach((assignment: any) => {
        const filter = assignment.category_filters
        if (filter && !filterMap.has(filter.id)) {
          filterMap.set(filter.id, {
            ...filter,
            options: (filterOptions || []).filter((option: FilterOption) => option.filter_id === filter.id)
          })
        }
      })

      setAvailableFilters(Array.from(filterMap.values()))
    } catch (error) {
      console.log('Filter system error:', error)
      setAvailableFilters([])
    } finally {
      setLoading(false)
    }
  }

  const addFilterOptions = () => {
    if (!selectedFilter || selectedOptions.length === 0) return

    // Add all selected options as separate filter entries
    const newFilters = selectedOptions.map(optionId => {
      const option = getAvailableOptionsForFilter(selectedFilter).find(o => o.id === optionId)
      return {
        filterId: selectedFilter,
        filterOptionId: optionId,
        value: option?.name || 'Unknown'
      }
    })

    onFiltersChange([...productFilters, ...newFilters])
    setSelectedFilter('')
    setSelectedOptions([])
    setShowOptions(false)
  }

  const removeFilter = (filterIndex: number) => {
    const updatedFilters = productFilters.filter((_, index) => index !== filterIndex)
    onFiltersChange(updatedFilters)
  }

  const getFilterName = (filterId: string) => {
    const filter = availableFilters.find(f => f.id === filterId)
    return filter?.name || 'Unknown Filter'
  }

  const getFilterColor = (filterId: string) => {
    const filter = availableFilters.find(f => f.id === filterId)
    return filter?.color || '#6366f1'
  }

  const getAvailableOptionsForFilter = (filterId: string) => {
    const filter = availableFilters.find(f => f.id === filterId)
    return filter?.options || []
  }

  const toggleOptionSelection = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const getFiltersByType = () => {
    // Group filters by type for better display
    const filterGroups: { [key: string]: ProductFilter[] } = {}
    
    productFilters.forEach(filter => {
      const filterName = getFilterName(filter.filterId)
      if (!filterGroups[filterName]) {
        filterGroups[filterName] = []
      }
      filterGroups[filterName].push(filter)
    })
    
    return filterGroups
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6A41A1]"></div>
      </div>
    )
  }

  if (availableFilters.length === 0 && selectedCategories.length > 0) {
    return (
      <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 text-sm font-medium">
          ✅ Filters are optional for now
        </p>
        <p className="text-green-600 text-xs mt-1">
          You can create products without adding filter values. The filter system can be set up later.
        </p>
      </div>
    )
  }

  if (selectedCategories.length === 0) {
    return (
      <div className="text-center py-6 bg-blue-50 rounded-lg">
        <p className="text-blue-600 text-sm">
          Please select at least one category above to see available filters.
        </p>
      </div>
    )
  }

  const filterGroups = getFiltersByType()

  return (
    <div className="space-y-4">
      {/* Selected Filters */}
      {productFilters.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#4F4032]">Selected Filter Options:</h4>
          
          {/* Group by filter type */}
          {Object.entries(filterGroups).map(([filterName, filters]) => (
            <div key={filterName} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getFilterColor(filters[0].filterId) }}
                />
                <span className="text-sm font-medium text-[#4F4032]">{filterName}:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {filters.map((filter, index) => {
                  const globalIndex = productFilters.indexOf(filter)
                  return (
                    <div
                      key={globalIndex}
                      className="flex items-center space-x-2 px-3 py-1 text-sm rounded-md border group"
                      style={{ 
                        borderColor: getFilterColor(filter.filterId),
                        color: getFilterColor(filter.filterId),
                        backgroundColor: `${getFilterColor(filter.filterId)}10`
                      }}
                    >
                      <span>{filter.value}</span>
                      <button
                        type="button"
                        onClick={() => removeFilter(globalIndex)}
                        className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Filter Options */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-[#4F4032] mb-3">Add Filter Options:</h4>
        
        {!showOptions ? (
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Filter Options
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-[#4F4032]">Choose filter type and options:</h5>
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false)
                  setSelectedFilter('')
                  setSelectedOptions([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              {availableFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(filter.id)
                    setSelectedOptions([]) // Reset selected options when changing filter type
                  }}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedFilter === filter.id
                      ? 'border-[#6A41A1] bg-[#6A41A1]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: filter.color }}
                    />
                    <span className="text-sm font-medium text-[#4F4032]">{filter.name}</span>
                  </div>
                  <p className="text-xs text-[#4F4032]/60 mt-1">
                    {filter.options.length} option{filter.options.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>

            {/* Filter Options Selection */}
            {selectedFilter && (
              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-[#4F4032] mb-3">
                  Select {getFilterName(selectedFilter)} options (multiple allowed):
                </h5>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {getAvailableOptionsForFilter(selectedFilter).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOptionSelection(option.id)}
                      className={`p-2 text-sm border rounded-md transition-colors text-left ${
                        selectedOptions.includes(option.id)
                          ? 'border-[#6A41A1] bg-[#6A41A1]/10 text-[#6A41A1]'
                          : 'border-gray-200 hover:border-[#6A41A1] hover:bg-[#6A41A1]/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.name}</span>
                        {selectedOptions.includes(option.id) && (
                          <div className="w-2 h-2 rounded-full bg-[#6A41A1]"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Add Selected Options Button */}
                {selectedOptions.length > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-xs text-[#4F4032]/60">
                      {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
                    </p>
                    <button
                      type="button"
                      onClick={addFilterOptions}
                      className="px-4 py-2 bg-[#6A41A1] text-white rounded-md hover:bg-[#6A41A1]/90 transition-colors text-sm"
                    >
                      Add Selected Options
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guidance */}
      <div className="text-xs text-[#4F4032]/50 bg-blue-50 p-3 rounded-lg">
        <strong>Tips:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Select multiple options per filter (e.g., both Queen and King sizes)</li>
          <li>• Add the same filter type multiple times if needed</li>
          <li>• Customers can filter products by any of these selections</li>
        </ul>
      </div>
    </div>
  )
} 