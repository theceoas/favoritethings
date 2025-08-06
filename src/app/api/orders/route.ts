import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  // Check if user is admin to see all orders or just their own
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          title,
          featured_image
        )
      )
    `)

  if (profile?.role !== 'admin') {
    query = query.eq('user_id', user.id)
  }

  const { data: orders, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    console.log('🚀 Orders API - Starting order creation')
    
    const {
      items,
      shippingAddress,
      billingAddress,
      email,
      sessionId,
      deliveryMethod = 'shipping',
      pickupDate,
      pickupTime,
      customerPhone,
      specialInstructions,
      promotion
    } = await request.json()

    console.log('📦 Orders API - Received data:', {
      itemsCount: items?.length,
      email,
      deliveryMethod,
      hasShippingAddress: !!shippingAddress,
      hasPromotion: !!promotion
    })

    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Orders API - User context:', { userId: user?.id, userEmail: user?.email })

    // Validate basic requirements
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Orders API - No items provided')
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 })
    }

    if (!shippingAddress || !email) {
      console.error('❌ Orders API - Missing shipping address or email')
      return NextResponse.json({ error: 'Shipping address and email are required' }, { status: 400 })
    }

    // 🔥 NEW: COMPREHENSIVE STOCK VALIDATION BEFORE ORDER CREATION
    console.log('🔍 Orders API - Validating stock availability...')
    const stockValidationErrors = []
    
    for (const item of items) {
      if (item.product_variant_id) {
        // Check variant stock
        // Use defensive querying for variants since track_inventory may not exist
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('inventory_quantity, title, is_active, sku')
          .eq('id', item.product_variant_id)
          .single()

        if (variantError) {
          console.error(`❌ Failed to fetch variant ${item.product_variant_id}:`, variantError)
          stockValidationErrors.push(`Unable to verify stock for ${item.title} - ${item.variant_title}`)
          continue
        }

        if (!variant.is_active) {
          stockValidationErrors.push(`${item.title} - ${item.variant_title} is no longer available`)
          continue
        }

        // Default to tracking inventory if field doesn't exist
        const shouldTrackInventory = variant.track_inventory !== false // Default to true
        if (shouldTrackInventory && variant.inventory_quantity < item.quantity) {
          stockValidationErrors.push(
            `Insufficient stock for ${item.title} - ${item.variant_title}. ` +
            `Only ${variant.inventory_quantity} available, but ${item.quantity} requested.`
          )
        }
      } else {
        // Check main product stock only if no variant is specified
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('inventory_quantity, track_inventory, title, is_active')
          .eq('id', item.product_id)
          .single()

        if (productError) {
          console.error(`❌ Failed to fetch product ${item.product_id}:`, productError)
          stockValidationErrors.push(`Unable to verify stock for ${item.title}`)
          continue
        }

        if (!product.is_active) {
          stockValidationErrors.push(`${item.title} is no longer available`)
          continue
        }

        // Default to tracking inventory if field doesn't exist
        const shouldTrackInventory = product.track_inventory !== false // Default to true
        if (shouldTrackInventory && product.inventory_quantity < item.quantity) {
          stockValidationErrors.push(
            `Insufficient stock for ${item.title}. ` +
            `Only ${product.inventory_quantity} available, but ${item.quantity} requested.`
          )
        }
      }
    }

    // If there are stock validation errors, return them
    if (stockValidationErrors.length > 0) {
      console.error('❌ Orders API - Stock validation failed:', stockValidationErrors)
      return NextResponse.json({ 
        error: 'Stock validation failed',
        details: stockValidationErrors
      }, { status: 400 })
    }

    console.log('✅ Orders API - Stock validation passed')

    // Validate promotion if present
    let validatedPromotion = null;
    let discountAmount = 0;
    
    if (promotion && user) {
      console.log('🎫 Orders API - Validating promotion:', promotion.code);
      
      // Check if promo exists and is valid
      const { data: promo, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promotion.code)
        .eq('is_active', true)
        .maybeSingle();

      if (promoError) throw promoError;

      if (!promo) {
        return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
      }

      // Check if promo is within valid date range
      const now = new Date();
      if (now < new Date(promo.valid_from) || now > new Date(promo.valid_until)) {
        return NextResponse.json({ error: 'Promotion code has expired' }, { status: 400 });
      }

      // Note: Global usage limits removed - now using per-user limits only

      // Check if user has reached their personal usage limit for this promo
      const { data: userUsageData, error: usageError } = await supabase
        .from('promotion_usage')
        .select('*')
        .eq('promotion_id', promo.id)
        .eq('user_id', user.id);

      if (usageError) throw usageError;

      const userUsageCount = userUsageData ? userUsageData.length : 0;
      
      if (userUsageCount >= promo.usage_limit) {
        return NextResponse.json({ 
          error: `You have already used this promotion code ${promo.usage_limit} time(s)` 
        }, { status: 400 });
      }

      validatedPromotion = promo;
      discountAmount = promotion.discount_amount;
    }

    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = subtotal * 0.075 // 7.5% VAT
    const shippingAmount = deliveryMethod === 'pickup' ? 0 : (subtotal >= 50000 ? 0 : 5000) // Free for pickup or orders over ₦50,000
    const total = subtotal + taxAmount + shippingAmount - discountAmount

    // Generate brand-specific order number
    let orderNumber: string
    
    try {
      // Get the brand from the first item's product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('brand_id')
        .eq('id', items[0].product_id)
        .single()
      
      if (productError) {
        console.warn('⚠️ Could not determine brand, using default prefix')
        const timestamp = Date.now()
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        orderNumber = `BZ${new Date().getFullYear()}${String(timestamp).slice(-6)}${randomPart}`
      } else {
        // Get brand slug to determine prefix
        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('slug')
          .eq('id', product.brand_id)
          .single()
        
        if (brandError) {
          console.warn('⚠️ Could not determine brand, using default prefix')
          const timestamp = Date.now()
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          orderNumber = `BZ${new Date().getFullYear()}${String(timestamp).slice(-6)}${randomPart}`
        } else {
          // Generate brand-specific order number
          const date = new Date()
          const dateStr = date.getFullYear().toString() + 
                         (date.getMonth() + 1).toString().padStart(2, '0') + 
                         date.getDate().toString().padStart(2, '0')
          
          // Get the next sequence number for this brand and date
          const { data: existingOrders, error: countError } = await supabase
            .from('orders')
            .select('order_number')
            .like('order_number', `${brand.slug.toUpperCase()}-${dateStr}-%`)
            .order('order_number', { ascending: false })
            .limit(1)
          
          let sequence = 1
          if (!countError && existingOrders && existingOrders.length > 0) {
            const lastOrderNumber = existingOrders[0].order_number
            const lastSequence = parseInt(lastOrderNumber.split('-')[2])
            sequence = lastSequence + 1
          }
          
          orderNumber = `${brand.slug.toUpperCase()}-${dateStr}-${sequence.toString().padStart(3, '0')}`
        }
      }
    } catch (error) {
      console.warn('⚠️ Error generating brand-specific order number, using fallback')
      const timestamp = Date.now()
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      orderNumber = `BZ${new Date().getFullYear()}${String(timestamp).slice(-6)}${randomPart}`
    }
    console.log('🔢 Orders API - Generated order number:', orderNumber)

    // Create order
    console.log('💾 Orders API - Creating order in database...')
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        email,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total,
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
        currency: 'NGN',
        delivery_method: deliveryMethod,
        pickup_date: pickupDate || null,
        pickup_time: pickupTime || null,
        customer_phone: customerPhone || null,
        special_instructions: specialInstructions || null,
        promotion_id: validatedPromotion?.id || null
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Orders API - Order creation failed:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    console.log('✅ Orders API - Order created successfully:', { id: order.id, orderNumber: order.order_number })

    // 🔥 FIXED: Record promotion usage using the proper database function
    if (validatedPromotion && user) {
      console.log('🎫 Orders API - Recording promotion usage...')
      try {
        // Try to use database function first
        const { error: usageError } = await supabase
          .rpc('record_promotion_usage', {
            p_promotion_id: validatedPromotion.id,
            p_user_id: user.id,
            p_order_id: order.id
          })

        if (usageError) {
          console.warn('⚠️ Database function not available, using manual promotion usage recording')
          // Fallback: manually record promotion usage
          const { error: manualUsageError } = await supabase
            .from('promotion_usage')
            .insert({
              promotion_id: validatedPromotion.id,
              user_id: user.id,
              order_id: order.id
            })

          if (manualUsageError) {
            console.error('❌ Failed to record promotion usage manually:', manualUsageError)
            // Don't fail the order, but log the issue
          } else {
            console.log('✅ Promotion usage recorded successfully using manual method')
          }
        } else {
          console.log('✅ Promotion usage recorded successfully using database function')
        }
      } catch (error) {
        console.error('❌ Error recording promotion usage:', error)
        // Don't fail the order for this
      }
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_variant_id: item.product_variant_id,
      title: item.title,
      variant_title: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    console.log('✅ Orders API - Order items created successfully')

    // 🔥 IMPROVED: Reduce inventory with better error handling and validation
    console.log('📦 Orders API - Reducing inventory for products...')
    console.log('📋 Items to process for inventory reduction:', items.map(item => ({
      product_id: item.product_id,
      product_variant_id: item.product_variant_id,
      title: item.title,
      quantity: item.quantity
    })))
    const inventoryUpdateErrors = []
    
    for (const item of items) {
      try {
        if (item.product_variant_id) {
          // Handle variant inventory
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('inventory_quantity')
            .eq('id', item.product_variant_id)
            .single()

          if (variantError) {
            console.error(`❌ Failed to get variant ${item.product_variant_id}:`, variantError)
            inventoryUpdateErrors.push(`Failed to update inventory for ${item.title} - ${item.variant_title}`)
            continue
          }

          // Default to tracking inventory for variants since field may not exist
          const shouldTrackInventory = variant.track_inventory !== false // Default to true
          if (shouldTrackInventory) {
            const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity)
            
            const { error: updateError } = await supabase
              .from('product_variants')
              .update({ inventory_quantity: newQuantity })
              .eq('id', item.product_variant_id)

            if (updateError) {
              console.error(`❌ Failed to update variant inventory for ${item.product_variant_id}:`, updateError)
              inventoryUpdateErrors.push(`Failed to update inventory for ${item.title} - ${item.variant_title}`)
            } else {
              console.log(`✅ Updated variant inventory for ${item.product_variant_id}: ${variant.inventory_quantity} → ${newQuantity}`)
            }
          }
        } else {
          // Handle main product inventory only if no variant is specified
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('inventory_quantity, track_inventory')
            .eq('id', item.product_id)
            .single()

          if (productError) {
            console.error(`❌ Failed to get product ${item.product_id}:`, productError)
            inventoryUpdateErrors.push(`Failed to update inventory for ${item.title}`)
            continue
          }

          if (product.track_inventory) {
            const newQuantity = Math.max(0, product.inventory_quantity - item.quantity)
            
            const { error: updateError } = await supabase
              .from('products')
              .update({ inventory_quantity: newQuantity })
              .eq('id', item.product_id)

            if (updateError) {
              console.error(`❌ Failed to update inventory for product ${item.product_id}:`, updateError)
              inventoryUpdateErrors.push(`Failed to update inventory for ${item.title}`)
            } else {
              console.log(`✅ Updated inventory for product ${item.product_id}: ${product.inventory_quantity} → ${newQuantity}`)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Unexpected error updating inventory for item:`, item, error)
        inventoryUpdateErrors.push(`Unexpected error updating inventory for ${item.title}`)
      }
    }

    if (inventoryUpdateErrors.length > 0) {
      console.warn('⚠️ Orders API - Some inventory updates failed:', inventoryUpdateErrors)
      // Note: We don't fail the order here since it's already created
      // This could be handled by a background job or manual intervention
    }

    console.log('✅ Orders API - Inventory reduction completed')

    // Clear cart after successful order
    if (user) {
      await supabase.from('carts').delete().eq('user_id', user.id)
    } else if (sessionId) {
      await supabase.from('carts').delete().eq('session_id', sessionId)
    }

    // TODO: Send confirmation email
    // TODO: Initialize payment with Paystack

    console.log('🎉 Orders API - Order process completed successfully, returning order:', order.order_number)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('💥 Orders API - Unexpected error:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
} 