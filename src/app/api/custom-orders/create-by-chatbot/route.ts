import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/custom-orders/create-by-chatbot
export async function POST(request: NextRequest) {
  // Use service role key to bypass RLS for this endpoint
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const customer_email = (body.email || '').toLowerCase().trim()
    const customer_name = body.name || ''
    const customer_phone = body.phone || ''
    const product_type = body.product_type || ''
    const description = body.description || ''
    const budget_range = body.budget_range || ''
    const timeline = body.timeline || ''
    const special_requirements = body.special_requirements || ''
    const ai_analysis = body.ai_analysis || null

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Generate unique order code (8 uppercase alphanumeric)
    let order_code = ''
    let isUnique = false
    for (let i = 0; i < 5 && !isUnique; i++) {
      order_code = Math.random().toString(36).substring(2, 10).toUpperCase()
      // Check uniqueness
      const { data: existing } = await supabase
        .from('custom_orders')
        .select('id')
        .eq('order_code', order_code)
        .maybeSingle()
      if (!existing) isUnique = true
    }
    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique order code' }, { status: 500 })
    }

    // Insert custom order
    const { data: customOrder, error } = await supabase
      .from('custom_orders')
      .insert({
        order_code,
        customer_email,
        customer_name,
        customer_phone,
        product_type,
        description,
        budget_range,
        timeline,
        special_requirements,
        ai_analysis,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return code and upload link
    return NextResponse.json({
      success: true,
      order_code: order_code,
      upload_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://favoritethings.ng'}/custom-order-upload`,
      message: 'Custom order created. Share the code and link with the customer.'
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 