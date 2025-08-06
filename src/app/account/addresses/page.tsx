'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from '@/components/ui/CustomModal'
import {
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  HomeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface Address {
  id: string
  type: 'shipping' | 'billing' | 'both'
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
}

export default function AddressesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const { modalState, closeModal, confirm, error: showError } = useCustomModal()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin?redirect=/account/addresses')
        return
      }
      setUser(user)
      await fetchAddresses(user.id)
    }
    getUser()
  }, [router])

  const fetchAddresses = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAddress = async (addressId: string) => {
    const confirmed = await confirm(
      'Delete Address',
      'Are you sure you want to delete this address?',
      'Delete',
      'Cancel'
    )
    if (!confirmed) return
    
    setDeleting(addressId)
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error
      
      setAddresses(prev => prev.filter(addr => addr.id !== addressId))
    } catch (error) {
      console.error('Error deleting address:', error)
      showError('Delete Failed', 'Failed to delete address. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const setAsDefault = async (addressId: string) => {
    try {
      // First, unset all other default addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error
      
      // Refresh addresses
      await fetchAddresses(user.id)
    } catch (error) {
      console.error('Error setting default address:', error)
      showError('Set Default Failed', 'Failed to set default address. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A41A1] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading addresses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/account"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Account
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
              <p className="text-gray-600 mt-1">Manage your saved shipping and billing addresses</p>
            </div>
            <Link
              href="/account/addresses/new"
              className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Address
            </Link>
          </div>
        </div>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved</h3>
            <p className="text-gray-600 mb-6">
              Add your first address to make checkout faster and easier.
            </p>
            <Link
              href="/account/addresses/new"
              className="inline-flex items-center px-6 py-3 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Address
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group"
              >
                {/* Address Type Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {address.type === 'shipping' ? (
                      <HomeIcon className="w-5 h-5 text-blue-600" />
                    ) : address.type === 'billing' ? (
                      <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <MapPinIcon className="w-5 h-5 text-purple-600" />
                    )}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      address.type === 'shipping' 
                        ? 'bg-blue-100 text-blue-800' 
                        : address.type === 'billing'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {address.type === 'both' ? 'Shipping & Billing' : address.type}
                    </span>
                  </div>
                  
                  {address.is_default && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Default
                    </span>
                  )}
                </div>

                {/* Address Details */}
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {address.first_name} {address.last_name}
                  </p>
                  {address.company && (
                    <p className="text-gray-600">{address.company}</p>
                  )}
                  {address.address_line_1 !== 'Store Pickup - Contact Info Only' ? (
                    <>
                      <p className="text-gray-700">{address.address_line_1}</p>
                      {address.address_line_2 && (
                        <p className="text-gray-700">{address.address_line_2}</p>
                      )}
                      <p className="text-gray-700">
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p className="text-gray-700">{address.country}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Contact information for store pickup</p>
                  )}
                  {address.phone && (
                    <p className="text-gray-600">{address.phone}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/account/addresses/${address.id}/edit`}
                      className="text-gray-400 hover:text-[#6A41A1] p-2 rounded-lg hover:bg-gray-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      disabled={deleting === address.id}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {!address.is_default && (
                    <button
                      onClick={() => setAsDefault(address.id)}
                      className="text-xs text-[#6A41A1] hover:text-[#6A41A1]/80 font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Address Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Your default address will be automatically selected at checkout</li>
            <li>• You can save both shipping and billing addresses for faster checkout</li>
            <li>• Contact information is saved for store pickup orders</li>
            <li>• All your saved addresses are private and secure</li>
          </ul>
        </div>
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  )
} 