import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Query parameters
  const days = parseInt(searchParams.get('days') || '7') // Default 7 days
  const brand_id = searchParams.get('brand_id') || ''
  const include_expired = searchParams.get('include_expired') === 'true'

  try {
    console.log(`🔍 Promotions API - Fetching promotions expiring within ${days} days...`)
    
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

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
      .eq('is_active', true)

    if (include_expired) {
      // Include already expired promotions
      query = query.lte('valid_until', futureDate.toISOString())
    } else {
      // Only include promotions that will expire in the future
      query = query
        .gte('valid_until', now.toISOString())
        .lte('valid_until', futureDate.toISOString())
    }

    // Apply brand filter if specified
    if (brand_id && brand_id !== 'all') {
      query = query.eq('brand_id', brand_id)
    }

    // Order by expiration date (soonest first)
    query = query.order('valid_until', { ascending: true })

    const { data: promotions, error } = await query

    if (error) {
      console.error('❌ Promotions API - Error fetching expiring promotions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process promotions with computed fields
    const processedPromotions = promotions?.map((promo: any) => {
      const validUntil = new Date(promo.valid_until)
      const days_until_expiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const hours_until_expiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60))
      
      let urgency_level = 'low'
      if (days_until_expiry < 0) {
        urgency_level = 'expired'
      } else if (days_until_expiry <= 1) {
        urgency_level = 'critical'
      } else if (days_until_expiry <= 3) {
        urgency_level = 'high'
      } else if (days_until_expiry <= 7) {
        urgency_level = 'medium'
      }

      const usage_percentage = promo.usage_limit > 0 ? 
        Math.round((promo.times_used / promo.usage_limit) * 100) : 0

      return {
        ...promo,
        days_until_expiry,
        hours_until_expiry,
        urgency_level,
        usage_percentage,
        is_expired: days_until_expiry < 0,
        is_fully_used: promo.usage_limit > 0 && promo.times_used >= promo.usage_limit,
        expiry_formatted: validUntil.toLocaleDateString(),
        expiry_time_formatted: validUntil.toLocaleString()
      }
    }) || []

    // Group by urgency for easier processing
    const groupedByUrgency = {
      expired: processedPromotions.filter(p => p.urgency_level === 'expired'),
      critical: processedPromotions.filter(p => p.urgency_level === 'critical'),
      high: processedPromotions.filter(p => p.urgency_level === 'high'),
      medium: processedPromotions.filter(p => p.urgency_level === 'medium'),
      low: processedPromotions.filter(p => p.urgency_level === 'low')
    }

    const summary = {
      total_count: processedPromotions.length,
      expired_count: groupedByUrgency.expired.length,
      critical_count: groupedByUrgency.critical.length,
      high_count: groupedByUrgency.high.length,
      medium_count: groupedByUrgency.medium.length,
      low_count: groupedByUrgency.low.length,
      days_range: days,
      include_expired
    }

    console.log(`✅ Promotions API - Found ${processedPromotions.length} expiring promotions`)

    return NextResponse.json({
      promotions: processedPromotions,
      grouped_by_urgency: groupedByUrgency,
      summary,
      filters: {
        days,
        brand_id,
        include_expired
      }
    })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 