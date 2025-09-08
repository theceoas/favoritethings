import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Query parameters
  const date_from = searchParams.get('date_from') || ''
  const date_to = searchParams.get('date_to') || ''
  const brand_id = searchParams.get('brand_id') || ''

  try {
    console.log('📊 Promotions API - Generating analytics...')

    // Build base query
    let query = supabase
      .from('promotions')
      .select(`
        *,
        brands (
          id,
          name,
          slug
        )
      `)

    // Apply date filters
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to)
    }
    if (brand_id && brand_id !== 'all') {
      query = query.eq('brand_id', brand_id)
    }

    const { data: promotions, error } = await query

    if (error) {
      console.error('❌ Promotions API - Error fetching promotions for analytics:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    
    // Basic counts
    const totalPromotions = promotions?.length || 0
    const activePromotions = promotions?.filter(p => {
      const validFrom = new Date(p.valid_from)
      const validUntil = new Date(p.valid_until)
      return p.is_active && now >= validFrom && now <= validUntil
    }).length || 0
    
    const expiredPromotions = promotions?.filter(p => {
      const validUntil = new Date(p.valid_until)
      return now > validUntil
    }).length || 0

    const scheduledPromotions = promotions?.filter(p => {
      const validFrom = new Date(p.valid_from)
      return p.is_active && now < validFrom
    }).length || 0

    const inactivePromotions = promotions?.filter(p => !p.is_active).length || 0

    // Usage statistics
    const totalUsage = promotions?.reduce((sum, p) => sum + p.times_used, 0) || 0
    const averageUsage = totalPromotions > 0 ? Math.round(totalUsage / totalPromotions) : 0
    
    const fullyUsedPromotions = promotions?.filter(p => 
      p.usage_limit > 0 && p.times_used >= p.usage_limit
    ).length || 0

    const unusedPromotions = promotions?.filter(p => p.times_used === 0).length || 0

    // Discount statistics
    const discountValues = promotions?.map(p => p.discount_percent) || []
    const averageDiscount = discountValues.length > 0 
      ? Math.round(discountValues.reduce((sum, d) => sum + d, 0) / discountValues.length) 
      : 0
    const maxDiscount = Math.max(...discountValues, 0)
    const minDiscount = discountValues.length > 0 ? Math.min(...discountValues) : 0

    // Top performing promotions
    const topByUsage = [...(promotions || [])]
      .sort((a, b) => b.times_used - a.times_used)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        code: p.code,
        description: p.description,
        times_used: p.times_used,
        discount_percent: p.discount_percent,
        brand_name: p.brands?.name
      }))

    // Brand breakdown
    const brandStats = promotions?.reduce((acc: any, p) => {
      const brandName = p.brands?.name || 'Unknown'
      if (!acc[brandName]) {
        acc[brandName] = {
          total: 0,
          active: 0,
          expired: 0,
          total_usage: 0
        }
      }
      
      acc[brandName].total++
      acc[brandName].total_usage += p.times_used
      
      const validFrom = new Date(p.valid_from)
      const validUntil = new Date(p.valid_until)
      
      if (p.is_active && now >= validFrom && now <= validUntil) {
        acc[brandName].active++
      } else if (now > validUntil) {
        acc[brandName].expired++
      }
      
      return acc
    }, {}) || {}

    // Time-based analysis (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentPromotions = promotions?.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length || 0

    // Expiring soon analysis
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expiringSoon = promotions?.filter(p => {
      const validUntil = new Date(p.valid_until)
      return p.is_active && validUntil >= now && validUntil <= sevenDaysFromNow
    }).length || 0

    // Success rate calculation
    const promotionsWithLimits = promotions?.filter(p => p.usage_limit > 0) || []
    const successfulPromotions = promotionsWithLimits.filter(p => p.times_used > 0).length
    const successRate = promotionsWithLimits.length > 0 
      ? Math.round((successfulPromotions / promotionsWithLimits.length) * 100) 
      : 0

    const analytics = {
      overview: {
        total_promotions: totalPromotions,
        active_promotions: activePromotions,
        expired_promotions: expiredPromotions,
        scheduled_promotions: scheduledPromotions,
        inactive_promotions: inactivePromotions,
        expiring_soon: expiringSoon
      },
      usage_stats: {
        total_usage: totalUsage,
        average_usage: averageUsage,
        fully_used_promotions: fullyUsedPromotions,
        unused_promotions: unusedPromotions,
        success_rate: successRate
      },
      discount_stats: {
        average_discount: averageDiscount,
        max_discount: maxDiscount,
        min_discount: minDiscount
      },
      top_performers: topByUsage,
      brand_breakdown: brandStats,
      recent_activity: {
        created_last_30_days: recentPromotions
      },
      filters_applied: {
        date_from,
        date_to,
        brand_id
      },
      generated_at: now.toISOString()
    }

    console.log(`✅ Promotions API - Analytics generated for ${totalPromotions} promotions`)

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 