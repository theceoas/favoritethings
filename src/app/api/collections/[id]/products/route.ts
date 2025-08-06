import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const collectionId = params.id

  try {
    const { data: productCollections, error } = await supabase
      .from('product_collections')
      .select(`
        products (
          id,
          title,
          slug,
          price,
          compare_at_price,
          featured_image,
          short_description,
          is_active,
          created_at
        )
      `)
      .eq('collection_id', collectionId)
      .eq('products.is_active', true)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Extract products from the nested structure
    const products = productCollections
      ?.map(pc => pc.products)
      .filter(Boolean) || []

    return NextResponse.json({
      products,
      total: products.length
    })

  } catch (error) {
    console.error('Error fetching collection products:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch collection products',
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