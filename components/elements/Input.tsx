'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-md border-brut bg-paper-raised
          font-medium text-ink placeholder:text-ink/40
          transition-all duration-150 ease-in-out
          shadow-brutal-sm focus:shadow-brutal focus:-translate-x-0.5 focus:-translate-y-0.5
          focus:outline-none
          ${error ? '!border-danger shadow-[3px_3px_0_0_var(--color-danger)]' : ''}
          ${className}
        `}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export default Input
