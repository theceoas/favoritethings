/**
 * Database Storage Utilities
 * Replaces localStorage/sessionStorage with Supabase database storage
 */

import { createClient } from '@/lib/supabase/client'

interface StorageInterface {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

class DatabaseStorage implements StorageInterface {
  private sessionId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.getSessionId()
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    let sessionId = sessionStorage.getItem('db-storage-session-id')
    if (!sessionId) {
      sessionId = 'db_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('db-storage-session-id', sessionId)
    }
    return sessionId
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const supabase = createClient()
      if (!supabase) return null

      const { data: { user } } = await supabase.auth.getUser()

      const { data: preference, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('preference_key', key)
        .or(`user_id.eq.${user?.id || ''},session_id.eq.${this.sessionId || ''}`)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting preference:', error)
        return null
      }

      return preference?.preference_value ? JSON.stringify(preference.preference_value) : null
    } catch (error) {
      console.error('Error in databaseStorage.getItem:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const supabase = createClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id || null,
          session_id: user ? null : this.sessionId,
          preference_key: key,
          preference_value: JSON.parse(value)
        })

      if (error) {
        console.error('Error setting preference:', error)
      }
    } catch (error) {
      console.error('Error in databaseStorage.setItem:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const supabase = createClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('preference_key', key)
        .or(`user_id.eq.${user?.id || ''},session_id.eq.${this.sessionId || ''}`)

      if (error) {
        console.error('Error removing preference:', error)
      }
    } catch (error) {
      console.error('Error in databaseStorage.removeItem:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const supabase = createClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .or(`user_id.eq.${user?.id || ''},session_id.eq.${this.sessionId || ''}`)

      if (error) {
        console.error('Error clearing preferences:', error)
      }
    } catch (error) {
      console.error('Error in databaseStorage.clear:', error)
    }
  }
}

// Create singleton instance
export const databaseStorage = new DatabaseStorage()

// Utility functions for common storage operations
export const storageUtils = {
  // Safe JSON storage
  setJSON: async (key: string, value: any): Promise<void> => {
    try {
      await databaseStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to store JSON data:', error)
    }
  },

  getJSON: async (key: string, defaultValue: any = null): Promise<any> => {
    try {
      const item = await databaseStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to parse JSON data:', error)
      return defaultValue
    }
  },

  // Safe string storage with fallback
  setString: async (key: string, value: string): Promise<void> => {
    try {
      await databaseStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to store string data:', error)
    }
  },

  getString: async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
      const item = await databaseStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to get string data:', error)
      return defaultValue
    }
  }
}
