import Link from 'next/link'
import type { Metadata } from 'next'
import AuthCard from '@/components/fragments/AuthCard'
import LoginForm from '@/components/organisms/LoginForm'

export const metadata: Metadata = {
  title: 'Masuk — Millionaire Race',
}

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Boarding Pass · Check-in"
      title="MASUK"
      subtitle="Masukkan email & nomor telepon yang kamu daftarkan."
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/auth/register" className="font-bold text-secondary underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
