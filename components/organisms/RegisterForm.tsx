'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/elements/Button'
import { FormInput } from '@/components/fragments/FormInput'
import { AppError } from '@/libs/api'
import { registerSchema, RegisterFormValues } from '@/schema/auth.schema'
import { useRegisterMutation } from '@/hooks/use-auth'

const RegisterForm = () => {
  const { mutate: registerUser, isPending, error } = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (values: RegisterFormValues) => {
    registerUser(values)
  }

  const apiError = error as AppError | null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError?.message && (
        <div className="rounded-md border-brut !border-danger bg-paper-raised p-4 text-sm font-bold text-danger shadow-brutal-sm">
          {apiError.message}
        </div>
      )}

      <FormInput<RegisterFormValues>
        label="Nama Lengkap"
        name="fullname"
        type="text"
        placeholder="Nama sesuai KTP"
        register={register}
        error={errors.fullname?.message}
        required
      />

      <FormInput<RegisterFormValues>
        label="Email"
        name="email"
        type="email"
        placeholder="contoh@email.com"
        register={register}
        error={errors.email?.message}
        required
      />

      <FormInput<RegisterFormValues>
        label="Nomor Telepon"
        name="phoneNumber"
        type="tel"
        placeholder="08xxxxxxxxxx"
        register={register}
        error={errors.phoneNumber?.message}
        required
      />

      <FormInput<RegisterFormValues>
        label="Nama Usaha / UMKM"
        name="businessName"
        type="text"
        placeholder="Nama usahamu"
        register={register}
        error={errors.businessName?.message}
        required
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <FormInput<RegisterFormValues>
          label="Akun YouTube"
          name="youtubeAccount"
          type="text"
          placeholder="@channel"
          register={register}
          error={errors.youtubeAccount?.message}
          required
        />

        <FormInput<RegisterFormValues>
          label="Akun Instagram"
          name="instagramAccount"
          type="text"
          placeholder="@akun"
          register={register}
          error={errors.instagramAccount?.message}
          required
        />

        <FormInput<RegisterFormValues>
          label="Akun TikTok"
          name="tiktokAccount"
          type="text"
          placeholder="@akun"
          register={register}
          error={errors.tiktokAccount?.message}
          required
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full" size="lg">
        Daftar Sekarang
      </Button>
    </form>
  )
}

export default RegisterForm
