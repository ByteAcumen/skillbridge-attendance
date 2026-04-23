'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm bg-transparent p-0 open:animate-in open:fade-in-0 open:zoom-in-95"
    >
      <div className="fixed inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-950/5">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </dialog>
  )
}
