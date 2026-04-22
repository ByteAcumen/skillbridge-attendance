import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export function TextField({ label, hint, className, ...props }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-800">
      <span>{label}</span>
      <input
        className={cn(
          'h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-zinc-500">{hint}</span> : null}
    </label>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Array<{ value: string; label: string }>
}

export function SelectField({ label, options, className, ...props }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-800">
      <span>{label}</span>
      <select
        className={cn(
          'h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
