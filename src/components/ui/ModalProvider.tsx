'use client'

import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from './CustomModal'

interface ModalProviderProps {
  children: React.ReactNode
}

export default function ModalProvider({ children }: ModalProviderProps) {
  const { modalState, closeModal } = useCustomModal()

  return (
    <>
      {children}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </>
  )
} 