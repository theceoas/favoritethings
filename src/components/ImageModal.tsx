'use client'

import Modal from './Modal'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
}

export default function ImageModal({ isOpen, onClose, imageUrl }: ImageModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} noPadding>
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-[90vw] max-h-[90vh] object-contain"
          style={{ margin: 0 }}
        />
      </div>
    </Modal>
  )
} 