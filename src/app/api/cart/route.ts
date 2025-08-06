import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const sessionId = searchParams.get('sessionId')
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('carts').select('*')

  if (user) {
    query = query.eq('user_id', user.id)
  } else if (sessionId) {
    query = query.eq('session_id', sessionId)
  } else {
    return NextResponse.json({ error: 'Session ID required for guest users' }, { status: 400 })
  }

  const { data: cart, error } = await query.single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(cart || { items: [], total: 0 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { productId, variantId, quantity, sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!productId || !quantity) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 })
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, price, featured_image, sku')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get variant details if specified
    let variant = null
    if (variantId) {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, title, price, sku')
        .eq('id', variantId)
        .single()

      if (variantError) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
      }
      variant = variantData
    }

    // Find existing cart
    let cartQuery = supabase.from('carts').select('*')
    
    if (user) {
      cartQuery = cartQuery.eq('user_id', user.id)
    } else {
      cartQuery = cartQuery.eq('session_id', sessionId)
    }

    const { data: existingCart } = await cartQuery.single()

    const cartItem = {
      id: uuidv4(),
      product_id: productId,
      product_variant_id: variantId,
      title: product.title,
      variant_title: variant?.title,
      sku: variant?.sku || product.sku,
      price: variant?.price || product.price,
      quantity,
      image_url: product.featured_image
    }

    let updatedItems = []
    
    if (existingCart) {
      updatedItems = [...(existingCart.items || [])]
      const existingItemIndex = updatedItems.findIndex(
        item => item.product_id === productId && item.product_variant_id === variantId
      )

      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex].quantity += quantity
      } else {
        updatedItems.push(cartItem)
      }
    } else {
      updatedItems = [cartItem]
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = subtotal * 0.075 // 7.5% VAT
    const total = subtotal + taxAmount

    const cartData = {
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
      items: updatedItems,
      subtotal,
      tax_amount: taxAmount,
      total
    }

    if (existingCart) {
      const { data: updatedCart, error } = await supabase
        .from('carts')
        .update(cartData)
        .eq('id', existingCart.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(updatedCart)
    } else {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert(cartData)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(newCart)
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const itemId = searchParams.get('itemId')
  const sessionId = searchParams.get('sessionId')
  const { data: { user } } = await supabase.auth.getUser()

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
  }

  // Find cart
  let cartQuery = supabase.from('carts').select('*')
  
  if (user) {
    cartQuery = cartQuery.eq('user_id', user.id)
  } else if (sessionId) {
    cartQuery = cartQuery.eq('session_id', sessionId)
  } else {
    return NextResponse.json({ error: 'Session ID required for guest users' }, { status: 400 })
  }

  const { data: cart } = await cartQuery.single()

  if (!cart) {
    return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
  }

  const updatedItems = (cart.items || []).filter((item: any) => item.id !== itemId)
  
  const subtotal = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const taxAmount = subtotal * 0.075
  const total = subtotal + taxAmount

  const { data: updatedCart, error } = await supabase
    .from('carts')
    .update({
      items: updatedItems,
      subtotal,
      tax_amount: taxAmount,
      total
    })
    .eq('id', cart.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updatedCart)
} 