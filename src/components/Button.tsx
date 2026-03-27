import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50',
  secondary:
    'border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 active:bg-slate-900 disabled:opacity-50',
  danger:
    'bg-red-900/80 text-red-100 hover:bg-red-800 active:bg-red-950 disabled:opacity-50',
  ghost: 'text-teal-400 hover:text-teal-300 hover:underline disabled:opacity-50',
}

export function Button({
  className = '',
  variant = 'primary',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
