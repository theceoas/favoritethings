import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Fetch all collections with full details
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        product_collections (
          product_id
        ),
        brands (
          id,
          name,
          slug
        )
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    return NextResponse.json({
      collections: collections || [],
      total: collections?.length || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 