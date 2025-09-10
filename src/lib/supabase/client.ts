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
    // Don't return null, create a client anyway for SSR compatibility
  }
  
  // Check if Supabase environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured. Returning null client.')
    return null as any
  }
  
  try {
    // Safari-compatible storage adapter
    const safariCompatibleStorage = {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.warn('localStorage not available, using memory storage')
          return (window as any).__supabaseStorage?.[key] || null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.warn('localStorage not available, using memory storage')
          if (!(window as any).__supabaseStorage) {
            (window as any).__supabaseStorage = {}
          }
          (window as any).__supabaseStorage[key] = value
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          if ((window as any).__supabaseStorage) {
            delete (window as any).__supabaseStorage[key]
          }
        }
      }
    }

    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? safariCompatibleStorage : undefined
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