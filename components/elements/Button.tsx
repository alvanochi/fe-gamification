'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-ink',
  secondary: 'bg-secondary text-secondary-ink',
  ghost: 'bg-paper-raised text-ink',
  danger: 'bg-danger text-white',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-3.5 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-md border-brut font-display uppercase tracking-wide
          shadow-brutal brutal-press
          disabled:opacity-50 disabled:pointer-events-none
          ${VARIANT_CLASSES[variant]}
          ${SIZE_CLASSES[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
