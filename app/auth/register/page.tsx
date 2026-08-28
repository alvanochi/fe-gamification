import Link from 'next/link'
import type { Metadata } from 'next'
import AuthCard from '@/components/fragments/AuthCard'
import RegisterForm from '@/components/organisms/RegisterForm'

export const metadata: Metadata = {
  title: 'Daftar — MMBC Race',
}

export default function RegisterPage() {
  return (
    <AuthCard
      eyebrow="Boarding Pass · Pendaftaran"
      title="DAFTAR SEKARANG"
      subtitle="Isi data diri & akun media sosial UMKM-mu untuk ikut MMBC Race."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="font-bold text-secondary underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
