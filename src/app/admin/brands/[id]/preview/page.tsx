"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Eye, Upload, Image as ImageIcon, Crop } from "lucide-react"
import Link from 'next/link'
import ImageCropper from '@/components/ImageCropper'

interface Brand {
  id: string
  name: string
  slug: string
  description?: string
  preview_title?: string
  preview_description?: string
  preview_image_url?: string
  show_on_homepage: boolean
  primary_color: string
  secondary_color: string
  accent_color: string
}

export default function BrandPreviewEditor() {
  const router = useRouter()
  const params = useParams()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    preview_title: '',
    preview_description: '',
    preview_image_url: '',
    show_on_homepage: true
  })

  useEffect(() => {
    if (params.id) {
      fetchBrand()
    }
  }, [params.id])

  const fetchBrand = async () => {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      setBrand(data)
      setFormData({
        preview_title: data.preview_title || data.name || '',
        preview_description: data.preview_description || data.description || '',
        preview_image_url: data.preview_image_url || '',
        show_on_homepage: data.show_on_homepage ?? true
      })
    } catch (err) {
      console.error('Error fetching brand:', err)
      setError('Failed to load brand')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('brands')
        .update({
          preview_title: formData.preview_title,
          preview_description: formData.preview_description,
          preview_image_url: formData.preview_image_url,
          show_on_homepage: formData.show_on_homepage,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      router.push('/admin/brands')
    } catch (err) {
      console.error('Error updating brand preview:', err)
      setError('Failed to save preview settings')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a temporary URL for cropping
      const tempUrl = URL.createObjectURL(file)
      setTempImageUrl(tempUrl)
      setShowCropper(true)
    }
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Convert blob URL to file
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
      
      const supabase = createClient()
      
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `brand-preview-${brand?.slug}-${timestamp}.jpg`
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('brand-images')
        .upload(fileName, file)

      if (error) throw error

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-images')
        .getPublicUrl(fileName)

      // Update form data with the permanent URL
      setFormData({ ...formData, preview_image_url: publicUrl })
      
      // Clean up temporary URLs
      URL.revokeObjectURL(croppedImageUrl)
      URL.revokeObjectURL(tempImageUrl)
      
      setShowCropper(false)
      setTempImageUrl('')
      
    } catch (error) {
      console.error('Error uploading cropped image:', error)
      setError('Failed to upload cropped image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl)
      setTempImageUrl('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error && !brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <CardContent>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Link href="/admin/brands">
              <Button className="mt-4">Back to Brands</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/brands">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Brands
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Edit Homepage Preview</h1>
                  <p className="text-gray-600">Customize how {brand?.name} appears on the homepage</p>
                </div>
              </div>
              <Link href="/" target="_blank">
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview Homepage
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
              {error}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Homepage Visibility */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Homepage Visibility</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="show_on_homepage"
                        checked={formData.show_on_homepage}
                        onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="show_on_homepage" className="text-sm text-gray-600">
                        Show this brand on the homepage
                      </label>
                    </div>
                  </div>

                  {/* Preview Title */}
                  <div className="space-y-2">
                    <label htmlFor="preview_title" className="text-sm font-medium text-gray-700">
                      Preview Title
                    </label>
                    <input
                      type="text"
                      id="preview_title"
                      value={formData.preview_title}
                      onChange={(e) => setFormData({ ...formData, preview_title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter preview title..."
                      required
                    />
                  </div>

                  {/* Preview Description */}
                  <div className="space-y-2">
                    <label htmlFor="preview_description" className="text-sm font-medium text-gray-700">
                      Preview Description
                    </label>
                    <textarea
                      id="preview_description"
                      value={formData.preview_description}
                      onChange={(e) => setFormData({ ...formData, preview_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter preview description..."
                      required
                    />
                  </div>

                  {/* Preview Image */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Preview Image</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.preview_image_url}
                        onChange={(e) => setFormData({ ...formData, preview_image_url: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter image URL..."
                      />
                      
                      {/* Current Image Preview */}
                      {formData.preview_image_url && (
                        <div className="space-y-2">
                          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={formData.preview_image_url}
                              alt="Current preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTempImageUrl(formData.preview_image_url)
                              setShowCropper(true)
                            }}
                            className="w-full"
                          >
                            <Crop className="w-4 h-4 mr-2" />
                            Crop Current Image
                          </Button>
                        </div>
                      )}
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-colors ${
                            loading 
                              ? 'border-blue-300 bg-blue-50 cursor-not-allowed' 
                              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          {loading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"
                              />
                              <span className="text-sm text-blue-600">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Crop className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600">Upload & Crop New Image</span>
                            </>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Tip: For best results, upload local image files. The crop area is locked to 1.5:1 ratio to match your homepage cards perfectly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Preview Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">Homepage Preview</h3>
                
                {formData.show_on_homepage ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      This is how your brand will appear on the homepage:
                    </p>
                    
                    {/* Preview Card */}
                    <div className="relative group cursor-pointer max-w-sm">
                      <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
                        {formData.preview_image_url ? (
                          <img
                            src={formData.preview_image_url}
                            alt={formData.preview_title}
                            className="w-full h-64 object-scale-down transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm">No image selected</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div 
                          className="absolute top-4 left-4 px-3 py-1 rounded-lg text-white text-sm font-medium shadow-lg"
                          style={{ backgroundColor: brand?.primary_color || '#F59E0B' }}
                        >
                          {formData.preview_title}
                        </div>
                      </div>
                      
                      {formData.preview_description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{formData.preview_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Hidden from Homepage</p>
                    <p className="text-sm">This brand will not appear on the homepage preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && tempImageUrl && (
        <ImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4/3} // More flexible aspect ratio for better composition
        />
      )}
    </div>
  )
} 