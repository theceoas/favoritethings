'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StarIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { Collection } from '@/types/product'
import ImageEditor from './ImageEditor'

interface CollectionFormProps {
  collection?: Collection
  isEditing?: boolean
}

interface FormData {
  name: string
  slug: string
  description: string
  image_url: string
  is_featured: boolean
  is_active: boolean
  sort_order: number
}

export default function CollectionForm({ collection, isEditing = false }: CollectionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: collection?.name || '',
    slug: collection?.slug || '',
    description: collection?.description || '',
    image_url: collection?.image_url || '',
    is_featured: collection?.is_featured || false,
    is_active: collection?.is_active ?? true,
    sort_order: collection?.sort_order || 0,
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, isEditing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

          if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image size must be less than 10MB')
      return
    }

    setUploadingImage(true)

    try {
      // Create data URL and open image editor
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setTempImageUrl(dataUrl)
        setTempImageFile(file)
        setShowImageEditor(true)
        setUploadingImage(false)
      }
      
      reader.onerror = () => {
        console.error('Error reading file')
        alert('Failed to process image. Please try again.')
        setUploadingImage(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try again.')
      setUploadingImage(false)
    }
  }

  const handleEditorSave = (editedFile: File) => {
    // Convert the File to a data URL for storage
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setFormData(prev => ({ ...prev, image_url: dataUrl }))
      setShowImageEditor(false)
      setTempImageUrl('')
      setTempImageFile(null)
    }
    reader.readAsDataURL(editedFile)
  }

  const handleEditorCancel = () => {
    setShowImageEditor(false)
    setTempImageUrl('')
    setTempImageFile(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a collection name')
      return
    }
    
    if (!formData.slug.trim()) {
      alert('Please enter a URL slug')
      return
    }

    setIsLoading(true)
    console.log('🔄 Starting collection save...', { formData })

    const supabase = createClient()

    try {
      console.log('📊 Form data to save:', formData)
      
      const collectionData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      }

      console.log('💾 Saving to database...', { isEditing, collectionId: collection?.id })

      let result
      
      if (isEditing && collection?.id) {
        console.log('✏️ Updating collection...', collection.id)
        result = await Promise.race([
          supabase
            .from('collections')
            .update({
              ...collectionData,
              updated_at: new Date().toISOString()
            })
            .eq('id', collection.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Update timeout')), 15000)
          )
        ])
      } else {
        console.log('➕ Creating new collection...')
        result = await Promise.race([
          supabase
            .from('collections')
            .insert(collectionData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Insert timeout')), 15000)
          )
        ])
      }

      if (result.error) {
        console.error('❌ Database error:', result.error)
        throw result.error
      }
      
      console.log('✅ Database operation successful')

      console.log('🔄 Redirecting to collections page...')
      router.push('/admin/collections')
      router.refresh()
    } catch (error: any) {
      console.error('❌ Error saving collection:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to save collection. '
      if (error.message?.includes('Admin access required')) {
        errorMessage += 'Your account needs admin privileges. Please contact support.'
      } else if (error.message?.includes('not authenticated')) {
        errorMessage += 'Please log in and try again.'
      } else if (error.message?.includes('duplicate')) {
        errorMessage += 'A collection with this name or slug already exists.'
      } else if (error.message?.includes('size')) {
        errorMessage += 'The image is too large. Please use a smaller image.'
      } else if (error.message?.includes('network')) {
        errorMessage += 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('new row violates row-level security policy')) {
        errorMessage += 'Permission denied. Admin access required.'
      } else {
        errorMessage += `Please check your inputs and try again. Error: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
      console.log('🔄 Save operation complete')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#6A41A1]">
          {isEditing ? 'Edit Collection' : 'Create New Collection'}
        </h1>
        <p className="text-[#4F4032]/80 mt-1">
          {isEditing ? 'Update collection details' : 'Add a new collection to organize your products'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-[#6A41A1] mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#4F4032] mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                placeholder="Enter collection name"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-[#4F4032] mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                placeholder="collection-url-slug"
              />
              <p className="text-xs text-[#4F4032]/60 mt-1">
                Used in URL: /collections/{formData.slug}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-[#4F4032] mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="Describe this collection..."
            />
          </div>

          {/* Collection Image */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-[#4F4032] mb-4">
              Collection Thumbnail Image
            </label>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Area */}
              <div>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-[#6A41A1] bg-[#6A41A1]/5' 
                      : 'border-gray-300 hover:border-[#6A41A1]'
                  } ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A41A1] mb-4"></div>
                      <p className="text-[#4F4032] font-medium">Processing image...</p>
                      <p className="text-[#4F4032]/60 text-sm mt-1">Please wait</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-[#4F4032] mb-2">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-sm text-[#4F4032]/60">PNG, JPG, WEBP up to 10MB</p>
                      <p className="text-xs text-[#4F4032]/40 mt-2">✨ Images will open in editor for cropping & resizing</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                </div>
                
                {/* Alternative URL Input */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#4F4032]/80 mb-2">
                    Or paste image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6A41A1] focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              {/* Image Preview */}
              <div>
                {formData.image_url ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[#4F4032]">Preview</p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Convert existing image to File for editing
                              const response = await fetch(formData.image_url)
                              const blob = await response.blob()
                              const file = new File([blob], 'collection-image.jpg', { type: blob.type })
                              
                              setTempImageUrl(formData.image_url)
                              setTempImageFile(file)
                              setShowImageEditor(true)
                            } catch (error) {
                              console.error('Error loading image for editing:', error)
                              alert('Failed to load image for editing')
                            }
                          }}
                          className="px-3 py-1 bg-[#6A41A1] text-white rounded-lg text-sm hover:bg-[#6A41A1]/90 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                      <div className="relative">
                        <img
                          src={formData.image_url}
                          alt="Collection preview"
                          className="w-full h-64 object-cover rounded-xl shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Homepage Preview */}
                    <div>
                      <p className="text-sm font-medium text-[#4F4032] mb-2">How it looks on homepage</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="bg-white rounded-xl overflow-hidden shadow-md max-w-xs">
                          <img
                            src={formData.image_url}
                            alt="Homepage preview"
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-semibold text-sm">{formData.name || 'Collection Name'}</h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {formData.description || 'Collection description...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image selected</p>
                      <p className="text-xs mt-1">Upload an image to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-[#6A41A1] mb-6">Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sort Order */}
            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-[#4F4032] mb-2">
                Sort Order
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              />
              <p className="text-xs text-[#4F4032]/60 mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Featured */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#6A41A1] border-gray-300 rounded focus:ring-[#6A41A1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#4F4032] flex items-center">
                    Featured Collection
                    <StarIcon className="h-4 w-4 ml-1 text-[#FFD84D]" />
                  </span>
                  <p className="text-xs text-[#4F4032]/60">Show on homepage (max 3)</p>
                </div>
              </label>
              {formData.is_featured && (
                <div className="bg-[#6A41A1]/10 border border-[#6A41A1]/20 rounded-lg p-3 ml-8">
                  <p className="text-xs text-[#6A41A1] flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    This collection will be featured on the homepage
                  </p>
                </div>
              )}
            </div>

            {/* Active */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#6A41A1] border-gray-300 rounded focus:ring-[#6A41A1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#4F4032]">Active</span>
                  <p className="text-xs text-[#4F4032]/60">Visible to customers</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/collections')}
            className="px-6 py-3 border border-gray-200 text-[#4F4032] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#6A41A1] text-white rounded-xl hover:bg-[#6A41A1]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Collection' : 'Create Collection'}
          </button>
        </div>
      </form>

      {/* Image Editor Modal */}
      {showImageEditor && (
        <ImageEditor
          isOpen={showImageEditor}
          onClose={handleEditorCancel}
          onSave={handleEditorSave}
          imageFile={tempImageFile}
          title="Edit Collection Image"
        />
      )}
    </div>
  )
} 