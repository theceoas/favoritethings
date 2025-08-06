'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  onCancel?: () => void
  title: string
  message: string
  type?: 'confirm' | 'alert' | 'success' | 'error' | 'warning'
  confirmText?: string
  cancelText?: string
}

export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'confirm',
  confirmText = 'OK',
  cancelText = 'Cancel'
}: CustomModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0 w-12 h-12 bg-[#6A41A1] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getButtonColors = () => {
    switch (type) {
      case 'error':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
      default:
        return {
          confirm: 'bg-[#6A41A1] hover:bg-[#FFD84D] hover:text-[#6A41A1] text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
    }
  }

  const colors = getButtonColors()

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={type === 'confirm' ? (onCancel || onClose) : onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm px-8 py-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Content */}
          <div className="flex items-start space-x-4">
            {getIcon()}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#4F4032] mb-2">
                {title}
              </h3>
              <p className="text-[#4F4032]/80 text-sm leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            {type === 'confirm' && onConfirm && (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-2xl border border-transparent px-6 py-3 text-sm font-medium transition-all duration-300 shadow-lg hover:scale-105 sm:w-auto"
                style={{ backgroundColor: '#E5E7EB', color: '#374151' }}
                onClick={onCancel || onClose}
              >
                {cancelText}
              </button>
            )}
            
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-2xl border border-transparent px-6 py-3 text-sm font-medium transition-all duration-300 shadow-lg hover:scale-105 sm:w-auto ${colors.confirm}`}
              onClick={() => {
                if (onConfirm) {
                  onConfirm()
                } else {
                  onClose()
                }
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
} 