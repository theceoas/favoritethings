import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting inventory check API...')
    const requestBody = await request.json()
    const { product_id, variant_id } = requestBody
    console.log('🔍 Checking inventory for:', { product_id, variant_id })
    console.log('📦 Full request body:', requestBody)
    
    if (!product_id) {
      console.error('❌ Product ID is missing')
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    if (variant_id) {
      console.log('🔍 Checking variant inventory')
      
      // Use only core fields that should exist
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select('id, inventory_quantity, is_active, title, sku, price')
        .eq('id', variant_id)
        .single()

      if (error) {
        console.error('❌ Error fetching variant:', error)
        return NextResponse.json({ 
          error: 'Variant not found', 
          details: error.message,
          code: error.code 
        }, { status: 404 })
      }

      console.log('✅ Variant inventory data:', variant)

      return NextResponse.json({
        inventory_quantity: variant.inventory_quantity || 0,
        track_inventory: true, // Default to true since field doesn't exist
        is_active: variant.is_active !== false, // Default to true
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        size: null, // These fields don't exist in current schema
        color: null,
        material: null,
        featured_image: null,
        type: 'variant'
      })
    } else {
      console.log('🔍 Checking product inventory')
      
      const { data: product, error } = await supabase
        .from('products')
        .select('id, inventory_quantity, track_inventory, is_active, title, sku, price, featured_image')
        .eq('id', product_id)
        .single()

      if (error) {
        console.error('❌ Error fetching product:', error)
        return NextResponse.json({ 
          error: 'Product not found', 
          details: error.message,
          code: error.code 
        }, { status: 404 })
      }

      console.log('✅ Product inventory data:', product)

      return NextResponse.json({
        inventory_quantity: product.inventory_quantity || 0,
        track_inventory: product.track_inventory !== false,
        is_active: product.is_active !== false,
        title: product.title,
        sku: product.sku,
        price: product.price,
        featured_image: product.featured_image,
        type: 'product'
      })
    }
  } catch (error) {
    console.error('❌ Error in inventory check API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 