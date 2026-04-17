import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-vermilion disabled:bg-ink-muted disabled:hover:bg-ink-muted',
  ghost:
    'bg-transparent text-ink-soft hover:text-ink hover:bg-paper-deep',
  subtle:
    'bg-paper-deep text-ink hover:bg-rule',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-11 px-5 text-[13px]',
  lg: 'h-12 px-6 text-[14px]',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-button font-medium uppercase tracking-tight transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  )
}
