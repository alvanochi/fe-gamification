'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import SponsorLogo from '@/components/fragments/SponsorLogo'
import { useSponsorsQuery } from '@/hooks/use-sponsors'

export default function SponsorUmkmMarqueeSection() {
  const ref = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { data: sponsors, isLoading, isError } = useSponsorsQuery()

  useGSAP(
    () => {
      if (!trackRef.current || !sponsors?.length) return
      const tween = gsap.to(trackRef.current, {
        xPercent: -50,
        ease: 'none',
        duration: 22,
        repeat: -1,
      })

      const el = ref.current
      const pause = () => tween.pause()
      const resume = () => tween.resume()
      el?.addEventListener('mouseenter', pause)
      el?.addEventListener('mouseleave', resume)

      return () => {
        el?.removeEventListener('mouseenter', pause)
        el?.removeEventListener('mouseleave', resume)
      }
    },
    // Animasi baru dipasang setelah data datang, karena lebar track bergantung
    // pada jumlah logo yang benar-benar dirender.
    { scope: ref, dependencies: [sponsors?.length] },
  )

  // Seksi ini tidak boleh menghilang. Navigasi menjanjikan tautan "#sponsor"
  // secara permanen, jadi ketika daftarnya kosong — atau gagal dimuat, mis.
  // saat API sedang tidak terjangkau — yang dulu terjadi adalah tautan itu
  // menggulir ke tempat yang tidak ada. Judulnya selalu dirender; hanya isinya
  // yang berubah.
  const hasSponsors = !!sponsors?.length
  const doubled = hasSponsors ? [...sponsors, ...sponsors] : []

  return (
    <section id="sponsor" ref={ref} className="scroll-mt-24 overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Didukung UMKM Lokal
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-5xl">MITRA &amp; SPONSOR</h2>
      </div>

      {hasSponsors ? (
        <div className="mt-12 flex w-max" ref={trackRef}>
          {doubled.map((sponsor, i) => (
            <div
              key={`${sponsor.id}-${i}`}
              className="mx-4 flex w-52 flex-shrink-0 -rotate-2 flex-col items-center gap-3 rounded-sm
                border-brut bg-paper-raised p-3 pb-5 shadow-brutal-sm even:rotate-2"
            >
              {/* Alas putih, bukan bg-ink/5: hampir semua logo berupa PNG gelap
                  beralas tembus pandang, dan di mode gelap ia lenyap. */}
              <div className="flex h-28 w-full items-center justify-center rounded-sm bg-white p-3">
                <SponsorLogo
                  src={sponsor.logoUrl}
                  name={sponsor.name}
                  className="max-h-full max-w-full"
                />
              </div>
              <p className="text-center text-sm font-bold text-ink">{sponsor.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <p className="rounded-md border-brut border-dashed bg-paper-raised px-6 py-10 text-center text-sm text-ink/55">
            {isLoading
              ? 'Memuat daftar mitra…'
              : isError
                ? 'Daftar mitra belum bisa dimuat. Coba muat ulang halaman.'
                : 'Daftar mitra & sponsor akan tampil di sini.'}
          </p>
        </div>
      )}
    </section>
  )
}
