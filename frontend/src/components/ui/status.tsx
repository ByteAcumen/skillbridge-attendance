import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
        tone === 'neutral' && 'bg-zinc-100 text-zinc-700',
        tone === 'good' && 'bg-emerald-50 text-emerald-700',
        tone === 'warn' && 'bg-amber-50 text-amber-700',
        tone === 'danger' && 'bg-rose-50 text-rose-700',
        tone === 'info' && 'bg-sky-50 text-sky-700',
      )}
    >
      {children}
    </span>
  )
}

export function Message({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        tone === 'neutral' && 'border-zinc-200 bg-zinc-50 text-zinc-700',
        tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
        tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-800',
      )}
    >
      {children}
    </div>
  )
}
