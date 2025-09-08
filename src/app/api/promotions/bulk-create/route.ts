import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { 
      template, 
      brands, 
      count_per_brand, 
      code_prefix, 
      code_suffix,
      auto_generate_codes 
    } = await request.json()

    if (!template || (!brands || brands.length === 0)) {
      return NextResponse.json({ 
        error: 'Template and brands array are required' 
      }, { status: 400 })
    }

    console.log('🚀 Promotions API - Bulk creating promotions...')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get all brands if "all" is specified
    let targetBrands = brands
    if (brands.includes('all')) {
      const { data: allBrands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)

      if (brandsError) {
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
      }
      targetBrands = allBrands?.map(b => b.id) || []
    }

    const promotionsToCreate = []
    const createdPromotions = []
    const errors = []

    // Generate promotions for each brand
    for (const brandId of targetBrands) {
      const count = count_per_brand || 1

      for (let i = 1; i <= count; i++) {
        let promotionCode: string

        if (auto_generate_codes) {
          // Auto-generate unique codes
          const timestamp = Date.now()
          const random = Math.random().toString(36).substring(2, 8).toUpperCase()
          promotionCode = `${code_prefix || 'PROMO'}_${random}_${timestamp.toString().slice(-4)}`
        } else {
          // Use provided template or generate with suffix
          const baseSuffix = code_suffix || (count > 1 ? `_${i}` : '')
          promotionCode = `${template.code || 'PROMO'}${baseSuffix}`
        }

        // Check if code already exists
        const { data: existingPromo } = await supabase
          .from('promotions')
          .select('id')
          .eq('code', promotionCode)
          .single()

        if (existingPromo) {
          errors.push(`Code ${promotionCode} already exists`)
          continue
        }

        const now = new Date()
        const promotion = {
          brand_id: brandId,
          code: promotionCode,
          description: template.description || `Bulk created promotion ${promotionCode}`,
          discount_percent: Math.max(0, Math.min(100, template.discount_percent || 10)),
          valid_from: template.valid_from || now.toISOString(),
          valid_until: template.valid_until || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: template.is_active !== false,
          usage_limit: template.usage_limit || 100,
          times_used: 0,
          created_by: user?.id,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }

        promotionsToCreate.push(promotion)
      }
    }

    if (promotionsToCreate.length === 0) {
      return NextResponse.json({ 
        error: 'No valid promotions to create',
        errors 
      }, { status: 400 })
    }

    // Bulk insert promotions
    const { data, error } = await supabase
      .from('promotions')
      .insert(promotionsToCreate)
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

    if (error) {
      console.error('❌ Promotions API - Error bulk creating promotions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Promotions API - ${data?.length || 0} promotions created successfully`)
    return NextResponse.json({ 
      promotions: data,
      created_count: data?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${data?.length || 0} promotions${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 