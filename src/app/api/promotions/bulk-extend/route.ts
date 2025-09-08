import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { 
      promotion_ids, 
      days, 
      hours, 
      new_date,
      filters // Alternative: extend by filters instead of specific IDs
    } = await request.json()

    if (!days && !hours && !new_date) {
      return NextResponse.json({ 
        error: 'Must provide either days, hours, or new_date to extend promotions' 
      }, { status: 400 })
    }

    console.log('📅 Promotions API - Bulk extending promotions...')

    let promotionsToUpdate = []

    if (promotion_ids && promotion_ids.length > 0) {
      // Extend specific promotions by IDs
      const { data: promotions, error: fetchError } = await supabase
        .from('promotions')
        .select('id, code, valid_until')
        .in('id', promotion_ids)

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
      }

      promotionsToUpdate = promotions || []
    } else if (filters) {
      // Extend promotions by filters
      let query = supabase
        .from('promotions')
        .select('id, code, valid_until')

      // Apply filters
      if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id)
      }
      if (filters.status === 'active') {
        const now = new Date().toISOString()
        query = query.eq('is_active', true).lte('valid_from', now).gte('valid_until', now)
      } else if (filters.status === 'expiring') {
        const now = new Date()
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.eq('is_active', true).lte('valid_until', sevenDaysFromNow).gte('valid_until', now.toISOString())
      }
      if (filters.search) {
        query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data: promotions, error: fetchError } = await query

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch promotions by filters' }, { status: 500 })
      }

      promotionsToUpdate = promotions || []
    } else {
      return NextResponse.json({ 
        error: 'Must provide either promotion_ids or filters' 
      }, { status: 400 })
    }

    if (promotionsToUpdate.length === 0) {
      return NextResponse.json({ 
        message: 'No promotions found to extend',
        extended_count: 0
      })
    }

    const updates = []
    const results = []

    for (const promotion of promotionsToUpdate) {
      let newValidUntil: string

      if (new_date) {
        // Use specific new date for all
        const newDate = new Date(new_date)
        if (newDate <= new Date()) {
          results.push({
            id: promotion.id,
            code: promotion.code,
            success: false,
            error: 'New expiration date must be in the future'
          })
          continue
        }
        newValidUntil = newDate.toISOString()
      } else {
        // Extend by days/hours from current expiration
        const currentExpiry = new Date(promotion.valid_until)
        const extensionMs = (days || 0) * 24 * 60 * 60 * 1000 + (hours || 0) * 60 * 60 * 1000
        newValidUntil = new Date(currentExpiry.getTime() + extensionMs).toISOString()
      }

      updates.push({
        id: promotion.id,
        valid_until: newValidUntil,
        updated_at: new Date().toISOString()
      })

      results.push({
        id: promotion.id,
        code: promotion.code,
        success: true,
        old_expiry: promotion.valid_until,
        new_expiry: newValidUntil
      })
    }

    // Perform bulk update
    const updatePromises = updates.map(update => 
      supabase
        .from('promotions')
        .update({
          valid_until: update.valid_until,
          updated_at: update.updated_at
        })
        .eq('id', update.id)
    )

    const updateResults = await Promise.allSettled(updatePromises)
    
    // Check for any failures
    let successCount = 0
    let failureCount = 0

    updateResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successCount++
      } else {
        failureCount++
        results[index].success = false
        results[index].error = result.status === 'rejected' 
          ? result.reason?.message 
          : result.value.error?.message
      }
    })

    const extensionDescription = new_date 
      ? `until ${new Date(new_date).toLocaleDateString()}`
      : `by ${days || 0} days${hours ? ` and ${hours} hours` : ''}`

    console.log(`✅ Promotions API - Bulk extend completed: ${successCount} success, ${failureCount} failures`)
    
    return NextResponse.json({
      message: `Bulk extend completed: ${successCount} promotions extended ${extensionDescription}`,
      extended_count: successCount,
      failed_count: failureCount,
      results: results,
      extension_description: extensionDescription
    })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 