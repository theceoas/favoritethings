import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const debug = {
    step: '',
    success: false,
    error: null,
    data: {},
    logs: []
  }

  try {
    const { product_id, variant_id } = await request.json()
    debug.logs.push(`🚀 Starting debug for product_id: ${product_id}, variant_id: ${variant_id}`)

    // Step 1: Check database schema
    debug.step = 'checking_schema'
    debug.logs.push('📊 Checking product_variants table schema...')
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'product_variants')
      .order('ordinal_position')

    if (schemaError) {
      debug.logs.push(`❌ Schema check failed: ${schemaError.message}`)
    } else {
      debug.logs.push(`✅ Schema found ${schemaData?.length || 0} columns`)
      debug.data.schema = schemaData
    }

    // Step 2: Test basic product_variants query
    debug.step = 'testing_basic_query'
    debug.logs.push('🔍 Testing basic product_variants query...')
    
    const { data: basicTest, error: basicError } = await supabase
      .from('product_variants')
      .select('id, title, sku')
      .limit(1)

    if (basicError) {
      debug.logs.push(`❌ Basic query failed: ${basicError.message}`)
      debug.error = basicError
    } else {
      debug.logs.push(`✅ Basic query works, found ${basicTest?.length || 0} variants`)
    }

    // Step 3: Check if our specific variant exists
    if (variant_id) {
      debug.step = 'checking_variant_exists'
      debug.logs.push(`🔍 Checking if variant ${variant_id} exists...`)
      
      const { data: variantExists, error: existsError } = await supabase
        .from('product_variants')
        .select('id, title')
        .eq('id', variant_id)
        .single()

      if (existsError) {
        debug.logs.push(`❌ Variant not found: ${existsError.message}`)
      } else {
        debug.logs.push(`✅ Variant found: ${variantExists?.title}`)
        debug.data.variant_exists = variantExists
      }
    }

    // Step 4: Test field-by-field access
    debug.step = 'testing_fields'
    debug.logs.push('🔍 Testing individual field access...')
    
    const fieldsToTest = [
      'id', 'product_id', 'title', 'sku', 'price', 'inventory_quantity', 
      'is_active', 'track_inventory', 'size', 'color', 'material', 
      'featured_image', 'image_url', 'images'
    ]
    
    const availableFields = []
    const missingFields = []

    for (const field of fieldsToTest) {
      try {
        const { data, error } = await supabase
          .from('product_variants')
          .select(field)
          .limit(1)
          .single()
        
        if (error && error.code === '42703') {
          missingFields.push(field)
          debug.logs.push(`❌ Field '${field}' does not exist`)
        } else {
          availableFields.push(field)
          debug.logs.push(`✅ Field '${field}' exists`)
        }
      } catch (e) {
        missingFields.push(field)
        debug.logs.push(`❌ Field '${field}' test failed`)
      }
    }

    debug.data.available_fields = availableFields
    debug.data.missing_fields = missingFields

    // Step 5: Test full inventory check query
    if (variant_id && availableFields.length > 0) {
      debug.step = 'testing_inventory_query'
      debug.logs.push('🔍 Testing full inventory check query...')
      
      const selectFields = availableFields.join(', ')
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('product_variants')
        .select(selectFields)
        .eq('id', variant_id)
        .single()

      if (inventoryError) {
        debug.logs.push(`❌ Inventory query failed: ${inventoryError.message}`)
        debug.error = inventoryError
      } else {
        debug.logs.push(`✅ Inventory query succeeded`)
        debug.data.inventory_data = inventoryData
      }
    }

    // Step 6: Check products table
    debug.step = 'checking_products'
    debug.logs.push('🔍 Checking products table...')
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, title, inventory_quantity, track_inventory, is_active')
      .eq('id', product_id)
      .single()

    if (productError) {
      debug.logs.push(`❌ Product query failed: ${productError.message}`)
    } else {
      debug.logs.push(`✅ Product found: ${productData?.title}`)
      debug.data.product_data = productData
    }

    debug.success = true
    debug.logs.push('🎉 Debug completed successfully')

  } catch (error) {
    debug.error = error instanceof Error ? error.message : String(error)
    debug.logs.push(`💥 Unexpected error: ${debug.error}`)
  }

  return NextResponse.json({
    debug,
    timestamp: new Date().toISOString(),
    summary: {
      current_step: debug.step,
      success: debug.success,
      error: debug.error,
      total_logs: debug.logs.length
    }
  })
} 