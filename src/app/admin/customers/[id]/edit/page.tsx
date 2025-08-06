'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'customer' | 'admin'
  phone?: string
  is_active?: boolean
  marketing_consent?: boolean
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer' as 'customer' | 'admin',
    is_active: true,
    marketing_consent: false
  })

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single()

      if (error) throw error

      setCustomer(data)
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'customer',
        is_active: data.is_active !== false,
        marketing_consent: data.marketing_consent || false
      })
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          is_active: formData.is_active,
          marketing_consent: formData.marketing_consent,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)

      if (error) throw error

      // Redirect back to customer detail page
      router.push(`/admin/customers/${customerId}`)
    } catch (error: any) {
      setError(error.message || 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading customer...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
        <p className="text-gray-600 mb-4">The customer you're trying to edit doesn't exist.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/admin/customers/${customerId}`}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-[#6A41A1]">Edit Customer</h1>
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

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
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
                Role
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

        {/* Account Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Account Status</h2>
          
          <div className="space-y-4">
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <p className="text-sm text-gray-500">
                  Inactive accounts cannot place orders or access their account
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
                  Customer has consented to receive marketing emails and promotions
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
                  Opted In
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Picture</h2>
          
          <div className="flex items-center space-x-6">
            <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.full_name || customer.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            
            <div>
              <button
                type="button"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CameraIcon className="w-5 h-5 mr-2" />
                Change Photo
              </button>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link
            href={`/admin/customers/${customerId}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          
          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Customer ID Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Customer ID</dt>
            <dd className="font-mono text-gray-900">{customer.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="text-gray-900">{new Date(customer.created_at || '').toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last Updated</dt>
            <dd className="text-gray-900">{new Date(customer.updated_at || '').toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
} 