'use client'

import { FieldValues, Path, UseFormRegister, RegisterOptions } from 'react-hook-form'
import Input from '@/components/atoms/Input'
import FormField from './FormField'

type FormInputProps<TFieldValues extends FieldValues> = {
  label: string
  name: Path<TFieldValues>
  register: UseFormRegister<TFieldValues>
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>
  error?: string
  required?: boolean
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>

export function FormInput<TFieldValues extends FieldValues>({
  label,
  name,
  register,
  rules,
  error,
  required,
  className,
  ...props
}: FormInputProps<TFieldValues>) {
  return (
    <FormField label={label} name={name} required={required} error={error} className={className}>
      <Input id={name} error={!!error} {...register(name, rules)} {...props} />
    </FormField>
  )
}
