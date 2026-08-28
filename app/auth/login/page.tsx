import type { Metadata } from 'next'
import AuthCard from '@/components/fragments/AuthCard'
import NameLoginForm from '@/components/organisms/NameLoginForm'

export const metadata: Metadata = {
  title: 'Masuk Admin — MMBC Race',
}

/**
 * Layar masuk panitia.
 *
 * Sama seperti peserta, panitia pun tidak menghafal email yang dibuatkan
 * untuknya — jadi jalan masuknya juga lewat nama sendiri, dibuktikan dengan
 * nomor telepon. Daftar namanya hanya berisi akun panitia; peserta tidak akan
 * pernah muncul di sini, dan server menolak perannya walau permintaannya
 * disusun sendiri.
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="MASUK ADMIN"
      subtitle="Cari namamu, lalu masukkan nomor telepon yang terdaftar sebagai panitia."
    >
      <NameLoginForm scope="PANITIA" emptyLabel="nama Anda" />
    </AuthCard>
  )
}
