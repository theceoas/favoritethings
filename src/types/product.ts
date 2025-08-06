export interface ProductVariant {
  id?: string
  product_id: string
  title: string
  sku: string
  barcode?: string
  price: number
  compare_at_price?: number
  cost_price?: number
  inventory_quantity: number
  track_inventory: boolean
  allow_backorder: boolean
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    fitted_depth?: number
  }
  size?: string
  color?: string
  material?: string
  pattern?: string
  variant_data?: Record<string, any>
  sort_order: number
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface Product {
  id?: string
  title: string
  slug: string
  description?: string
  price: number
  sku?: string
  barcode?: string
  track_inventory?: boolean
  inventory_quantity?: number
  allow_backorder?: boolean
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  category_id?: string
  tags?: string[]
  images?: string[]
  is_active?: boolean
  is_featured?: boolean
  meta_title?: string
  meta_description?: string
  created_at?: string
  updated_at?: string
  
  // Variant-related fields
  variants?: ProductVariant[]
  price_from?: number
  price_to?: number
  available_sizes?: string[]
  available_colors?: string[]
  total_inventory?: number
}

export interface Category {
  id?: string
  name: string
  slug: string
  description?: string
  image?: string
  parent_id?: string
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Collection {
  id?: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_featured?: boolean
  is_active?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
  product_collections?: any[]
}

export interface Filter {
  id?: string
  category_id?: string
  name: string
  type: 'select' | 'checkbox' | 'range' | 'color'
  options?: string[]
  min_value?: number
  max_value?: number
  is_required?: boolean
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Helper types for e-commerce operations
export interface CartItem {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  product: Product
  variant?: ProductVariant
}

export interface WishlistItem {
  id: string
  product_id: string
  variant_id?: string
  product: Product
  variant?: ProductVariant
  created_at: string
}

// For product filtering and search
export interface ProductFilters {
  category?: string
  size?: string[]
  color?: string[]
  material?: string[]
  price_min?: number
  price_max?: number
  in_stock?: boolean
  on_sale?: boolean
  search?: string
  sort?: 'title' | 'price_asc' | 'price_desc' | 'created_at' | 'featured'
}

// For admin product management
export interface ProductFormData {
  title: string
  slug: string
  description: string
  category_id: string
  tags: string[]
  images: string[]
  is_active: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
  
  // If no variants, use main product pricing
  price?: number
  sku?: string
  track_inventory?: boolean
  inventory_quantity?: number
  
  // Variants data
  variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]
} 