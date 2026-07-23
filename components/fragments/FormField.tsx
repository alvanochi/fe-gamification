'use client'

import Label from '@/components/elements/Label'
import ErrorMessage from '@/components/elements/ErrorMessage'

interface FormFieldProps {
  label: string
  name: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required = false,
  error,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {children}
      <ErrorMessage message={error} />
    </div>
  )
}

export default FormField
