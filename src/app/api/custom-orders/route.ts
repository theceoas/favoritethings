import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch custom orders (admin only)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    let query = supabase
      .from('custom_orders')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: customOrders, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      orders: customOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching custom orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new custom order
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const formData = await request.formData()
    
    // Extract form fields
    const customer_name = formData.get('customer_name') as string
    const customer_email = formData.get('customer_email') as string
    const customer_phone = formData.get('customer_phone') as string
    const product_type = formData.get('product_type') as string
    const description = formData.get('description') as string
    const budget_range = formData.get('budget_range') as string
    const timeline = formData.get('timeline') as string
    const special_requirements = formData.get('special_requirements') as string
    
    // Handle image uploads
    const referenceImages: string[] = []
    const files = formData.getAll('reference_images') as File[]
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file && file.size > 0) {
          try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `custom-orders/${fileName}`

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('custom-orders')
              .upload(filePath, file, {
                contentType: file.type,
                upsert: false
              })

            if (uploadError) {
              console.error('Upload error:', uploadError)
              continue // Skip this file but continue with others
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('custom-orders')
              .getPublicUrl(filePath)

            if (urlData?.publicUrl) {
              referenceImages.push(urlData.publicUrl)
            }
          } catch (fileError) {
            console.error('Error processing file:', fileError)
            continue
          }
        }
      }
    }

    // Generate order number
    const orderNumber = `CUSTOM-${Date.now()}`

    // Insert custom order into database
    const { data: customOrder, error } = await supabase
      .from('custom_orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone,
        product_type,
        description,
        budget_range,
        timeline,
        special_requirements,
        reference_images: referenceImages,
        status: 'pending',
        ai_analysis: null // Will be filled by AI agent later
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order: customOrder,
      message: 'Custom order request submitted successfully!'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating custom order:', error)
    return NextResponse.json({ 
      error: 'Failed to submit custom order request' 
    }, { status: 500 })
  }
}

// PATCH - Update custom order (admin only)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const updates = await request.json()
    
    const { data: updatedOrder, error } = await supabase
      .from('custom_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Custom order updated successfully!'
    })

  } catch (error) {
    console.error('Error updating custom order:', error)
    return NextResponse.json({ 
      error: 'Failed to update custom order' 
    }, { status: 500 })
  }
}

// Allow CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 