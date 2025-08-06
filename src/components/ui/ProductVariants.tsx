'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Trash2, Plus, Package, DollarSign, Palette, Ruler } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export interface ProductVariant {
  id?: string
  title: string
  sku: string
  price: number
  compare_at_price?: number
  cost_price?: number
  inventory_quantity: number
  size?: string
  color?: string
  material?: string
  pattern?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    fitted_depth?: number
  }
  is_active: boolean
  is_default: boolean
  sort_order: number
}

interface ProductVariantsProps {
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
  productTitle?: string
}

const BEDDING_SIZES = [
  'Twin',
  'Twin XL', 
  'Full',
  'Queen',
  'King',
  'California King',
  'Split King'
]

const COMMON_COLORS = [
  'White',
  'Ivory',
  'Cream',
  'Gray',
  'Charcoal',
  'Navy',
  'Black',
  'Beige',
  'Sage',
  'Blush',
  'Dusty Rose'
]

const MATERIALS = [
  '100% Cotton',
  'Cotton Blend',
  'Bamboo',
  'Bamboo Blend',
  'Linen',
  'Microfiber',
  'Percale',
  'Sateen',
  'Jersey Knit',
  'Flannel'
]

export default function ProductVariants({ variants, onChange, productTitle = 'Product' }: ProductVariantsProps) {
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>(variants)

  useEffect(() => {
    setLocalVariants(variants)
  }, [variants])

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...localVariants]
    
    if (field === 'dimensions') {
      updated[index] = {
        ...updated[index],
        dimensions: { ...updated[index].dimensions, ...value }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    // Auto-generate title if size or color changes
    if (field === 'size' || field === 'color') {
      const variant = updated[index]
      const titleParts = []
      if (variant.size) titleParts.push(`${variant.size} Size`)
      if (variant.color) titleParts.push(variant.color)
      updated[index].title = titleParts.join(' - ') || `Variant ${index + 1}`
    }

    // Auto-generate SKU if title changes  
    if (field === 'title' || field === 'size' || field === 'color') {
      const variant = updated[index]
      const skuParts = [
        productTitle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8),
        String(index + 1).padStart(3, '0')
      ]
      if (variant.size) skuParts.push(variant.size.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase())
      if (variant.color) skuParts.push(variant.color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase())
      
      updated[index].sku = skuParts.join('-')
    }

    setLocalVariants(updated)
    onChange(updated)
  }

  const addVariant = () => {
    const newVariant: ProductVariant = {
      title: `Variant ${localVariants.length + 1}`,
      sku: `${productTitle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}-${String(localVariants.length + 1).padStart(3, '0')}`,
      price: 0,
      inventory_quantity: 0,
      is_active: true,
      is_default: localVariants.length === 0,
      sort_order: localVariants.length + 1,
      dimensions: {}
    }
    
    const updated = [...localVariants, newVariant]
    setLocalVariants(updated)
    onChange(updated)
  }

  const removeVariant = (index: number) => {
    const updated = localVariants.filter((_, i) => i !== index)
    
    // Ensure we have a default variant
    if (updated.length > 0 && !updated.some(v => v.is_default)) {
      updated[0].is_default = true
    }
    
    setLocalVariants(updated)
    onChange(updated)
  }

  const setAsDefault = (index: number) => {
    const updated = localVariants.map((variant, i) => ({
      ...variant,
      is_default: i === index
    }))
    setLocalVariants(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#4F4032]">Product Variants</h3>
          <p className="text-sm text-gray-600">
            Create different sizes, colors, and variations of your product
          </p>
        </div>
        <Button
          type="button"
          onClick={addVariant}
          className="bg-[#6A41A1] hover:bg-[#5a3691] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {localVariants.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No variants created yet. Add variants to offer different sizes, colors, or options.
            </p>
            <Button onClick={addVariant} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create First Variant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localVariants.map((variant, index) => (
            <Card key={index} className={`border ${variant.is_default ? 'border-[#FFD84D] bg-[#FFD84D]/5' : 'border-gray-200'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Variant {index + 1}
                    {variant.is_default && (
                      <Badge variant="secondary" className="bg-[#FFD84D] text-[#4F4032]">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!variant.is_default && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(index)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-title-${index}`}>Variant Title</Label>
                    <Input
                      id={`variant-title-${index}`}
                      value={variant.title}
                      onChange={(e) => updateVariant(index, 'title', e.target.value)}
                      placeholder="e.g., Queen Size - White"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                    <Input
                      id={`variant-sku-${index}`}
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      placeholder="Unique product code"
                    />
                  </div>
                </div>

                {/* Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-size-${index}`} className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Size
                    </Label>
                    <Select 
                      value={variant.size || ''} 
                      onValueChange={(value) => updateVariant(index, 'size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {BEDDING_SIZES.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-color-${index}`} className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color
                    </Label>
                    <Select 
                      value={variant.color || ''} 
                      onValueChange={(value) => updateVariant(index, 'color', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_COLORS.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-material-${index}`}>Material</Label>
                    <Select 
                      value={variant.material || ''} 
                      onValueChange={(value) => updateVariant(index, 'material', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIALS.map(material => (
                          <SelectItem key={material} value={material}>{material}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-price-${index}`} className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Price
                    </Label>
                    <Input
                      id={`variant-price-${index}`}
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-compare-price-${index}`}>Compare At Price</Label>
                    <Input
                      id={`variant-compare-price-${index}`}
                      type="number"
                      step="0.01"
                      value={variant.compare_at_price || ''}
                      onChange={(e) => updateVariant(index, 'compare_at_price', parseFloat(e.target.value) || undefined)}
                      placeholder="Original price"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-inventory-${index}`}>Inventory</Label>
                    <Input
                      id={`variant-inventory-${index}`}
                      type="number"
                      value={variant.inventory_quantity}
                      onChange={(e) => updateVariant(index, 'inventory_quantity', parseInt(e.target.value) || 0)}
                      placeholder="Stock quantity"
                    />
                  </div>
                </div>

                {/* Dimensions (for bedding products) */}
                {variant.size && (
                  <div className="space-y-2">
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Length</Label>
                        <Input
                          type="number"
                          value={variant.dimensions?.length || ''}
                          onChange={(e) => updateVariant(index, 'dimensions', { length: parseFloat(e.target.value) || undefined })}
                          placeholder="200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={variant.dimensions?.width || ''}
                          onChange={(e) => updateVariant(index, 'dimensions', { width: parseFloat(e.target.value) || undefined })}
                          placeholder="150"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={variant.dimensions?.height || ''}
                          onChange={(e) => updateVariant(index, 'dimensions', { height: parseFloat(e.target.value) || undefined })}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fitted Depth</Label>
                        <Input
                          type="number"
                          value={variant.dimensions?.fitted_depth || ''}
                          onChange={(e) => updateVariant(index, 'dimensions', { fitted_depth: parseFloat(e.target.value) || undefined })}
                          placeholder="35"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {localVariants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Variant Tips:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• The default variant will be selected first when customers visit the product</li>
                <li>• SKUs must be unique across all products</li>
                <li>• Inventory is tracked separately for each variant</li>
                <li>• Dimensions help with shipping calculations</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 