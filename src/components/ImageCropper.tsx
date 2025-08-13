"use client"

import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { X, RotateCw, Check, Download } from 'lucide-react'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
}

export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 16/9 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [rotation, setRotation] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Convert external image to blob to avoid CORS issues
  const convertImageToBlob = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, { mode: 'cors' })
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.warn('Failed to convert image to blob, using original URL:', error)
      return url
    }
  }

  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageError(null)
        const blobUrl = await convertImageToBlob(imageUrl)
        if (imgRef.current) {
          imgRef.current.src = blobUrl
        }
      } catch (error) {
        setImageError('Failed to load image')
        console.error('Error loading image:', error)
      }
    }

    loadImage()
  }, [imageUrl])

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop,
    rotation: number = 0
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('No 2d context'))
        return
      }

      // Set canvas dimensions
      canvas.width = crop.width
      canvas.height = crop.height

      // Handle CORS for external images
      if (image.crossOrigin) {
        canvas.crossOrigin = 'anonymous'
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(1, 1)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      try {
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        )

        ctx.restore()

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, 'image/jpeg', 0.9)
      } catch (error) {
        reject(error)
      }
    })
  }

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return

    try {
      const croppedImageUrl = await getCroppedImg(
        imgRef.current,
        completedCrop,
        rotation
      )
      onCropComplete(croppedImageUrl)
    } catch (error) {
      console.error('Error cropping image:', error)
      // Show user-friendly error message
      alert('Failed to crop image. This might be due to browser security restrictions. Please try uploading a local image instead.')
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Image Cropping Area */}
          <div className="flex-1">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                minWidth={100}
                minHeight={100}
              >
                {imageError ? (
                  <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Failed to load image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError('Failed to load image')}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      opacity: imageLoaded ? 1 : 0.5
                    }}
                  />
                )}
              </ReactCrop>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:w-64 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Crop Controls</h4>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleRotate}
                  className="w-full justify-start"
                  disabled={!imageLoaded || !!imageError}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rotate 90°
                </Button>

                <div className="text-sm text-gray-600">
                  <p><strong>Aspect Ratio:</strong> {aspectRatio.toFixed(2)}:1</p>
                  <p><strong>Current Crop:</strong></p>
                  <p>Width: {completedCrop?.width || 0}px</p>
                  <p>Height: {completedCrop?.height || 0}px</p>
                </div>

                {imageError && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <p><strong>Note:</strong> External images may not crop properly due to browser security restrictions.</p>
                    <p className="mt-1">Try uploading a local image file instead.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleCropComplete}
                disabled={!completedCrop}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Apply Crop
              </Button>
              
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 