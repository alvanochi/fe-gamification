'use client'

import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full rounded-md border-brut bg-paper-raised px-4 py-3
          font-medium text-ink
          transition-all duration-150 ease-in-out
          shadow-brutal-sm focus:shadow-brutal focus:-translate-x-0.5 focus:-translate-y-0.5
          focus:outline-none
          ${error ? '!border-danger shadow-[3px_3px_0_0_var(--color-danger)]' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export default Select
