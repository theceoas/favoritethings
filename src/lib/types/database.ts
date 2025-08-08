export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'customer' | 'admin'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: 'shipping' | 'billing' | 'both'
          is_default: boolean
          first_name: string
          last_name: string
          company?: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          phone?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'shipping' | 'billing' | 'both'
          is_default?: boolean
          first_name: string
          last_name: string
          company?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'shipping' | 'billing' | 'both'
          is_default?: boolean
          first_name?: string
          last_name?: string
          company?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          is_active: boolean
          sort_order: number
          preview_image_url: string | null
          preview_title: string | null
          preview_description: string | null
          show_on_homepage: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          is_active?: boolean
          sort_order?: number
          preview_image_url?: string | null
          preview_title?: string | null
          preview_description?: string | null
          show_on_homepage?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          is_active?: boolean
          sort_order?: number
          preview_image_url?: string | null
          preview_title?: string | null
          preview_description?: string | null
          show_on_homepage?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          is_featured: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string
          price: number
          compare_at_price: number | null
          cost_price: number | null
          track_inventory: boolean
          inventory_quantity: number
          low_stock_threshold: number
          weight: number | null
          dimensions: string | null
          material: string | null
          care_instructions: string | null
          images: string[]
          featured_image: string | null
          seo_title: string | null
          seo_description: string | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku: string
          price: number
          compare_at_price?: number | null
          cost_price?: number | null
          track_inventory?: boolean
          inventory_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          dimensions?: string | null
          material?: string | null
          care_instructions?: string | null
          images?: string[]
          featured_image?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string
          price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          track_inventory?: boolean
          inventory_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          dimensions?: string | null
          material?: string | null
          care_instructions?: string | null
          images?: string[]
          featured_image?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          title: string
          sku: string
          price: number
          compare_at_price: number | null
          cost_price: number | null
          inventory_quantity: number
          track_inventory: boolean
          allow_backorder: boolean
          low_stock_threshold: number
          size: string | null
          color: string | null
          material: string | null
          pattern: string | null
          thread_count: string | null
          weight: number | null
          dimensions: any | null // JSONB
          image_url: string | null
          featured_image: string | null
          images: string[] | null
          variant_data: any | null // JSONB
          sort_order: number
          is_active: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          sku: string
          price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          inventory_quantity?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          low_stock_threshold?: number
          size?: string | null
          color?: string | null
          material?: string | null
          pattern?: string | null
          thread_count?: string | null
          weight?: number | null
          dimensions?: any | null
          image_url?: string | null
          featured_image?: string | null
          images?: string[] | null
          variant_data?: any | null
          sort_order?: number
          is_active?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          sku?: string
          price?: number
          compare_at_price?: number | null
          cost_price?: number | null
          inventory_quantity?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          low_stock_threshold?: number
          size?: string | null
          color?: string | null
          material?: string | null
          pattern?: string | null
          thread_count?: string | null
          weight?: number | null
          dimensions?: any | null
          image_url?: string | null
          featured_image?: string | null
          images?: string[] | null
          variant_data?: any | null
          sort_order?: number
          is_active?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          product_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          product_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          product_id?: string
          category_id?: string
          created_at?: string
        }
      }
      product_collections: {
        Row: {
          product_id: string
          collection_id: string
          sort_order: number
          created_at: string
        }
        Insert: {
          product_id: string
          collection_id: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          product_id?: string
          collection_id?: string
          sort_order?: number
          created_at?: string
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          items: CartItem[]
          subtotal: number
          tax_amount: number
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          items?: CartItem[]
          subtotal?: number
          tax_amount?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          items?: CartItem[]
          subtotal?: number
          tax_amount?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          email: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string | null
          payment_reference: string | null
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          total: number
          currency: string
          shipping_address: Address
          billing_address: Address
          tracking_number: string | null
          notes: string | null
          delivery_method: 'shipping' | 'pickup'
          pickup_date: string | null
          pickup_time: string | null
          customer_phone: string | null
          special_instructions: string | null
          promotion_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          email: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          payment_reference?: string | null
          subtotal: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          total: number
          currency?: string
          shipping_address: Address
          billing_address: Address
          tracking_number?: string | null
          notes?: string | null
          delivery_method?: 'shipping' | 'pickup'
          pickup_date?: string | null
          pickup_time?: string | null
          customer_phone?: string | null
          special_instructions?: string | null
          promotion_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          email?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          payment_reference?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          total?: number
          currency?: string
          shipping_address?: Address
          billing_address?: Address
          tracking_number?: string | null
          notes?: string | null
          delivery_method?: 'shipping' | 'pickup'
          pickup_date?: string | null
          pickup_time?: string | null
          customer_phone?: string | null
          special_instructions?: string | null
          promotion_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_variant_id: string | null
          title: string
          variant_title: string | null
          sku: string
          quantity: number
          price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_variant_id?: string | null
          title: string
          variant_title?: string | null
          sku: string
          quantity: number
          price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_variant_id?: string | null
          title?: string
          variant_title?: string | null
          sku?: string
          quantity?: number
          price?: number
          total?: number
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          email: string | null
          name: string
          rating: number
          title: string | null
          comment: string
          is_approved: boolean
          is_verified_purchase: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          email?: string | null
          name: string
          rating: number
          title?: string | null
          comment: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          email?: string | null
          name?: string
          rating?: number
          title?: string | null
          comment?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          minimum_amount: number | null
          usage_limit: number | null
          used_count: number
          is_active: boolean
          starts_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          minimum_amount?: number | null
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed' | 'free_shipping'
          value?: number
          minimum_amount?: number | null
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_blocks: {
        Row: {
          id: string
          key: string
          type: 'hero_banner' | 'featured_collection' | 'announcement' | 'testimonial'
          title: string | null
          content: string | null
          image_url: string | null
          link_url: string | null
          link_text: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          type: 'hero_banner' | 'featured_collection' | 'announcement' | 'testimonial'
          title?: string | null
          content?: string | null
          image_url?: string | null
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          type?: 'hero_banner' | 'featured_collection' | 'announcement' | 'testimonial'
          title?: string | null
          content?: string | null
          image_url?: string | null
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export interface CartItem {
  id: string
  product_id: string
  product_variant_id?: string | null
  title: string
  variant_title?: string | null
  sku: string
  price: number
  quantity: number
  image_url?: string | null
}

export interface Address {
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string | null
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 