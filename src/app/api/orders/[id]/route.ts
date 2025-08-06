import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    const { status, payment_status } = await request.json()
    const orderId = params.id

    console.log(`🔄 Orders API - Updating order ${orderId}:`, { status, payment_status })

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get current order status
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        status,
        payment_status,
        promotion_id,
        user_id,
        order_items (
          product_id,
          product_variant_id,
          quantity
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Check if order is being cancelled or refunded
    const isBeingCancelled = status === 'cancelled' || status === 'refunded'
    const wasActiveOrder = currentOrder.status !== 'cancelled' && currentOrder.status !== 'refunded'

    // Restore inventory if order is being cancelled/refunded from an active state
    if (isBeingCancelled && wasActiveOrder) {
      console.log('📦 Restoring inventory for cancelled/refunded order...')
      
      for (const item of currentOrder.order_items) {
        try {
          if (item.product_variant_id) {
            // Restore variant inventory
            const { data: variant, error: variantError } = await supabase
              .from('product_variants')
              .select('inventory_quantity, track_inventory')
              .eq('id', item.product_variant_id)
              .single()

            if (variantError) {
              console.error(`❌ Failed to get variant ${item.product_variant_id}:`, variantError)
              continue
            }

            // Only restore inventory if tracking is enabled
            if (variant.track_inventory) {
              const newQuantity = variant.inventory_quantity + item.quantity
              
              const { error: updateError } = await supabase
                .from('product_variants')
                .update({ inventory_quantity: newQuantity })
                .eq('id', item.product_variant_id)

              if (updateError) {
                console.error(`❌ Failed to restore variant inventory for ${item.product_variant_id}:`, updateError)
              } else {
                console.log(`✅ Restored variant inventory for ${item.product_variant_id}: ${variant.inventory_quantity} → ${newQuantity}`)
              }
            }
          } else {
            // Restore main product inventory only if no variant is specified
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('inventory_quantity, track_inventory')
              .eq('id', item.product_id)
              .single()

            if (productError) {
              console.error(`❌ Failed to get product ${item.product_id}:`, productError)
              continue
            }

            // Only restore inventory if tracking is enabled
            if (product.track_inventory) {
              const newQuantity = product.inventory_quantity + item.quantity
              
              const { error: updateError } = await supabase
                .from('products')
                .update({ inventory_quantity: newQuantity })
                .eq('id', item.product_id)

              if (updateError) {
                console.error(`❌ Failed to restore inventory for product ${item.product_id}:`, updateError)
              } else {
                console.log(`✅ Restored inventory for product ${item.product_id}: ${product.inventory_quantity} → ${newQuantity}`)
              }
            }
          }
        } catch (error) {
          console.error(`❌ Unexpected error restoring inventory for item:`, item, error)
        }
      }
    }

    // 🔥 ADDED: Clean up promotion usage if order is being cancelled/refunded
    if (isBeingCancelled && wasActiveOrder && currentOrder.promotion_id) {
      console.log('🎫 Cleaning up promotion usage for cancelled/refunded order...')
      try {
        // Remove promotion usage record
        const { error: usageDeleteError } = await supabase
          .from('promotion_usage')
          .delete()
          .eq('promotion_id', currentOrder.promotion_id)
          .eq('user_id', currentOrder.user_id)
          .eq('order_id', orderId)

        if (usageDeleteError) {
          console.error('❌ Failed to clean up promotion usage:', usageDeleteError)
        } else {
          // Reduce the promotion's times_used counter
          const { error: promoUpdateError } = await supabase
            .rpc('decrement_promotion_usage', { promotion_id: currentOrder.promotion_id })

          if (promoUpdateError) {
            console.error('❌ Failed to update promotion counter:', promoUpdateError)
          } else {
            console.log('✅ Promotion usage cleaned up successfully')
          }
        }
      } catch (error) {
        console.error('❌ Error cleaning up promotion usage:', error)
      }
    }

    // Update order status
    const updateData: any = {}
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`✅ Orders API - Order ${orderId} updated successfully`)
    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('💥 Orders API - Update error:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
} 