'use client'

import Label from '@/components/atoms/Label'
import ErrorMessage from '@/components/atoms/ErrorMessage'

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
    <div className={`flex flex-col gap-2 ${className}`}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {children}
      <ErrorMessage message={error} />
    </div>
  )
}

export default FormField
