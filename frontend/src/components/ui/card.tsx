import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03]',
        className,
      )}
      {...props}
    />
  )
}
