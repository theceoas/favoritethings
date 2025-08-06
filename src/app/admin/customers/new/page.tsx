'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface FormData {
  full_name: string
  email: string
  phone: string
  role: 'customer' | 'admin'
  is_active: boolean
  marketing_consent: boolean
  password: string
  confirmPassword: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer',
    is_active: true,
    marketing_consent: false,
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!formData.password) {
        throw new Error('Password is required')
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.trim())
        .single()

      if (existingUser) {
        throw new Error('A user with this email already exists')
      }

      // Create the user account using Supabase Admin API
      // Note: In production, this should be done server-side for security
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim()
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Create or update the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim() || null,
            role: formData.role,
            is_active: formData.is_active,
            marketing_consent: formData.marketing_consent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) throw profileError

        // Redirect to the customer detail page
        router.push(`/admin/customers/${data.user.id}`)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/customers"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-[#6A41A1]">Add New Customer</h1>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="w-5 h-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Creating Customer Account</h3>
            <p className="mt-1 text-sm text-blue-700">
              This will create a new customer account. The customer can log in immediately with the provided credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Customer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Account Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Account Credentials</h2>
            <button
              type="button"
              onClick={generatePassword}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Generate Password
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter password"
                  minLength={6}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h2>
          
          <div className="space-y-4">
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <p className="text-sm text-gray-500">
                  Active accounts can place orders and access their account
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-[#6A41A1] focus:ring-[#6A41A1] border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="marketing_consent" className="text-sm font-medium text-gray-700">
                  Marketing Communications
                </label>
                <p className="text-sm text-gray-500">
                  Customer consents to receive marketing emails and promotions
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="marketing_consent"
                  checked={formData.marketing_consent}
                  onChange={(e) => handleInputChange('marketing_consent', e.target.checked)}
                  className="h-4 w-4 text-[#6A41A1] focus:ring-[#6A41A1] border-gray-300 rounded"
                />
                <label htmlFor="marketing_consent" className="ml-2 text-sm text-gray-700">
                  Opt In
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link
            href="/admin/customers"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  full_name: '',
                  email: '',
                  phone: '',
                  role: 'customer',
                  is_active: true,
                  marketing_consent: false,
                  password: '',
                  confirmPassword: ''
                })
                setError(null)
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 