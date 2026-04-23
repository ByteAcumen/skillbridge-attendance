import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200/60 bg-white/80 p-5 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-xl transition-all duration-300 hover:shadow-md hover:shadow-zinc-950/[0.05] hover:border-emerald-200/50',
        className,
      )}
      {...props}
    />
  )
}
