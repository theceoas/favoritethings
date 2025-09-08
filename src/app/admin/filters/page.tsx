'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Settings,
  Tag,
  Palette,
  Ruler,
  Package,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from '@/components/ui/CustomModal'
import FilterOptionForm from '@/components/admin/FilterOptionForm'

interface FilterCategory {
  id: string
  name: string
  type: string
  description: string
  brand_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
  filter_options_count: { count: number }
}

interface FilterOption {
  id: string
  category_id: string
  name: string
  value: string
  brand_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
  products_count: { count: number }
}

export default function AdminFiltersPage() {
  const [categories, setCategories] = useState<FilterCategory[]>([])
  const [options, setOptions] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showOptionForm, setShowOptionForm] = useState(false)
  const [editingOption, setEditingOption] = useState<FilterOption | null>(null)
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(null)
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<FilterCategory | null>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const { modalState, closeModal, error: showError, confirm: showConfirm } = useCustomModal()

  useEffect(() => {
    fetchFilters()
  }, [])

  // Update form fields when editing category changes
  useEffect(() => {
    if (editingCategory && showCategoryForm) {
      const form = document.getElementById('categoryForm') as HTMLFormElement
      if (form) {
        const nameInput = form.querySelector('[name="name"]') as HTMLInputElement
        const typeSelect = form.querySelector('[name="type"]') as HTMLSelectElement
        const brandSelect = form.querySelector('[name="brand"]') as HTMLSelectElement
        const descriptionTextarea = form.querySelector('[name="description"]') as HTMLTextAreaElement
        
        if (nameInput) nameInput.value = editingCategory.name
        if (typeSelect) typeSelect.value = editingCategory.type
        if (brandSelect) brandSelect.value = editingCategory.brand_id || ''
        if (descriptionTextarea) descriptionTextarea.value = editingCategory.description || ''
      }
    }
  }, [editingCategory, showCategoryForm])

  const fetchFilters = async () => {
    try {
      const supabase = createClient()
      
      // Fetch categories with option counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('filter_categories')
        .select(`
          *,
          filter_options_count:filter_options(count)
        `)
        .order('sort_order', { ascending: true })

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        // If tables don't exist yet, set empty arrays
        if (categoriesError.message.includes('relation') || categoriesError.message.includes('does not exist')) {
          setCategories([])
        } else {
          throw categoriesError
        }
      } else {
        setCategories(categoriesData || [])
      }

      // Fetch options with product counts
      const { data: optionsData, error: optionsError } = await supabase
        .from('filter_options')
        .select(`
          *,
          products_count:product_filters(count)
        `)
        .order('sort_order', { ascending: true })

      if (optionsError) {
        console.error('Error fetching options:', optionsError)
        // If tables don't exist yet, set empty arrays
        if (optionsError.message.includes('relation') || optionsError.message.includes('does not exist')) {
          setOptions([])
        } else {
          throw optionsError
        }
      } else {
        setOptions(optionsData || [])
      }

      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (brandsError) {
        console.error('Error fetching brands:', brandsError)
        setBrands([])
      } else {
        setBrands(brandsData || [])
      }
    } catch (error) {
      console.error('Error fetching filters:', error)
      showError('Error', 'Failed to load filters')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'size': return <Ruler className="w-5 h-5" />
      case 'material': return <Package className="w-5 h-5" />
      case 'color': return <Palette className="w-5 h-5" />
      case 'category': return <Tag className="w-5 h-5" />
      case 'feature': return <Star className="w-5 h-5" />
      default: return <Filter className="w-5 h-5" />
    }
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'size': return 'bg-blue-500'
      case 'material': return 'bg-green-500'
      case 'color': return 'bg-purple-500'
      case 'category': return 'bg-orange-500'
      case 'feature': return 'bg-pink-500'
      default: return 'bg-gray-500'
    }
  }

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('filter_categories')
        .update({ is_active: !isActive })
        .eq('id', categoryId)

      if (error) throw error
      fetchFilters()
    } catch (error) {
      console.error('Error toggling category:', error)
      showError('Error', 'Failed to update category')
    }
  }

  const handleToggleOption = async (optionId: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('filter_options')
        .update({ is_active: !isActive })
        .eq('id', optionId)

      if (error) throw error
      fetchFilters()
    } catch (error) {
      console.error('Error toggling option:', error)
      showError('Error', 'Failed to update option')
    }
  }

  const handleDeleteOption = async (option: FilterOption) => {
    showConfirm(
      'Delete Filter Option',
      `Are you sure you want to delete "${option.name}"? This will remove it from all products.`,
      async () => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('filter_options')
            .delete()
            .eq('id', option.id)

          if (error) throw error
          fetchFilters()
        } catch (error) {
          console.error('Error deleting option:', error)
          showError('Error', 'Failed to delete option')
        }
      }
    )
  }

  const handleEditCategory = async (category: FilterCategory) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (category: FilterCategory) => {
    showConfirm(
      'Delete Filter Category',
      `Are you sure you want to delete "${category.name}"? This will also delete all its options and remove them from all products.`,
      'Delete',
      'Cancel',
      async () => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('filter_categories')
            .delete()
            .eq('id', category.id)

          if (error) throw error
          
          fetchFilters()
          showConfirm('Category deleted successfully!')
        } catch (error) {
          console.error('Error deleting category:', error)
          showError('Failed to delete category')
        }
      }
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Filter Management</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage product filters, sizes, materials, colors, and categories</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                onClick={() => setShowCategoryForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowOptionForm(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Brand Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Filter by Brand</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Select a brand to view filters specific to that brand</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-600">Total Categories</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-800">{categories.length}</p>
                </div>
                <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-600">Total Options</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-800">
                    {options.length}
                  </p>
                </div>
                <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-purple-600">Active Categories</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-800">
                    {categories.filter(c => c.is_active).length}
                  </p>
                </div>
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-orange-600">Active Options</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-800">
                    {options.filter(o => o.is_active).length}
                  </p>
                </div>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(category.type)} text-white`}>
                        {getCategoryIcon(category.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={() => handleToggleCategory(category.id, category.is_active)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {category.filter_options_count?.count || 0} options
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {category.type}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Options
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selected Category Options */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(selectedCategory.type)} text-white`}>
                      {getCategoryIcon(selectedCategory.type)}
                    </div>
                    <div>
                      <CardTitle>{selectedCategory.name} Options</CardTitle>
                      <p className="text-sm text-gray-500">Manage filter options for {selectedCategory.name.toLowerCase()}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedCategoryForForm(selectedCategory)
                      setShowOptionForm(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                
                {/* Brand Filter for Options */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium text-gray-700">Filter by Brand:</Label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Brands</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {options.filter(option => 
                      option.category_id === selectedCategory.id && 
                      (selectedBrand === 'all' || option.brand_id === selectedBrand)
                    ).length} options
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {options
                    .filter(option => 
                      option.category_id === selectedCategory.id && 
                      (selectedBrand === 'all' || option.brand_id === selectedBrand)
                    )
                    .map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          {selectedCategory.type === 'color' && (
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: option.value }}
                            />
                          )}
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-gray-500">{option.value}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {option.products_count?.count || 0} products
                          </span>
                          <Switch
                            checked={option.is_active}
                            onCheckedChange={() => handleToggleOption(option.id, option.is_active)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOption(option)
                              setSelectedCategoryForForm(selectedCategory)
                              setShowOptionForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter Option Form */}
        {showOptionForm && selectedCategoryForForm && (
          <FilterOptionForm
            category={selectedCategoryForForm}
            option={editingOption}
            onSave={() => {
              setShowOptionForm(false)
              setEditingOption(null)
              setSelectedCategoryForForm(null)
              fetchFilters()
            }}
            onCancel={() => {
              setShowOptionForm(false)
              setEditingOption(null)
              setSelectedCategoryForForm(null)
            }}
          />
        )}

        {/* Filter Category Form */}
        {showCategoryForm && (
          <CustomModal
            isOpen={showCategoryForm}
            onClose={() => {
              setShowCategoryForm(false)
              setEditingCategory(null)
            }}
            title={editingCategory ? "Edit Filter Category" : "Add Filter Category"}
            message=""
            type="form"
            confirmText={editingCategory ? "Update Category" : "Create Category"}
            cancelText="Cancel"
            onConfirm={async () => {
              const formData = new FormData(document.getElementById('categoryForm') as HTMLFormElement)
              const name = formData.get('name') as string
              const type = formData.get('type') as string
              const brand = formData.get('brand') as string
              const description = formData.get('description') as string
              
              if (!name || !type) {
                showError('Please fill in all required fields')
                return
              }

              try {
                const supabase = createClient()
                
                if (editingCategory) {
                  // Update existing category
                  const { error } = await supabase
                    .from('filter_categories')
                    .update({
                      name,
                      type,
                      description,
                      brand_id: brand || null
                    })
                    .eq('id', editingCategory.id)

                  if (error) throw error
                  
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                  fetchFilters()
                  showConfirm('Category updated successfully!')
                } else {
                  // Create new category
                  const { error } = await supabase
                    .from('filter_categories')
                    .insert({
                      name,
                      type,
                      description,
                      brand_id: brand || null,
                      sort_order: categories.length + 1,
                      is_active: true
                    })

                  if (error) throw error
                  
                  setShowCategoryForm(false)
                  fetchFilters()
                  showConfirm('Category created successfully!')
                }
              } catch (error) {
                console.error('Error saving category:', error)
                showError('Failed to save category')
              }
            }}
          >
            <form id="categoryForm" className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Sizes, Colors, Materials"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Category Type *</Label>
                <select
                  id="type"
                  name="type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="size">Size</option>
                  <option value="color">Color</option>
                  <option value="material">Material</option>
                  <option value="category">Category</option>
                  <option value="feature">Feature</option>
                  <option value="style">Style</option>
                  <option value="season">Season</option>
                  <option value="brand">Brand</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="brand">Brand (Optional)</Label>
                <select
                  id="brand"
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this filter category..."
                />
              </div>
            </form>
          </CustomModal>
        )}

        {/* Custom Modal */}
        <CustomModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
        />
      </div>
    </div>
  )
} 