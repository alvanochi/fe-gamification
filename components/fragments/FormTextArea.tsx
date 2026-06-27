'use client'

import { FieldValues, Path, UseFormRegister, RegisterOptions } from 'react-hook-form'
import Textarea from '@/components/atoms/Textarea'
import FormField from './FormField'

type FormTextareaProps<TFieldValues extends FieldValues> = {
  label: string
  name: Path<TFieldValues>
  register: UseFormRegister<TFieldValues>
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>
  error?: string
  required?: boolean
  className?: string
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>

export function FormTextarea<TFieldValues extends FieldValues>({
  label,
  name,
  register,
  rules,
  error,
  required,
  className,
  ...props
}: FormTextareaProps<TFieldValues>) {
  return (
    <FormField label={label} name={name} required={required} error={error} className={className}>
      <Textarea id={name} error={!!error} {...register(name, rules)} {...props} />
    </FormField>
  )
}
