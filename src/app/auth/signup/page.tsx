'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // Sign up with metadata so the trigger can use it
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if email verification is disabled (user is auto-confirmed)
        if (data.user.email_confirmed_at || data.session) {
          // Email verification is disabled - user is auto-confirmed and logged in
          setMessage('Account created successfully! Redirecting to your account...')
          // Redirect immediately since user is logged in
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          // Email verification is still enabled
          setMessage('Account created successfully! Please check your email to verify your account, then you can sign in.')
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#fffbe6] to-[#fff] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FFD84D] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#6A41A1] rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-[#6A41A1] rounded-3xl shadow-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
                      <h1 className="text-3xl font-bold text-[#6A41A1] mb-2">Join Favorite Things</h1>
          <p className="text-[#4F4032]/80">Create your account and start shopping for luxury bedding</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {message}
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#4F4032] mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#4F4032] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#4F4032] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="Create a secure password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6A41A1] text-white py-4 px-6 rounded-2xl font-medium hover:bg-[#FFD84D] hover:text-[#6A41A1] transition-all duration-300 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center space-y-4">
              <p className="text-[#4F4032]/80">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-[#6A41A1] hover:text-[#FFD84D] transition-colors duration-300"
                >
                  Sign in here
                </Link>
              </p>
              <Link
                href="/"
                className="inline-flex items-center text-sm text-[#4F4032]/60 hover:text-[#6A41A1] transition-colors duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to store
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 