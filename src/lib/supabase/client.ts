import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return singleton instance to prevent multiple connections
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.warn('Supabase client called in server environment')
    return null as any
  }
  
  // Check if Supabase environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured. Returning null client.')
    return null as any
  }
  
  try {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null as any
  }
  
  return supabaseInstance
}

export const supabase = createClient() 