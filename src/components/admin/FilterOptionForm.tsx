'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  X, 
  Save, 
  Palette,
  Ruler,
  Package,
  Tag,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from '@/components/ui/CustomModal'

interface FilterOption {
  id?: string
  category_id: string
  name: string
  value: string
  brand_id?: string
  sort_order: number
  is_active: boolean
}

interface FilterOptionFormProps {
  category: {
    id: string
    name: string
    type: string
  }
  option?: FilterOption
  onSave: () => void
  onCancel: () => void
}

export default function FilterOptionForm({ category, option, onSave, onCancel }: FilterOptionFormProps) {
  const [formData, setFormData] = useState<FilterOption>({
    category_id: category.id,
    name: option?.name || '',
    value: option?.value || '',
    brand_id: option?.brand_id || '',
    sort_order: option?.sort_order || 0,
    is_active: option?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<any[]>([])
  const { modalState, closeModal, error: showError } = useCustomModal()

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const supabase = createClient()
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true })

        if (brandsError) {
          console.error('Error fetching brands:', brandsError)
        } else {
          setBrands(brandsData || [])
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    }

    fetchBrands()
  }, [])

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'size': return <Ruler className="w-5 h-5" />
      case 'material': return <Package className="w-5 h-5" />
      case 'color': return <Palette className="w-5 h-5" />
      case 'category': return <Tag className="w-5 h-5" />
      case 'feature': return <Star className="w-5 h-5" />
      default: return <Tag className="w-5 h-5" />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      if (option?.id) {
        // Update existing option
        const { error } = await supabase
          .from('filter_options')
          .update(formData)
          .eq('id', option.id)

        if (error) throw error
      } else {
        // Create new option
        const { error } = await supabase
          .from('filter_options')
          .insert(formData)

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving filter option:', error)
      showError('Error', 'Failed to save filter option')
    } finally {
      setLoading(false)
    }
  }

  const renderValueInput = () => {
    switch (category.type) {
      case 'color':
        return (
          <div className="space-y-2">
            <Label htmlFor="value">Color Value (Hex Code)</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="value"
                type="text"
                placeholder="#FFFFFF"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="flex-1"
              />
              {formData.value && (
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: formData.value }}
                />
              )}
            </div>
          </div>
        )
      
      case 'size':
        return (
          <div className="space-y-2">
            <Label htmlFor="value">Size Code</Label>
            <Input
              id="value"
              type="text"
              placeholder="XS, S, M, L, XL"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            />
          </div>
        )
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="text"
              placeholder="Enter value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            />
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(category.type)} text-white`}>
                  {getCategoryIcon(category.type)}
                </div>
                <div>
                  <CardTitle>
                    {option ? 'Edit' : 'Add'} {category.name} Option
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {option ? 'Update' : 'Create'} a new filter option
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter option name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {renderValueInput()}

              <div className="space-y-2">
                <Label htmlFor="brand">Brand (Optional)</Label>
                <select
                  id="brand"
                  value={formData.brand_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand_id: e.target.value || undefined }))}
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

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  placeholder="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      {option ? 'Update' : 'Create'}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

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
    </motion.div>
  )
} 