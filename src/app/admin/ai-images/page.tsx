'use client'

import { useState, useRef } from 'react'
import {
  PhotoIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface GeneratedImage {
  id: string
  url: string
  originalImageName: string
  status: 'generating' | 'completed' | 'error'
}

export default function AIImagesPage() {
  const [originalImages, setOriginalImages] = useState<{file: File, preview: string, name: string}[]>([])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages: {file: File, preview: string, name: string}[] = []
    
    files.forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(`Unsupported file format: ${file.type}. Please upload JPG, PNG, GIF, or WebP images.`)
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('File too large. Please upload an image smaller than 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        newImages.push({
          file,
          preview: e.target?.result as string,
          name: file.name
        })
        
        if (newImages.length === files.length) {
          setOriginalImages(prev => [...prev, ...newImages])
          setGeneratedImages([]) // Clear previous results
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const generateImages = async () => {
    if (originalImages.length === 0) return

    // Check if webhook URL is set
    const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
      alert('Please set your webhook URL in the environment variables (NEXT_PUBLIC_N8N_WEBHOOK_URL)')
      return
    }

    setIsGenerating(true)
    
    // Initialize placeholder images with generating status
    const placeholderImages: GeneratedImage[] = originalImages.map((img, index) => ({
      id: `img-${index}`,
      url: '',
      originalImageName: img.name,
      status: 'generating'
    }))
    
    setGeneratedImages(placeholderImages)

    try {
      // Process all images and send to webhook
      const imagePromises = originalImages.map(async (imgData, index) => {
        try {
          console.log(`Sending image ${imgData.name} to webhook: ${N8N_WEBHOOK_URL}`)
          
          // Send image data in the same format as your n8n form
          const formData = new FormData()
          formData.append('data', imgData.file)

          const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData
          })

          console.log(`Response status: ${response.status}`)

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Webhook error: ${response.status} - ${errorText}`)
            throw new Error(`Webhook failed: ${response.status} - ${errorText}`)
          }

          const result = await response.json()
          console.log(`Webhook response for ${imgData.name}:`, result)
          
          return {
            originalIndex: index,
            success: true,
            data: result
          }
        } catch (error) {
          console.error(`Error processing ${imgData.name}:`, error)
          return {
            originalIndex: index,
            success: false,
            error: error.message
          }
        }
      })

      const results = await Promise.all(imagePromises)
      
      // Update generated images with results
      setGeneratedImages(prev => prev.map((img, index) => {
        const result = results[index]
        if (result.success && result.data && (result.data.imageUrl || result.data.url)) {
          return {
            ...img,
            url: result.data.imageUrl || result.data.url,
            status: 'completed'
          }
        } else {
          return {
            ...img,
            status: 'error'
          }
        }
      }))
      
    } catch (error) {
      console.error('Error in image generation process:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const downloadAllImages = () => {
    const completedImages = generatedImages.filter(img => img.status === 'completed')
    completedImages.forEach((img, index) => {
      const fileName = `generated-${img.originalImageName}-${index + 1}.png`
      setTimeout(() => downloadImage(img.url, fileName), index * 1000)
    })
  }

  const navigateToProductForm = () => {
    const completedImages = generatedImages.filter(img => img.status === 'completed')
    if (completedImages.length === 0) {
      alert('No completed images available to create product')
      return
    }


    
    // Navigate to product creation form
    window.location.href = '/admin/products/new?from=ai-images'
  }

  const testWebhook = async () => {
    const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
      alert('Please set your webhook URL in the environment variables (NEXT_PUBLIC_N8N_WEBHOOK_URL)')
      return
    }

    console.log('Testing webhook:', N8N_WEBHOOK_URL)
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      })

      console.log('Test response status:', response.status)
      
      if (response.ok) {
        const result = await response.text()
        console.log('Test response:', result)
        alert(`Webhook test successful! Status: ${response.status}`)
      } else {
        const errorText = await response.text()
        console.error('Test error:', errorText)
        alert(`Webhook test failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Test error:', error)
      alert(`Test error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-[#6A41A1]" />
            <h1 className="text-3xl font-bold text-gray-900">AI Image Generator</h1>
          </div>
          <p className="text-gray-600 max-w-4xl">
            Upload your images and generate AI-enhanced versions for your products.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Images</h2>
          
          {originalImages.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#6A41A1] hover:bg-[#6A41A1]/5 transition-colors cursor-pointer"
            >
              <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Images</h3>
              <p className="text-gray-600 mb-4">
                Click to upload one or multiple images
              </p>
              <div className="text-sm text-gray-500">
                Supported formats: JPG, PNG, WebP • Max size: 10MB each
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {originalImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Original ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-lg"
                    />
                    <button
                      onClick={() => {
                        setOriginalImages(prev => prev.filter((_, i) => i !== index))
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={generateImages}
                  disabled={isGenerating}
                  className="inline-flex items-center px-8 py-3 bg-[#6A41A1] text-white rounded-xl hover:bg-[#6A41A1]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {isGenerating ? `Generating ${originalImages.length} Images...` : `Generate ${originalImages.length} AI Images`}
                </button>

                <button
                  onClick={testWebhook}
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300"
                >
                  Test Webhook
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300"
                >
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Upload More Images
                </button>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Generated Images Section */}
        {generatedImages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generated Images</h2>
              {generatedImages.some(img => img.status === 'completed') && (
                <div className="flex space-x-3">
                  <button
                    onClick={navigateToProductForm}
                    className="inline-flex items-center px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Create Product
                  </button>
                  <button
                    onClick={downloadAllImages}
                    className="inline-flex items-center px-4 py-2 bg-[#FFD84D] text-[#4F4032] rounded-lg hover:bg-[#FFD84D]/80 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download All
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generatedImages.map((image) => (
                <div key={image.id} className="group relative">
                  <div className="bg-gray-100 rounded-lg aspect-square relative overflow-hidden">
                    {image.status === 'generating' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-600">Generating...</p>
                        </div>
                      </div>
                    )}
                    
                    {image.status === 'completed' && (
                      <>
                        {image.url && (
                          <img
                            src={image.url}
                            alt={`Generated from ${image.originalImageName}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!image.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <XMarkIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">No image URL returned</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedImage(image.url)}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                              disabled={!image.url}
                            >
                              <EyeIcon className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              onClick={() => downloadImage(image.url, `generated-${image.originalImageName}.png`)}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                              disabled={!image.url}
                            >
                              <ArrowDownTrayIcon className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      </>
                    )}
                    
                    {image.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center">
                          <XMarkIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-red-600">Failed to generate</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="font-medium text-gray-900 text-sm">Generated from: {image.originalImageName}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-[90vh]">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <XMarkIcon className="w-8 h-8" />
              </button>
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 