'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  PhotoIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import ImageModal from '@/components/ImageModal'

interface CustomOrder {
  id: string
  order_code: string
  customer_name: string
  customer_email: string
  product_type: string
  description: string
  budget_range?: string
  timeline?: string
  special_requirements?: string
  status: string
  created_at: string
}

export default function CustomOrderUploadPage() {
  const [step, setStep] = useState<'verify' | 'upload' | 'success'>('verify')
  const [orderCode, setOrderCode] = useState('')
  const [email, setEmail] = useState('')
  const [customOrder, setCustomOrder] = useState<CustomOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Image upload states
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const verifyOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      
      // First check if order code exists
      const { data: codeCheck, error: codeError } = await supabase
        .from('custom_orders')
        .select('customer_email')
        .eq('order_code', orderCode.toUpperCase())
        .single()

      if (codeError) {
        if (codeError.code === 'PGRST116') {
          setError(`Order code "${orderCode.toUpperCase()}" not found. Please check your order code.`)
          setLoading(false)
          return
        }
      }

      // If code exists, check if email matches
      if (codeCheck && codeCheck.customer_email !== email.toLowerCase()) {
        setError(`Email address does not match the order code. Please check your email.`)
        setLoading(false)
        return
      }

      // Get full order details
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('order_code', orderCode.toUpperCase())
        .eq('customer_email', email.toLowerCase())
        .single()

      if (error) {
        setError('Error verifying order. Please try again.')
        return
      }

      if (data) {
        setCustomOrder(data)
        setSuccess('Order verified successfully! You can now upload your reference images.')
        setStep('upload')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        setError('Please select only JPG, PNG, or WebP images.')
        return false
      }
      
      if (!isValidSize) {
        setError('Image size must be less than 10MB.')
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      setError('')
      setImages(prev => [...prev, ...validFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (images.length === 0) {
      setError('Please select at least one image to upload.')
      return
    }

    setUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('You must be logged in to upload images. Please log in and try again.')
      }

      // Get existing images first
      const { data: existingOrder, error: orderError } = await supabase
        .from('custom_orders')
        .select('reference_images')
        .eq('id', customOrder?.id)
        .single()

      if (orderError) {
        console.error('Order fetch error:', orderError)
        throw new Error('Could not fetch existing order details.')
      }

      const existingImages = existingOrder?.reference_images || []
      const uploadedUrls: string[] = []

      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${customOrder?.order_code}-${Date.now()}-${i}.${fileExt}`
        const filePath = `${fileName}`

        try {
          console.log('Attempting upload:', { fileName, contentType: file.type })
          
          // Upload to Supabase Storage with options to preserve quality
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('custom-orders')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
              cacheControl: '3600',
              duplex: 'half'
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
          }

          // Get public URL with options to serve original image
          const { data: urlData } = supabase.storage
            .from('custom-orders')
            .getPublicUrl(filePath, {
              download: false,
              transform: {
                quality: 100,
                format: 'origin'
              }
            })

          if (urlData?.publicUrl) {
            uploadedUrls.push(urlData.publicUrl)
          } else {
            console.error('No public URL generated for:', filePath)
            throw new Error('Failed to generate public URL for uploaded image.')
          }

          // Update progress
          setUploadProgress(((i + 1) / images.length) * 100)
        } catch (uploadErr) {
          console.error('Individual file upload error:', uploadErr)
          throw uploadErr
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls]

      // Update custom order with combined images
      const { error: updateError } = await supabase
        .from('custom_orders')
        .update({ 
          reference_images: allImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', customOrder?.id)

      if (updateError) {
        console.error('Order update error:', updateError)
        throw new Error('Failed to update order with new images.')
      }

      setSuccess('Images uploaded successfully! Your custom order has been updated.')
      setStep('success')
    } catch (err) {
      console.error('Upload process error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#fffbe6] to-[#fff] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#6A41A1] mb-4">
            Upload Reference Images
          </h1>
          <p className="text-lg text-[#4F4032] max-w-2xl mx-auto">
            Enter your order code and email to upload reference images for your custom order.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step === 'verify' ? 'bg-[#6A41A1] text-white border-[#6A41A1]' : 
              step === 'upload' || step === 'success' ? 'bg-green-500 text-white border-green-500' : 
              'bg-gray-200 text-gray-500 border-gray-200'
            }`}>
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className={`w-16 h-1 ${
              step === 'upload' || step === 'success' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step === 'upload' ? 'bg-[#6A41A1] text-white border-[#6A41A1]' : 
              step === 'success' ? 'bg-green-500 text-white border-green-500' : 
              'bg-gray-200 text-gray-500 border-gray-200'
            }`}>
              <PhotoIcon className="w-6 h-6" />
            </div>
            <div className={`w-16 h-1 ${
              step === 'success' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step === 'success' ? 'bg-green-500 text-white border-green-500' : 
              'bg-gray-200 text-gray-500 border-gray-200'
            }`}>
              <CheckCircleIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Step 1: Verify Order */}
        {step === 'verify' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#6A41A1] mb-6 text-center">
              Verify Your Order
            </h2>
            
            <form onSubmit={verifyOrder} className="space-y-6">
              <div>
                <label htmlFor="orderCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Code *
                </label>
                <input
                  type="text"
                  id="orderCode"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter your 8-digit order code"
                  required
                  maxLength={8}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6A41A1] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#5A3A91] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Order'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload Images */}
        {step === 'upload' && customOrder && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#6A41A1] mb-6 text-center">
              Upload Your Images
            </h2>

            {/* Order Code Display */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Verified</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-600">Order Code:</span>
                  <span className="ml-2 font-mono bg-[#6A41A1] text-white px-3 py-1 rounded-lg text-sm font-bold">
                    {customOrder.order_code}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Ready to upload your reference images
                </div>
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#6A41A1] transition-colors duration-200">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Upload Reference Images
                </p>
                <p className="text-gray-500 mb-4">
                  Drag and drop images here, or click to select files
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#6A41A1] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5A3A91] transition-colors duration-200"
                >
                  Select Images
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Images */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Selected Images ({images.length})</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Selected ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedImage(URL.createObjectURL(file))}
                            className="p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
                            title="View"
                          >
                            <EyeIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => removeImage(index)}
                            className="p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
                            title="Remove"
                          >
                            <XMarkIcon className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading images...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#6A41A1] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  onClick={uploadImages}
                  disabled={uploading || images.length === 0}
                  className="flex-1 bg-[#6A41A1] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#5A3A91] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#6A41A1] mb-4">
              Upload Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your reference images have been uploaded successfully. Our team will review your custom order and get back to you soon.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('verify')
                  setOrderCode('')
                  setEmail('')
                  setCustomOrder(null)
                  setImages([])
                  setError('')
                }}
                className="w-full bg-[#6A41A1] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#5A3A91] transition-colors duration-200"
              >
                Upload for Another Order
              </button>
            </div>
          </div>
        )}

        {/* Image Modal */}
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage || ''}
        />
      </div>
    </div>
  )
} 