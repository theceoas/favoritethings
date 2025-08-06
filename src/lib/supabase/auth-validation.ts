import { supabase } from './client'
import { logger } from '../utils/logger'

// Cache validation results to prevent excessive API calls
let validationCache: {
  timestamp: number;
  result: any;
} | null = null

const CACHE_DURATION = 30000 // 30 seconds

export async function validateUserSession() {
  try {
    // Return cached result if still valid
    if (validationCache && Date.now() - validationCache.timestamp < CACHE_DURATION) {
      return validationCache.result
    }

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      const result = { isValid: false, user: null, profile: null, error: 'No session found', errorType: 'NO_SESSION' }
      validationCache = { timestamp: Date.now(), result }
      return result
    }

    // Verify the user still exists in the database by making an authenticated request
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      // If we get an error, the user might have been deleted from auth
      logger.log('User auth error:', userError.message)
      await supabase.auth.signOut()
      const result = { isValid: false, user: null, profile: null, error: userError.message, errorType: 'AUTH_ERROR' }
      validationCache = { timestamp: Date.now(), result }
      return result
    }

    if (!user) {
      // No user found, clear session
      await supabase.auth.signOut()
      const result = { isValid: false, user: null, profile: null, error: 'User not found in auth', errorType: 'USER_NOT_FOUND' }
      validationCache = { timestamp: Date.now(), result }
      return result
    }

    // Additional check: try to access the user's profile to ensure they exist in our system
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist - user was deleted from our system
        logger.log('User profile not found - user was deleted from system')
        await supabase.auth.signOut()
        const result = { isValid: false, user: null, profile: null, error: 'User profile not found', errorType: 'PROFILE_DELETED' }
        validationCache = { timestamp: Date.now(), result }
        return result
      } else {
        // Other database error
        logger.error('Profile query error:', profileError)
        const result = { isValid: false, user: null, profile: null, error: profileError.message, errorType: 'DATABASE_ERROR' }
        validationCache = { timestamp: Date.now(), result }
        return result
      }
    }

    const result = { isValid: true, user, profile, error: null, errorType: null }
    validationCache = { timestamp: Date.now(), result }
    return result
  } catch (error) {
    logger.error('Error validating user session:', error)
    // On any error, clear the session to be safe
    await supabase.auth.signOut()
    const result = { isValid: false, user: null, profile: null, error: 'Validation failed', errorType: 'UNKNOWN_ERROR' }
    validationCache = { timestamp: Date.now(), result }
    return result
  }
}

// Clear cache when auth state changes
export function clearValidationCache() {
  validationCache = null
}

export async function ensureValidSession() {
  const validation = await validateUserSession()
  
  if (!validation.isValid) {
    // Force sign out and redirect if needed
    await supabase.auth.signOut()
    clearValidationCache()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
    return null
  }
  
  return validation.user
} 