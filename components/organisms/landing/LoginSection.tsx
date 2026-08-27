'use client'

import NameLoginForm from '@/components/organisms/NameLoginForm'

/**
 * Masuk sebagai peserta, di kaki beranda.
 *
 * Peserta didaftarkan panitia, jadi ia tidak tahu email apa yang dipakaikan
 * untuknya — mencari namanya sendiri jauh lebih mungkin berhasil di tengah
 * lapangan daripada mengingat alamat surel. Nomor telepon yang membuktikan
 * bahwa nama yang dipilih memang dirinya.
 */
export default function LoginSection() {
  return (
    <section
      id="masuk"
      className="scroll-mt-24 border-t-brut bg-scoreboard px-6 py-24 text-scoreboard-ink"
    >
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Garis Start
          </span>
          <span aria-hidden className="h-px w-10 bg-primary" />
        </div>

        <h2 className="mt-3 text-center font-display text-4xl text-scoreboard-ink sm:text-5xl">
          MASUK
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-scoreboard-ink/60">
          Cari namamu, lalu masukkan nomor telepon yang kamu berikan saat didaftarkan panitia.
        </p>

        <div className="mt-8 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
          <NameLoginForm scope="PARTICIPANT" emptyLabel="namamu" />
        </div>
      </div>
    </section>
  )
}
