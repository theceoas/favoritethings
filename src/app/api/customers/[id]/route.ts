import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const customerId = params.id

  try {
    console.log('🔍 Customers API - Fetching customer:', customerId)
    
    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .eq('role', 'customer')
      .single()

    if (customerError) {
      console.error('❌ Customers API - Error fetching customer:', customerError)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Fetch customer's orders
    let orders: any[] = []
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              title,
              featured_image,
              price
            )
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })

      if (!ordersError) {
        orders = ordersData || []
        console.log('✅ Customers API - Customer orders fetched:', orders.length)
      }
    } catch (ordersTableError) {
      console.warn('⚠️ Customers API - Orders table not accessible')
    }

    // Fetch customer's addresses
    let addresses: any[] = []
    try {
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', customerId)

      if (!addressesError) {
        addresses = addressesData || []
        console.log('✅ Customers API - Customer addresses fetched:', addresses.length)
      }
    } catch (addressesTableError) {
      console.warn('⚠️ Customers API - Addresses table not accessible')
    }

    // Calculate customer stats
    const totalSpent = orders.reduce((sum, order) => {
      let orderTotal = 0
      if (typeof order.total === 'string') {
        orderTotal = parseFloat(order.total) || 0
      } else if (typeof order.total === 'number') {
        orderTotal = order.total
      }
      
      // Convert from kobo to naira if needed
      if (orderTotal > 1000000) {
        orderTotal = orderTotal / 100
      }
      
      return sum + orderTotal
    }, 0)

    const totalOrders = orders.length
    const lastOrder = orders[0] // Already sorted by created_at desc
    const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null
    const daysSinceRegistration = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))

    // Determine customer segment
    let segment: 'vip' | 'new' | 'inactive' | 'regular' = 'regular'
    if (totalSpent > 50000) {
      segment = 'vip'
    } else if (daysSinceRegistration <= 30) {
      segment = 'new'
    } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
      segment = 'inactive'
    }

    // Get primary phone from addresses if not in profile
    const primaryPhone = customer.phone || addresses.find(addr => addr.phone)?.phone || null

    const customerWithDetails = {
      id: customer.id,
      email: customer.email,
      full_name: customer.full_name || customer.name,
      avatar_url: customer.avatar_url,
      role: customer.role,
      phone: primaryPhone,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      email_verified: customer.email_verified,
      is_active: customer.is_active !== false,
      marketing_consent: customer.marketing_consent,
      last_login: customer.last_login,
      // Computed fields
      total_orders: totalOrders,
      total_spent: totalSpent,
      last_order_date: lastOrder?.created_at,
      customer_segment: segment,
      days_since_registration: daysSinceRegistration,
      days_since_last_order: daysSinceLastOrder,
      // Detailed data
      orders: orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          product_title: item.products?.title,
          product_image: item.products?.featured_image,
          quantity: item.quantity,
          price: item.price
        })) || []
      })),
      addresses: addresses.map(addr => ({
        id: addr.id,
        type: addr.type,
        first_name: addr.first_name,
        last_name: addr.last_name,
        phone: addr.phone,
        address_line_1: addr.address_line_1,
        address_line_2: addr.address_line_2,
        city: addr.city,
        state: addr.state,
        postal_code: addr.postal_code,
        country: addr.country,
        is_default: addr.is_default
      }))
    }

    console.log('✅ Customers API - Customer details fetched successfully')
    return NextResponse.json({ customer: customerWithDetails })

  } catch (error) {
    console.error('❌ Customers API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const customerId = params.id

  try {
    const updateData = await request.json()
    
    // Remove fields that shouldn't be updated
    const { id, created_at, role, ...safeUpdateData } = updateData
    
    // Add updated_at timestamp
    const dataToUpdate = {
      ...safeUpdateData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', customerId)
      .eq('role', 'customer')
      .select()
      .single()

    if (error) {
      console.error('❌ Customers API - Error updating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Customers API - Customer updated:', customerId)
    return NextResponse.json({ customer: data })

  } catch (error) {
    console.error('❌ Customers API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const customerId = params.id

  try {
    // Soft delete by setting is_active to false instead of actually deleting
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .eq('role', 'customer')

    if (error) {
      console.error('❌ Customers API - Error deactivating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Customers API - Customer deactivated:', customerId)
    return NextResponse.json({ message: 'Customer deactivated successfully' })

  } catch (error) {
    console.error('❌ Customers API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 