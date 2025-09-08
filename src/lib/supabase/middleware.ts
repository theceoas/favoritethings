import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  // If there's an auth error (like invalid JWT), clear the session
  if (userError) {
    console.log('Auth error in middleware, clearing session:', userError.message)
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    return response
  }

  // For admin routes, check if user exists and has proper role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Check if we have role info in the user metadata to avoid DB call
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    
    // Only make DB call if role is not in metadata or if it's the main admin page
    if (!userRole || request.nextUrl.pathname === '/admin') {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile || profile.role !== 'admin') {
          // User doesn't exist in profiles or isn't admin, sign them out
          const response = NextResponse.redirect(new URL('/auth/login', request.url))
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
          return response
        }
      } catch (error) {
        console.error('Error validating admin user:', error)
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }
    } else if (userRole !== 'admin') {
      // Role in metadata but not admin
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }
  }

  // For protected routes (like account), validate user exists - but only on first visit
  const protectedRoutes = ['/account', '/checkout', '/orders']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Only check profile on first visit to protected routes, not on every request
  const shouldCheckProfile = isProtectedRoute && user && !request.cookies.get('profile-checked')
  
  if (shouldCheckProfile) {
    try {
      // Check if user profile exists, but don't fail if it doesn't
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - try to create one
        console.log('Profile not found for user, attempting to create:', user.email)
        try {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              role: 'customer'
            })
          console.log('Profile created successfully for user:', user.email)
        } catch (createError) {
          console.error('Error creating profile:', createError)
          // Continue anyway - don't block the user
        }
      }
      
      // Set a cookie to indicate profile has been checked for this session
      supabaseResponse.cookies.set('profile-checked', 'true', {
        maxAge: 60 * 60, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      })
    } catch (error) {
      console.error('Error validating user profile:', error)
      // Don't block user access on profile errors
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the response object you return at the end.
  return supabaseResponse
} 