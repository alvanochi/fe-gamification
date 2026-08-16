'use client'

import Link from 'next/link'
import StartScanner from '@/components/organisms/StartScanner'

/**
 * Halaman pemindaian QR tersendiri.
 *
 * Dipisah dari beranda supaya peserta punya satu alamat yang bisa dibuka
 * langsung di lokasi acara, tanpa harus menggulir melewati halaman promosi.
 */
export default function ScanPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-10">
      <Link href="/" className="font-mono text-xs uppercase tracking-widest text-secondary">
        ← Beranda
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-secondary">
        Boarding Pass · Peserta
      </p>
      <h1 className="mt-2 text-center font-display text-3xl text-ink sm:text-4xl">
        PINDAI QR KAMU
      </h1>
      <p className="mt-3 max-w-sm text-center text-sm text-ink/60">
        Arahkan kamera ke QR yang diberikan panitia. Kamu akan langsung masuk ke akunmu — tidak
        perlu mengetik apa pun.
      </p>

      <div className="mt-8 flex w-full max-w-sm justify-center">
        <StartScanner autoStart />
      </div>

      <p className="mt-8 max-w-sm text-center text-xs text-ink/50">
        Belum punya QR? Hubungi panitia di meja registrasi.
      </p>
    </div>
  )
}
