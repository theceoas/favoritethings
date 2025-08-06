import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { action, product_id, variant_id, quantity = 1 } = await request.json()
    
    console.log('🧪 Testing inventory:', { action, product_id, variant_id, quantity })
    
    if (action === 'check_schema') {
      // Check what fields exist in the tables
      const { data: productColumns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'products')
        .order('ordinal_position')
        
      const { data: variantColumns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'product_variants')
        .order('ordinal_position')
        
      return NextResponse.json({
        productColumns,
        variantColumns
      })
    }
    
    if (action === 'check_current_inventory') {
      if (variant_id) {
        const { data: variant, error } = await supabase
          .from('product_variants')
          .select('*')
          .eq('id', variant_id)
          .single()
          
        console.log('🔍 Current variant inventory:', variant)
        return NextResponse.json({ variant, error })
      } else {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', product_id)
          .single()
          
        console.log('🔍 Current product inventory:', product)
        return NextResponse.json({ product, error })
      }
    }
    
    if (action === 'reduce_inventory') {
      if (variant_id) {
        // Test variant inventory reduction
        const { data: variant, error: fetchError } = await supabase
          .from('product_variants')
          .select('inventory_quantity, track_inventory')
          .eq('id', variant_id)
          .single()
          
        if (fetchError) {
          return NextResponse.json({ error: 'Variant not found', details: fetchError }, { status: 404 })
        }
        
        console.log('📦 Before reduction - Variant:', variant)
        
        const shouldTrack = variant.track_inventory !== false
        if (shouldTrack) {
          const newQuantity = Math.max(0, (variant.inventory_quantity || 0) - quantity)
          
          const { data: updateResult, error: updateError } = await supabase
            .from('product_variants')
            .update({ inventory_quantity: newQuantity })
            .eq('id', variant_id)
            .select()
            
          console.log('✅ After reduction - Update result:', updateResult)
          
          return NextResponse.json({
            success: !updateError,
            before: variant.inventory_quantity,
            after: newQuantity,
            shouldTrack,
            updateResult,
            error: updateError
          })
        } else {
          return NextResponse.json({
            success: true,
            message: 'Inventory tracking disabled for this variant',
            shouldTrack: false
          })
        }
      } else {
        // Test product inventory reduction
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('inventory_quantity, track_inventory')
          .eq('id', product_id)
          .single()
          
        if (fetchError) {
          return NextResponse.json({ error: 'Product not found', details: fetchError }, { status: 404 })
        }
        
        console.log('📦 Before reduction - Product:', product)
        
        if (product.track_inventory) {
          const newQuantity = Math.max(0, (product.inventory_quantity || 0) - quantity)
          
          const { data: updateResult, error: updateError } = await supabase
            .from('products')
            .update({ inventory_quantity: newQuantity })
            .eq('id', product_id)
            .select()
            
          console.log('✅ After reduction - Update result:', updateResult)
          
          return NextResponse.json({
            success: !updateError,
            before: product.inventory_quantity,
            after: newQuantity,
            trackInventory: product.track_inventory,
            updateResult,
            error: updateError
          })
        } else {
          return NextResponse.json({
            success: true,
            message: 'Inventory tracking disabled for this product',
            trackInventory: false
          })
        }
      }
    }
    
    if (action === 'simulate_order') {
      // Simulate a complete order flow
      const orderItems = [{
        product_id,
        product_variant_id: variant_id,
        quantity,
        title: 'Test Product'
      }]
      
      console.log('🛒 Simulating order with items:', orderItems)
      
      const results = []
      
      for (const item of orderItems) {
        if (item.product_variant_id) {
          // Handle variant
          const { data: variant, error } = await supabase
            .from('product_variants')
            .select('inventory_quantity, track_inventory, title')
            .eq('id', item.product_variant_id)
            .single()
            
          if (!error && variant) {
            const shouldTrack = variant.track_inventory !== false
            if (shouldTrack) {
              const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity)
              
              const { error: updateError } = await supabase
                .from('product_variants')
                .update({ inventory_quantity: newQuantity })
                .eq('id', item.product_variant_id)
                
              results.push({
                type: 'variant',
                id: item.product_variant_id,
                title: variant.title,
                before: variant.inventory_quantity,
                after: newQuantity,
                shouldTrack,
                updateError
              })
            }
          }
        } else {
          // Handle product
          const { data: product, error } = await supabase
            .from('products')
            .select('inventory_quantity, track_inventory, title')
            .eq('id', item.product_id)
            .single()
            
          if (!error && product) {
            if (product.track_inventory) {
              const newQuantity = Math.max(0, product.inventory_quantity - item.quantity)
              
              const { error: updateError } = await supabase
                .from('products')
                .update({ inventory_quantity: newQuantity })
                .eq('id', item.product_id)
                
              results.push({
                type: 'product',
                id: item.product_id,
                title: product.title,
                before: product.inventory_quantity,
                after: newQuantity,
                trackInventory: product.track_inventory,
                updateError
              })
            }
          }
        }
      }
      
      return NextResponse.json({
        message: 'Order simulation complete',
        results
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Test inventory error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 