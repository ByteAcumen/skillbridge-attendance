import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  icon,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
        variant === 'primary' &&
          'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 focus-visible:outline-emerald-600',
        variant === 'secondary' &&
          'border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-500',
        variant === 'ghost' &&
          'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-500',
        variant === 'danger' &&
          'bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:bg-rose-700 focus-visible:outline-rose-600',
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
