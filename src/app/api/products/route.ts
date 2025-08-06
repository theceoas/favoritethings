import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        slug,
        price,
        compare_at_price,
        featured_image,
        short_description,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({
      products: products || [],
      total: products?.length || 0
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      products: [],
      total: 0
    }, { status: 500 })
  }
}

// Allow CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
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
    const productData = await request.json()
    
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
} 