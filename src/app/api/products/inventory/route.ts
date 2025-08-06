import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { product_ids } = await request.json()

    if (!product_ids || !Array.isArray(product_ids)) {
      return NextResponse.json({ error: 'Invalid product_ids' }, { status: 400 })
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('id, inventory_quantity')
      .in('id', product_ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to object with product_id as key
    const inventoryData = products.reduce((acc, product) => {
      acc[product.id] = product.inventory_quantity
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(inventoryData)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
} 