'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    const focusTimer = window.setTimeout(() => {
      const focusTarget = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])',
      )
      const target = focusTarget ?? panelRef.current
      target?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="animate-fade-up max-h-[min(88svh,720px)] w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-950/5"
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
            {title}
          </h2>
          <button
            aria-label="Close modal"
            className="grid h-9 w-9 place-items-center rounded-md text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(min(88svh,720px)-73px)] overflow-y-auto p-5">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}
