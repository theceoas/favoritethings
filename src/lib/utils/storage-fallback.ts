/**
 * Storage Fallback Utilities
 * Provides fallbacks for browsers that don't support localStorage/sessionStorage
 */

interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  length: number;
  key(index: number): string | null;
}

class MemoryStorage implements StorageInterface {
  private data: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }

  get length(): number {
    return Object.keys(this.data).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  }
}

// Create fallback storage instances
const memoryStorage = new MemoryStorage();

// Safe localStorage wrapper
export const safeLocalStorage: StorageInterface = (() => {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  try {
    // Test if localStorage is available and working
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch (error) {
    console.warn('localStorage not available, using memory fallback:', error);
    return memoryStorage;
  }
})();

// Safe sessionStorage wrapper
export const safeSessionStorage: StorageInterface = (() => {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  try {
    // Test if sessionStorage is available and working
    const testKey = '__sessionStorage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return sessionStorage;
  } catch (error) {
    console.warn('sessionStorage not available, using memory fallback:', error);
    return memoryStorage;
  }
})();

// Utility functions for common storage operations
export const storageUtils = {
  // Safe JSON storage
  setJSON: (storage: StorageInterface, key: string, value: any): void => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store JSON data:', error);
    }
  },

  getJSON: (storage: StorageInterface, key: string, defaultValue: any = null): any => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to parse JSON data:', error);
      return defaultValue;
    }
  },

  // Safe string storage with fallback
  setString: (storage: StorageInterface, key: string, value: string): void => {
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store string data:', error);
    }
  },

  getString: (storage: StorageInterface, key: string, defaultValue: string = ''): string => {
    try {
      return storage.getItem(key) || defaultValue;
    } catch (error) {
      console.error('Failed to get string data:', error);
      return defaultValue;
    }
  }
};
