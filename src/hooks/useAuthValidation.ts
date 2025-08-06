'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { validateUserSession } from '@/lib/supabase/auth-validation'
import { supabase } from '@/lib/supabase/client'

interface UseAuthValidationResult {
  user: User | null
  profile: any | null
  loading: boolean
  isValid: boolean
}

export function useAuthValidation(redirectTo?: string): UseAuthValidationResult {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const validateAndSetUser = async () => {
      try {
        const validation = await validateUserSession()
        
        if (!mounted) return

        if (!validation.isValid) {
          setUser(null)
          setProfile(null)
          setIsValid(false)
          if (redirectTo) {
            router.push(redirectTo)
          }
        } else {
          setUser(validation.user)
          setProfile(validation.profile)
          setIsValid(true)
        }
      } catch (error) {
        console.error('Auth validation error:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setIsValid(false)
          if (redirectTo) {
            router.push(redirectTo)
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initial validation
    validateAndSetUser()

    // Listen for auth changes and validate
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsValid(false)
        setLoading(false)
        if (redirectTo) {
          router.push(redirectTo)
        }
      } else if (session?.user) {
        // Re-validate when user signs in
        validateAndSetUser()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove router and redirectTo from dependencies to prevent infinite loops

  return { user, profile, loading, isValid }
}

export function useRequireAuth(redirectTo: string = '/auth/login') {
  return useAuthValidation(redirectTo)
} 