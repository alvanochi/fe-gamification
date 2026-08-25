import type { Metadata } from 'next'
import AuthCard from '@/components/fragments/AuthCard'
import LoginForm from '@/components/organisms/LoginForm'

export const metadata: Metadata = {
  title: 'Masuk Admin — Millionaire Race',
}

/**
 * Layar masuk panitia.
 *
 * Peserta tidak melewati halaman ini — mereka masuk lewat kolom nama & nomor
 * telepon di beranda. Karena itu tidak ada lagi tautan pendaftaran mandiri
 * maupun keterangan boarding pass di sini.
 */
export default function LoginPage() {
  return (
    <AuthCard title="MASUK ADMIN">
      <LoginForm />
    </AuthCard>
  )
}
