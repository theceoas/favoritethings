'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { Card } from './card'
import { ProductVariant } from '@/types/product'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils/formatPrice'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant?: ProductVariant
  onVariantChange: (variant: ProductVariant) => void
  className?: string
}

export default function VariantSelector({ 
  variants, 
  selectedVariant, 
  onVariantChange,
  className = '' 
}: VariantSelectorProps) {
  const [activeVariant, setActiveVariant] = useState<ProductVariant | undefined>(selectedVariant)

  // Get unique options for each attribute
  const uniqueSizes = [...new Set(variants.filter(v => v.size).map(v => v.size))].sort()
  const uniqueColors = [...new Set(variants.filter(v => v.color).map(v => v.color))].sort()
  const uniqueMaterials = [...new Set(variants.filter(v => v.material).map(v => v.material))].sort()

  const [selectedSize, setSelectedSize] = useState<string | undefined>(selectedVariant?.size)
  const [selectedColor, setSelectedColor] = useState<string | undefined>(selectedVariant?.color)
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>(selectedVariant?.material)

  // Find matching variant based on selected attributes
  useEffect(() => {
    const matchingVariant = variants.find(variant => 
      variant.is_active &&
      (!selectedSize || variant.size === selectedSize) &&
      (!selectedColor || variant.color === selectedColor) &&
      (!selectedMaterial || variant.material === selectedMaterial)
    )

    if (matchingVariant && matchingVariant !== activeVariant) {
      setActiveVariant(matchingVariant)
      onVariantChange(matchingVariant)
    }
  }, [selectedSize, selectedColor, selectedMaterial, variants, activeVariant, onVariantChange])

  // Set default variant on mount
  useEffect(() => {
    if (!activeVariant && variants.length > 0) {
      const defaultVariant = variants.find(v => v.is_default && v.is_active) || variants.find(v => v.is_active)
      if (defaultVariant) {
        setActiveVariant(defaultVariant)
        setSelectedSize(defaultVariant.size)
        setSelectedColor(defaultVariant.color)
        setSelectedMaterial(defaultVariant.material)
        onVariantChange(defaultVariant)
      }
    }
  }, [variants, activeVariant, onVariantChange])

  // Check if a specific option combination is available
  const isOptionAvailable = (type: 'size' | 'color' | 'material', value: string) => {
    const filters: any = {}
    if (type !== 'size' && selectedSize) filters.size = selectedSize
    if (type !== 'color' && selectedColor) filters.color = selectedColor
    if (type !== 'material' && selectedMaterial) filters.material = selectedMaterial
    filters[type] = value

    return variants.some(variant => 
      variant.is_active &&
      variant.inventory_quantity > 0 &&
      (!filters.size || variant.size === filters.size) &&
      (!filters.color || variant.color === filters.color) &&
      (!filters.material || variant.material === filters.material)
    )
  }

  // Get stock for a specific size
  const getSizeStock = (size: string) => {
    const sizeVariants = variants.filter(variant => 
      variant.is_active &&
      variant.size === size &&
      (!selectedColor || variant.color === selectedColor) &&
      (!selectedMaterial || variant.material === selectedMaterial)
    )
    
    return sizeVariants.reduce((total, variant) => total + variant.inventory_quantity, 0)
  }

  // Get stock status color and message
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { color: 'text-red-600', message: 'Out of Stock', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
    } else if (stock <= 3) {
      return { color: 'text-orange-600', message: 'Low Stock', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' }
    } else if (stock <= 10) {
      return { color: 'text-yellow-600', message: 'Limited Stock', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
    } else {
      return { color: 'text-green-600', message: 'In Stock', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
    }
  }

  if (variants.length === 0) {
    return null
  }

  // If only one variant, show minimal info
  if (variants.length === 1) {
    const variant = variants[0]
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-[#4F4032]">
            {formatPrice(variant.price)}
            {variant.compare_at_price && variant.compare_at_price > variant.price && (
              <span className="text-lg text-gray-500 line-through ml-2">
                {formatPrice(variant.compare_at_price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {variant.inventory_quantity > 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                In Stock
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Price Display */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-[#4F4032]">
          {activeVariant ? (
            <>
              {formatPrice(activeVariant.price)}
              {activeVariant.compare_at_price && activeVariant.compare_at_price > activeVariant.price && (
                <span className="text-lg text-gray-500 line-through ml-2">
                  {formatPrice(activeVariant.compare_at_price)}
                </span>
              )}
            </>
          ) : (
            <>
              {formatPrice(Math.min(...variants.map(v => v.price)))} - {formatPrice(Math.max(...variants.map(v => v.price)))}
            </>
          )}
        </div>
        
        {activeVariant && (
          <div className="flex items-center gap-2">
            {activeVariant.inventory_quantity > 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                In Stock
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Out of Stock
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Size Selector */}
      {uniqueSizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[#4F4032]">Size</h4>
            {selectedSize && (
              <Badge variant="outline" className="text-xs">
                {selectedSize}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uniqueSizes.map(size => {
              const available = isOptionAvailable('size', size)
              const isSelected = selectedSize === size
              const stock = getSizeStock(size)
              const stockStatus = getStockStatus(stock)
              
              return (
                <div
                  key={size}
                  className={`
                    relative border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-[#6A41A1] bg-[#6A41A1] text-white' 
                      : available 
                        ? 'hover:border-[#6A41A1] hover:bg-[#6A41A1]/5 border-gray-200' 
                        : 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                    }
                  `}
                  onClick={() => available && setSelectedSize(size)}
                >
                  <div className="text-center">
                    <div className={`font-medium ${isSelected ? 'text-white' : 'text-[#4F4032]'}`}>
                      {size}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isSelected 
                        ? 'text-white/90' 
                        : available 
                          ? stockStatus.color 
                          : 'text-gray-400'
                    }`}>
                      {available ? stockStatus.message : 'Out of Stock'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {uniqueColors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[#4F4032]">Color</h4>
            {selectedColor && (
              <Badge variant="outline" className="text-xs">
                {selectedColor}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map(color => {
              const available = isOptionAvailable('color', color)
              const isSelected = selectedColor === color
              
              return (
                <Button
                  key={color}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!available}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    ${isSelected 
                      ? 'bg-[#6A41A1] text-white border-[#6A41A1]' 
                      : available 
                        ? 'hover:border-[#6A41A1] hover:text-[#6A41A1]' 
                        : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {color}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Material Selector */}
      {uniqueMaterials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[#4F4032]">Material</h4>
            {selectedMaterial && (
              <Badge variant="outline" className="text-xs">
                {selectedMaterial}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueMaterials.map(material => {
              const available = isOptionAvailable('material', material)
              const isSelected = selectedMaterial === material
              
              return (
                <Button
                  key={material}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!available}
                  onClick={() => setSelectedMaterial(material)}
                  className={`
                    ${isSelected 
                      ? 'bg-[#6A41A1] text-white border-[#6A41A1]' 
                      : available 
                        ? 'hover:border-[#6A41A1] hover:text-[#6A41A1]' 
                        : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {material}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Variant Details */}
      {activeVariant && (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-[#6A41A1] mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-[#4F4032]">{activeVariant.title}</h5>
                <Badge variant="outline" className="text-xs">
                  SKU: {activeVariant.sku}
                </Badge>
              </div>
              
              {/* Stock Information */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div className={`flex items-center gap-2 ${
                    activeVariant.inventory_quantity === 0 
                      ? 'text-red-600' 
                      : activeVariant.inventory_quantity <= 3 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      activeVariant.inventory_quantity === 0 
                        ? 'bg-red-500' 
                        : activeVariant.inventory_quantity <= 3 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                    }`} />
                    <span className="font-medium">
                      {activeVariant.inventory_quantity === 0 
                        ? 'Out of Stock' 
                        : activeVariant.inventory_quantity <= 3 
                          ? 'Low Stock' 
                          : 'In Stock'
                      }
                    </span>
                  </div>
                </div>
                
                {activeVariant.inventory_quantity > 0 && activeVariant.inventory_quantity <= 10 && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                    ⚠️ Limited Stock
                  </Badge>
                )}
              </div>
              
              {activeVariant.dimensions && (
                <div className="text-sm text-gray-600">
                  <div className="flex flex-wrap gap-4">
                    {activeVariant.dimensions.length && (
                      <span>Length: {activeVariant.dimensions.length}cm</span>
                    )}
                    {activeVariant.dimensions.width && (
                      <span>Width: {activeVariant.dimensions.width}cm</span>
                    )}
                    {activeVariant.dimensions.fitted_depth && (
                      <span>Fitted Depth: {activeVariant.dimensions.fitted_depth}cm</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Out of Stock Message */}
      {!activeVariant && variants.length > 1 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center text-red-700">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">This combination is currently unavailable</h4>
            <p className="text-sm mb-4">The selected size/color/material combination is out of stock.</p>
            
            {/* Show available alternatives */}
            <div className="text-left bg-white rounded-lg p-3 border border-red-200">
              <p className="text-xs font-medium text-red-800 mb-2">Available alternatives:</p>
              <div className="space-y-1">
                {variants
                  .filter(v => v.is_active && v.inventory_quantity > 0)
                  .slice(0, 3)
                  .map(variant => (
                    <div key={variant.id} className="text-xs text-red-600">
                      {variant.size && `Size: ${variant.size}`}
                      {variant.color && ` • Color: ${variant.color}`}
                      {variant.material && ` • Material: ${variant.material}`}
                      <span className="text-green-600 ml-2">(Available)</span>
                    </div>
                  ))}
                {variants.filter(v => v.is_active && v.inventory_quantity > 0).length > 3 && (
                  <div className="text-xs text-red-500">
                    +{variants.filter(v => v.is_active && v.inventory_quantity > 0).length - 3} more available
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All Variants Out of Stock */}
      {variants.every(v => !v.is_active || v.inventory_quantity === 0) && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center text-red-700">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Currently Out of Stock</h4>
            <p className="text-sm mb-4">This product is temporarily unavailable in all sizes.</p>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600">
                💡 <strong>Tip:</strong> Check back soon or contact us about restocking timeline.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 