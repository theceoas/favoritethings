import { supabase } from './client'

/**
 * Completely clear all authentication data from the browser
 * Use this when you want to ensure a clean logout
 */
export async function clearAllAuthData() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear localStorage items related to auth
    if (typeof window !== 'undefined') {
      const authKeys = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase.auth.token',
        'supabase.auth.user'
      ]
      
      authKeys.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      // Clear any Supabase-related localStorage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear cookies (browser will handle this on next request)
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  } catch (error) {
    console.error('Error clearing auth data:', error)
  }
}

/**
 * Force refresh the current page after clearing auth
 */
export async function forceLogout() {
  await clearAllAuthData()
  
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login'
  }
}

/**
 * Check if user session is potentially stale
 */
export function isSessionStale() {
  if (typeof window === 'undefined') return false
  
  const accessToken = localStorage.getItem('sb-access-token')
  if (!accessToken) return false
  
  try {
    // Decode JWT to check expiration (basic check)
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    // If token expires in less than 5 minutes, consider it stale
    return payload.exp && (payload.exp - currentTime) < 300
  } catch {
    return true // If we can't decode, assume stale
  }
} 