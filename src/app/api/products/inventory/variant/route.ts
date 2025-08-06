import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { variant_id } = await request.json()

    if (!variant_id) {
      return NextResponse.json({ error: 'variant_id is required' }, { status: 400 })
    }

    const { data: variant, error } = await supabase
      .from('product_variants')
      .select('inventory_quantity, is_active, track_inventory')
      .eq('id', variant_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json({
      inventory_quantity: variant.inventory_quantity,
      is_active: variant.is_active,
      track_inventory: variant.track_inventory
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
} 