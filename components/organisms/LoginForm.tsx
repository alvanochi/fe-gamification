'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/elements/Button'
import { FormInput } from '@/components/fragments/FormInput'
import { AppError } from '@/libs/api'
import { loginSchema, LoginFormValues } from '@/schema/auth.schema'
import { useLoginMutation } from '@/hooks/use-auth'

const LoginForm = () => {
  const { mutate: login, isPending, error } = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (values: LoginFormValues) => {
    login(values)
  }

  const apiError = error as AppError | null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError?.message && (
        <div className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger shadow-brutal-sm">
          {apiError.message}
        </div>
      )}

      <FormInput<LoginFormValues>
        label="Email"
        name="email"
        type="email"
        placeholder="contoh@email.com"
        register={register}
        error={errors.email?.message}
        required
      />

      <FormInput<LoginFormValues>
        label="Nomor Telepon"
        name="phoneNumber"
        type="tel"
        placeholder="08xxxxxxxxxx"
        register={register}
        error={errors.phoneNumber?.message}
        required
      />

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Masuk
      </Button>
    </form>
  )
}

export default LoginForm
