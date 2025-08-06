'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ImageEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (editedFile: File) => void
  imageFile: File | null
  title?: string
}

interface Transform {
  x: number
  y: number
  scale: number
  rotation: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface Filters {
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

export default function ImageEditor({ isOpen, onClose, onSave, imageFile, title = "Edit Image" }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1, rotation: 0 })
  const [filters, setFilters] = useState<Filters>({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
  const [cropMode, setCropMode] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalImageData, setOriginalImageData] = useState<string>('')
  const [history, setHistory] = useState<Transform[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Load image when file changes
  useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setOriginalImageData(result)
        resetTransforms()
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile, isOpen])

  // Reset all transforms
  const resetTransforms = () => {
    const newTransform = { x: 0, y: 0, scale: 1, rotation: 0 }
    setTransform(newTransform)
    setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
    setCropMode(false)
    setHistory([newTransform])
    setHistoryIndex(0)
  }

  // Add to history
  const addToHistory = (newTransform: Transform) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newTransform)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const prevTransform = history[historyIndex - 1]
      setTransform(prevTransform)
      setHistoryIndex(historyIndex - 1)
    }
  }

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextTransform = history[historyIndex + 1]
      setTransform(nextTransform)
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Apply filter CSS
  const getFilterStyle = () => {
    return {
      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`,
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
      transformOrigin: 'center center'
    }
  }

  // Zoom functions
  const zoomIn = () => {
    const newTransform = { ...transform, scale: Math.min(transform.scale * 1.2, 5) }
    setTransform(newTransform)
    addToHistory(newTransform)
  }

  const zoomOut = () => {
    const newTransform = { ...transform, scale: Math.max(transform.scale / 1.2, 0.1) }
    setTransform(newTransform)
    addToHistory(newTransform)
  }

  const resetZoom = () => {
    const newTransform = { ...transform, scale: 1, x: 0, y: 0 }
    setTransform(newTransform)
    addToHistory(newTransform)
  }

  // Rotation functions
  const rotateLeft = () => {
    const newTransform = { ...transform, rotation: transform.rotation - 90 }
    setTransform(newTransform)
    addToHistory(newTransform)
  }

  const rotateRight = () => {
    const newTransform = { ...transform, rotation: transform.rotation + 90 }
    setTransform(newTransform)
    addToHistory(newTransform)
  }

  // Mouse/touch handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cropMode) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || cropMode) return
    const newTransform = {
      ...transform,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }
    setTransform(newTransform)
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      addToHistory(transform)
    }
  }

  // Convert canvas to file
  const saveEditedImage = async () => {
    if (!imageRef.current || !originalImageData) return

    const img = new Image()
    img.onload = () => {
      // Calculate the required canvas size to accommodate all transformations
      const maxDimension = Math.max(img.width, img.height)
      const scale = transform.scale
      const rotatedWidth = Math.abs(img.width * Math.cos(transform.rotation * Math.PI / 180)) + 
                          Math.abs(img.height * Math.sin(transform.rotation * Math.PI / 180))
      const rotatedHeight = Math.abs(img.width * Math.sin(transform.rotation * Math.PI / 180)) + 
                           Math.abs(img.height * Math.cos(transform.rotation * Math.PI / 180))
      
      // Set canvas size to accommodate the full transformed image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = rotatedWidth * scale
      canvas.height = rotatedHeight * scale

      // Apply filters
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`
      
      // Apply transformations from the center
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((transform.rotation * Math.PI) / 180)
      ctx.scale(transform.scale, transform.scale)
      ctx.translate(-img.width / 2, -img.height / 2)
      
      // Draw image
      ctx.drawImage(img, 0, 0)

      // Convert to blob and then to file
      canvas.toBlob((blob) => {
        if (blob && imageFile) {
          const editedFile = new File([blob], imageFile.name, { type: imageFile.type })
          onSave(editedFile)
          onClose()
        }
      }, imageFile.type, 0.9)
    }
    img.src = originalImageData
  }

  // Crop functionality
  const applyCrop = () => {
    // This would implement the actual cropping logic
    setCropMode(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-green-600 mt-1">✓ Full image will be preserved - no cropping</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Image Preview Area */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden">
            <div 
              className="w-full h-full flex items-center justify-center cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {originalImageData && (
                <img
                  ref={imageRef}
                  src={originalImageData}
                  alt="Editing"
                  className="max-w-full max-h-full object-contain transition-all duration-200"
                  style={getFilterStyle()}
                  draggable={false}
                />
              )}
            </div>

            {/* Crop overlay */}
            {cropMode && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="border-2 border-white border-dashed bg-transparent"
                     style={{
                       width: `${cropArea.width}px`,
                       height: `${cropArea.height}px`,
                       left: `${cropArea.x}px`,
                       top: `${cropArea.y}px`
                     }}>
                </div>
              </div>
            )}
          </div>

          {/* Tools Panel */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              
              {/* Transform Tools */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Transform</h3>
                <div className="space-y-3">
                  {/* Zoom Controls */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Zoom: {Math.round(transform.scale * 100)}%
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={zoomOut}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Zoom Out"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={transform.scale * 100}
                        onChange={(e) => {
                          const newScale = parseInt(e.target.value) / 100
                          const newTransform = { ...transform, scale: newScale }
                          setTransform(newTransform)
                        }}
                        onMouseUp={() => addToHistory(transform)}
                        className="flex-1"
                      />
                      <button
                        onClick={zoomIn}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Zoom In"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={resetZoom}
                        className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs"
                        title="Reset Zoom"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Rotation Controls */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Rotation: {transform.rotation}°
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={rotateLeft}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Rotate Left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3l3-3-3-3v3z M8 20.4c-1.9-1.1-3.4-2.8-4.2-4.8" />
                        </svg>
                      </button>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={transform.rotation}
                        onChange={(e) => {
                          const newTransform = { ...transform, rotation: parseInt(e.target.value) }
                          setTransform(newTransform)
                        }}
                        onMouseUp={() => addToHistory(transform)}
                        className="flex-1"
                      />
                      <button
                        onClick={rotateRight}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Rotate Right"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v-3l-3 3 3 3v-3z M16 3.6c1.9 1.1 3.4 2.8 4.2 4.8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Brightness: {filters.brightness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.brightness}
                      onChange={(e) => setFilters(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contrast: {filters.contrast}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.contrast}
                      onChange={(e) => setFilters(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Saturation: {filters.saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) => setFilters(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Blur: {filters.blur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={filters.blur}
                      onChange={(e) => setFilters(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCropMode(!cropMode)}
                    className={`p-2 border rounded text-xs transition-colors ${
                      cropMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Crop
                  </button>
                  <button
                    onClick={resetTransforms}
                    className="p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              {/* History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">History</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Redo
                  </button>
                </div>
              </div>

              {/* Fit Options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Image Fit</h3>
                <p className="text-xs text-gray-500 mb-2">Choose how your image should be displayed in product listings:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const newTransform = { ...transform, scale: 1, x: 0, y: 0 }
                      setTransform(newTransform)
                      addToHistory(newTransform)
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-medium">Show Full Image</div>
                    <div className="text-gray-500">Entire image visible (recommended)</div>
                  </button>
                  <button
                    onClick={() => {
                      // Gentle zoom that preserves most of the image
                      const newTransform = { ...transform, scale: 1.2, x: 0, y: 0 }
                      setTransform(newTransform)
                      addToHistory(newTransform)
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-medium">Gentle Zoom</div>
                    <div className="text-gray-500">Slight zoom with minimal cropping</div>
                  </button>
                  <button
                    onClick={() => {
                      // Reset to original size and position
                      const newTransform = { x: 0, y: 0, scale: 1, rotation: 0 }
                      setTransform(newTransform)
                      addToHistory(newTransform)
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-medium">Original Size</div>
                    <div className="text-gray-500">No transformations applied</div>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveEditedImage}
            className="px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
} 