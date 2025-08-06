'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function CheckAdmin() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Profile not found, creating one...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: 'customer' // Default role
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
          } else {
            console.log('Profile created:', newProfile)
            setProfile(newProfile)
          }
        } else {
          setProfile(profile)
          if (profileError) {
            console.error('Profile error:', profileError)
          }
        }
      }
    } catch (err) {
      console.error('Check admin error:', err)
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async () => {
    if (!user) return

    try {
      // First check if profile exists, if not create it
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'admin' // Create as admin directly
          })
          .select()
          .single()

        if (createError) {
          console.error('Create error:', createError)
          alert('Error creating profile: ' + createError.message)
          return
        } else {
          setProfile(newProfile)
          alert('Success! Profile created and you are now admin!')
          return
        }
      }

      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        alert('Error: ' + error.message)
      } else {
        alert('Success! You are now admin.')
        checkUserStatus() // Refresh the data
      }
    } catch (err) {
      console.error('Make admin error:', err)
      alert('Error: ' + err)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Status Check</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold">User Info:</h3>
            <p><strong>Logged In:</strong> {user ? 'Yes' : 'No'}</p>
            {user && (
              <>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
              </>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold">Profile Info:</h3>
            {profile ? (
              <>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
                <p><strong>Is Admin:</strong> {profile.role === 'admin' ? '✅ YES' : '❌ NO'}</p>
              </>
            ) : (
              <p>No profile found</p>
            )}
          </div>

          <div className="space-x-4">
            <button
              onClick={checkUserStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Status
            </button>

            {user && profile?.role !== 'admin' && (
              <button
                onClick={makeAdmin}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Make Me Admin
              </button>
            )}
          </div>

          {profile?.role === 'admin' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                ✅ You are an admin! Try accessing <a href="/admin" className="underline">/admin</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 