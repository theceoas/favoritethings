import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const sessionId = request.headers.get('x-session-id')

    if (!user && !sessionId) {
      return NextResponse.json({ preferences: {} })
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('preference_key, preference_value')
      .or(`user_id.eq.${user?.id || ''},session_id.eq.${sessionId || ''}`)

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ preferences: {} })
    }

    const preferencesObj = preferences?.reduce((acc, pref) => {
      acc[pref.preference_key] = pref.preference_value
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({ preferences: preferencesObj })
  } catch (error) {
    console.error('Error in preferences GET:', error)
    return NextResponse.json({ preferences: {} })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { key, value, sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!key) {
      return NextResponse.json({ error: 'Preference key is required' }, { status: 400 })
    }

    const { data: preference, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        preference_key: key,
        preference_value: value
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Error in preferences POST:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { key, sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!key) {
      return NextResponse.json({ error: 'Preference key is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .or(`user_id.eq.${user?.id || ''},session_id.eq.${sessionId || ''}`)
      .eq('preference_key', key)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in preferences DELETE:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
