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

    // Try to get the user's profile, but don't fail if it doesn't exist yet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create one for the user instead of logging them out
    if (profileError && profileError.code === 'PGRST116') {
      logger.log('Profile not found, creating one for user:', user.email)
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            role: 'customer'
          })
          .select()
          .single()

        if (createError) {
          logger.error('Error creating profile:', createError)
          // Don't fail if we can't create profile - user can still be authenticated
          const result = { isValid: true, user, profile: null, error: null, errorType: null }
          validationCache = { timestamp: Date.now(), result }
          return result
        }

        const result = { isValid: true, user, profile: newProfile, error: null, errorType: null }
        validationCache = { timestamp: Date.now(), result }
        return result
      } catch (error) {
        logger.error('Error creating user profile:', error)
        // Still allow authentication even if profile creation fails
        const result = { isValid: true, user, profile: null, error: null, errorType: null }
        validationCache = { timestamp: Date.now(), result }
        return result
      }
    } else if (profileError) {
      logger.error('Profile query error:', profileError)
      // Don't fail authentication for database errors
      const result = { isValid: true, user, profile: null, error: null, errorType: null }
      validationCache = { timestamp: Date.now(), result }
      return result
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