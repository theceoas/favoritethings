import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Query parameters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const brand_id = searchParams.get('brand_id') || ''
  const status = searchParams.get('status') || '' // active, inactive, expired, scheduled
  const date_from = searchParams.get('date_from') || ''
  const date_to = searchParams.get('date_to') || ''
  const usage_min = searchParams.get('usage_min') || ''
  const usage_max = searchParams.get('usage_max') || ''
  const discount_min = searchParams.get('discount_min') || ''
  const discount_max = searchParams.get('discount_max') || ''
  const sort_by = searchParams.get('sort_by') || 'created_at'
  const sort_order = searchParams.get('sort_order') || 'desc'

  try {
    console.log('🔍 Promotions API - Fetching promotions...')
    
    // Build the base query
    let query = supabase
      .from('promotions')
      .select(`
        *,
        brands (
          id,
          name,
          slug,
          primary_color,
          secondary_color
        )
      `)

    // Apply search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply brand filter
    if (brand_id && brand_id !== 'all') {
      query = query.eq('brand_id', brand_id)
    }

    // Apply status filter
    const now = new Date().toISOString()
    if (status === 'active') {
      query = query.eq('is_active', true).lte('valid_from', now).gte('valid_until', now)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'expired') {
      query = query.lt('valid_until', now)
    } else if (status === 'scheduled') {
      query = query.eq('is_active', true).gt('valid_from', now)
    }

    // Apply date filters
    if (date_from) {
      query = query.gte('valid_from', date_from)
    }
    if (date_to) {
      query = query.lte('valid_until', date_to)
    }

    // Apply usage filters
    if (usage_min) {
      query = query.gte('times_used', parseInt(usage_min))
    }
    if (usage_max) {
      query = query.lte('times_used', parseInt(usage_max))
    }

    // Apply discount filters
    if (discount_min) {
      query = query.gte('discount_percent', parseInt(discount_min))
    }
    if (discount_max) {
      query = query.lte('discount_percent', parseInt(discount_max))
    }

    // Get total count for pagination
    const { count } = await query

    // Apply pagination and sorting
    query = query.range(offset, offset + limit - 1)
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    const { data: promotions, error } = await query

    if (error) {
      console.error('❌ Promotions API - Error fetching promotions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process promotions with computed fields
    const processedPromotions = promotions?.map((promo: any) => {
      const now = new Date()
      const validFrom = new Date(promo.valid_from)
      const validUntil = new Date(promo.valid_until)
      
      let computed_status = 'inactive'
      if (promo.is_active) {
        if (now < validFrom) {
          computed_status = 'scheduled'
        } else if (now > validUntil) {
          computed_status = 'expired'
        } else {
          computed_status = 'active'
        }
      }

      const usage_percentage = promo.usage_limit > 0 ? 
        Math.round((promo.times_used / promo.usage_limit) * 100) : 0

      const days_until_expiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...promo,
        computed_status,
        usage_percentage,
        days_until_expiry,
        is_expiring_soon: days_until_expiry <= 7 && days_until_expiry > 0,
        is_fully_used: promo.usage_limit > 0 && promo.times_used >= promo.usage_limit
      }
    }) || []

    console.log('✅ Promotions API - Processed promotions:', processedPromotions.length)

    return NextResponse.json({
      promotions: processedPromotions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        search,
        brand_id,
        status,
        date_from,
        date_to,
        usage_min,
        usage_max,
        discount_min,
        discount_max,
        sort_by,
        sort_order
      }
    })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const promotionData = await request.json()
    
    // Validate required fields
    if (!promotionData.code || !promotionData.description || !promotionData.brand_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: code, description, and brand_id are required' 
      }, { status: 400 })
    }

    // Check if promotion code already exists
    const { data: existingPromo } = await supabase
      .from('promotions')
      .select('id')
      .eq('code', promotionData.code)
      .single()

    if (existingPromo) {
      return NextResponse.json({ 
        error: 'Promotion code already exists. Please use a unique code.' 
      }, { status: 409 })
    }

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser()
    
    // Set default values and validate data
    const newPromotion = {
      ...promotionData,
      created_by: user?.id,
      times_used: 0,
      is_active: promotionData.is_active !== false, // Default to true
      usage_limit: promotionData.usage_limit || -1, // -1 means unlimited
      discount_percent: Math.max(0, Math.min(100, promotionData.discount_percent || 0)), // Clamp between 0-100
      valid_from: promotionData.valid_from || new Date().toISOString(),
      valid_until: promotionData.valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days
    }

    // Validate dates
    const validFrom = new Date(newPromotion.valid_from)
    const validUntil = new Date(newPromotion.valid_until)
    
    if (validUntil <= validFrom) {
      return NextResponse.json({ 
        error: 'Valid until date must be after valid from date' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert([newPromotion])
      .select(`
        *,
        brands (
          id,
          name,
          slug,
          primary_color,
          secondary_color
        )
      `)
      .single()

    if (error) {
      console.error('❌ Promotions API - Error creating promotion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Promotions API - Promotion created:', data.id)
    return NextResponse.json({ promotion: data }, { status: 201 })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 