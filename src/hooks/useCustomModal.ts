'use client'

import { useState, useCallback } from 'react'

interface ModalOptions {
  title: string
  message: string
  type?: 'confirm' | 'alert' | 'success' | 'error' | 'warning'
  confirmText?: string
  cancelText?: string
}

interface ModalState extends ModalOptions {
  isOpen: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export function useCustomModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  })

  const showModal = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        ...options,
        isOpen: true,
        onConfirm: options.type === 'confirm' ? () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        } : undefined
      })

      // For non-confirm modals, auto-resolve to true when closed
      if (options.type !== 'confirm') {
        setTimeout(() => resolve(true), 0)
      }
    })
  }, [])

  const closeModal = useCallback(() => {
    if (modalState.onCancel) {
      modalState.onCancel()
    } else {
      setModalState(prev => ({ ...prev, isOpen: false }))
    }
  }, [modalState])

  // Convenience methods
  const confirm = useCallback((title: string, message: string, confirmText = 'OK', cancelText = 'Cancel'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const alert = useCallback((title: string, message: string, type: 'alert' | 'success' | 'error' | 'warning' = 'alert'): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'OK',
        onConfirm: undefined
      })
      // Auto-resolve for alerts
      setTimeout(() => resolve(), 0)
    })
  }, [])

  const success = useCallback((title: string, message: string): Promise<void> => {
    return alert(title, message, 'success')
  }, [alert])

  const error = useCallback((title: string, message: string): Promise<void> => {
    return alert(title, message, 'error')
  }, [alert])

  const warning = useCallback((title: string, message: string): Promise<void> => {
    return alert(title, message, 'warning')
  }, [alert])

  return {
    modalState,
    closeModal,
    showModal,
    confirm,
    alert,
    success,
    error,
    warning
  }
} 