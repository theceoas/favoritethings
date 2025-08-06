/**
 * Inventory utility functions for consistent stock calculations
 */

export interface ProductVariant {
  id: string
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  allow_backorder?: boolean
  low_stock_threshold?: number
}

export interface Product {
  id: string
  inventory_quantity: number
  track_inventory: boolean
  is_active: boolean
  variants?: ProductVariant[]
  has_variants?: boolean
}

/**
 * Calculate the total available stock for a product
 * @param product - Product with optional variants
 * @returns Total available stock quantity
 */
export function calculateProductStock(product: Product): number {
  const hasVariants = product.has_variants && product.variants && product.variants.length > 0

  if (hasVariants) {
    // Sum inventory from active variants that track inventory
    return product.variants!
      .filter(variant => variant.is_active)
      .reduce((total, variant) => {
        // Default to tracking inventory if field is null/undefined
        const shouldTrack = variant.track_inventory !== false
        if (shouldTrack) {
          return total + (variant.inventory_quantity || 0)
        }
        return total
      }, 0)
  } else {
    // Use product's own inventory if it tracks inventory (default to tracking if null/undefined)
    const shouldTrack = product.track_inventory !== false
    return shouldTrack ? (product.inventory_quantity || 0) : 0
  }
}

/**
 * Check if a product is available for purchase
 * @param product - Product with optional variants
 * @returns True if product is available
 */
export function isProductAvailable(product: Product): boolean {
  if (!product.is_active) return false

  const hasVariants = product.has_variants && product.variants && product.variants.length > 0

  if (hasVariants) {
    // Check if any variant is available
    return product.variants!.some(variant => {
      if (!variant.is_active) return false
      
      // Default to tracking inventory if field is null/undefined
      const shouldTrack = variant.track_inventory !== false
      
      // If variant doesn't track inventory, assume it's available
      if (!shouldTrack) return true
      
      // If it tracks inventory, check stock or backorder
      return (variant.inventory_quantity || 0) > 0 || variant.allow_backorder
    })
  } else {
    // For products without variants - default to tracking if null/undefined
    const shouldTrack = product.track_inventory !== false
    if (!shouldTrack) return true
    return (product.inventory_quantity || 0) > 0
  }
}

/**
 * Get stock status with urgency message
 * @param quantity - Stock quantity
 * @param lowStockThreshold - Threshold for low stock warning (default: 10)
 * @returns Stock status object
 */
export function getStockStatus(quantity: number, lowStockThreshold: number = 10) {
  const safeQuantity = Number(quantity) || 0

  if (safeQuantity <= 0) {
    return { 
      message: 'Out of Stock', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      level: 'out-of-stock' as const
    }
  } else if (safeQuantity <= 3) {
    return { 
      message: 'Few left!', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      level: 'very-low' as const
    }
  } else if (safeQuantity <= lowStockThreshold) {
    return { 
      message: 'Low Stock', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      level: 'low' as const
    }
  } else if (safeQuantity <= 20) {
    return { 
      message: 'Limited', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      level: 'limited' as const
    }
  } else {
    return { 
      message: 'In Stock', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      level: 'in-stock' as const
    }
  }
}

/**
 * Check if a specific variant is available
 * @param variant - Product variant
 * @returns True if variant is available
 */
export function isVariantAvailable(variant: ProductVariant): boolean {
  if (!variant.is_active) return false
  
  // Default to tracking inventory if field is null/undefined
  const shouldTrack = variant.track_inventory !== false
  
  // If variant doesn't track inventory, assume it's available
  if (!shouldTrack) return true
  
  // If it tracks inventory, check stock or backorder
  return (variant.inventory_quantity || 0) > 0 || variant.allow_backorder || false
}

/**
 * Get the best available variant for a product (default or first available)
 * @param variants - Array of product variants
 * @returns Best variant or null
 */
export function getBestAvailableVariant(variants: ProductVariant[]): ProductVariant | null {
  if (!variants || variants.length === 0) return null

  const activeVariants = variants.filter(v => v.is_active)
  if (activeVariants.length === 0) return null

  // Try to find default variant first
  const defaultVariant = activeVariants.find(v => 
    (v as any).is_default && isVariantAvailable(v)
  )
  if (defaultVariant) return defaultVariant

  // Find first available variant
  const availableVariant = activeVariants.find(v => isVariantAvailable(v))
  if (availableVariant) return availableVariant

  // If no available variants, return first active variant
  return activeVariants[0]
}

/**
 * Format stock quantity for display
 * @param quantity - Stock quantity
 * @param trackInventory - Whether inventory is tracked
 * @returns Formatted string
 */
export function formatStockQuantity(quantity: number, trackInventory: boolean): string {
  if (!trackInventory) return 'Available'
  
  const safeQuantity = Number(quantity) || 0
  if (safeQuantity <= 0) return 'Out of stock'
  if (safeQuantity === 1) return '1 left'
  if (safeQuantity <= 10) return `${safeQuantity} left`
  return 'In stock'
}

/**
 * Calculate maximum purchasable quantity for a product
 * @param product - Product with optional variants
 * @param selectedVariantId - ID of selected variant (if any)
 * @returns Maximum quantity that can be purchased
 */
export function getMaxPurchasableQuantity(
  product: Product, 
  selectedVariantId?: string
): number {
  const hasVariants = product.has_variants && product.variants && product.variants.length > 0

  if (hasVariants && selectedVariantId) {
    // Find specific variant
    const variant = product.variants!.find(v => v.id === selectedVariantId)
    if (!variant || !variant.is_active) return 0
    
    if (!variant.track_inventory) return 999 // Large number for "unlimited"
    return Math.max(0, variant.inventory_quantity || 0)
  } else if (hasVariants) {
    // No specific variant selected, use total across all variants
    return calculateProductStock(product)
  } else {
    // Single product without variants
    if (!product.track_inventory) return 999
    return Math.max(0, product.inventory_quantity || 0)
  }
} 