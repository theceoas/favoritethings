import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const sessionId = request.headers.get('x-session-id')

    if (!user && !sessionId) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // Get or create cart
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', {
        p_user_id: user?.id || null,
        p_session_id: sessionId
      })

    if (cartError) {
      console.error('Error getting cart:', cartError)
      return NextResponse.json({ items: [], total: 0 })
    }

    // Get cart details
    const { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json({ items: [], total: 0 })
    }

    return NextResponse.json(cart || { items: [], total: 0 })
  } catch (error) {
    console.error('Error in cart GET:', error)
    return NextResponse.json({ items: [], total: 0 })
  }
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

    // Get or create cart
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', {
        p_user_id: user?.id || null,
        p_session_id: sessionId
      })

    if (cartError) {
      return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 })
    }

    // Get current cart
    const { data: existingCart, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

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
    
    if (existingCart && existingCart.items) {
      updatedItems = [...existingCart.items]
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
      total,
      last_accessed_at: new Date().toISOString()
    }

    const { data: updatedCart, error } = await supabase
      .from('carts')
      .update(cartData)
      .eq('id', cartId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedCart)
  } catch (error) {
    console.error('Error in cart POST:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { itemId, sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Get or create cart
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', {
        p_user_id: user?.id || null,
        p_session_id: sessionId
      })

    if (cartError) {
      return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 })
    }

    // Get current cart
    const { data: existingCart, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    const updatedItems = (existingCart.items || []).filter(item => item.id !== itemId)
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxAmount = subtotal * 0.075 // 7.5% VAT
    const total = subtotal + taxAmount

    const { data: updatedCart, error } = await supabase
      .from('carts')
      .update({
        items: updatedItems,
        subtotal,
        tax_amount: taxAmount,
        total,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', cartId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedCart)
  } catch (error) {
    console.error('Error in cart DELETE:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
