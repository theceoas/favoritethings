import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Fetch all active collections with brand information
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
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    // Add product count and brand information to each collection
    const collectionsWithCounts = collections?.map(collection => {
      const productCount = collection.product_collections?.length || 0
      
      return {
        ...collection,
        product_count: productCount,
        brand_slug: collection.brands?.slug || 'kiowa',
        brand_name: collection.brands?.name || 'Kiowa'
      }
    }) || []

    return NextResponse.json({
      collections: collectionsWithCounts
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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