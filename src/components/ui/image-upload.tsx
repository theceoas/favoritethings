'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'others-images',
  folder = 'others',
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      setPreview(publicUrl)
      onChange(publicUrl)
      toast.success('Image uploaded successfully!')

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      await uploadImage(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Image</Label>
      
      <AnimatePresence>
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group"
          >
            <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <Button
                  onClick={removeImage}
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
              Image uploaded successfully
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`
                w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
                ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-gray-50 hover:border-gray-400 cursor-pointer'}
                transition-all duration-200
              `}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || uploading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!preview && !uploading && (
        <div className="flex items-center justify-center">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose Image
          </Button>
        </div>
      )}
    </div>
  )
} 