'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  noPadding?: boolean
}

export default function Modal({ isOpen, onClose, children, noPadding = false }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        
        <div className={noPadding ? '' : 'p-4'}>
          {children}
        </div>
      </div>
    </div>
  )
} 