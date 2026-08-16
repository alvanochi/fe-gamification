'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import StartScanner from '@/components/organisms/StartScanner'

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.15 })

      tl.from('[data-hero-card]', {
        rotate: -6,
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      })
        .from(
          '[data-hero-line]',
          { y: 46, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.7)' },
          '-=0.35',
        )
        .from(
          '[data-hero-stamp]',
          { scale: 0, rotate: -35, opacity: 0, duration: 0.5, ease: 'back.out(3)' },
          '-=0.3',
        )
        .from('[data-hero-cta]', { y: 20, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.2')
    },
    { scope: ref },
  )

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pt-16 pb-24 md:pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div
          data-hero-card
          className="relative rounded-lg border-brut-xl bg-paper-raised px-6 py-12 shadow-brutal-lg
            md:px-16 md:py-20 ticket-notch-b"
        >
          <span
            data-hero-stamp
            className="absolute right-6 top-6 -rotate-[18deg] rounded-full border-brut-lg border-secondary
              px-4 py-3 font-display text-xs text-secondary md:right-12 md:top-10"
          >
            YOGYAKARTA
            <br />
            2026
          </span>

          <p className="max-w-[60%] font-mono text-xs uppercase tracking-[0.3em] text-secondary sm:max-w-none md:text-sm">
            Boarding Pass · Peserta Resmi
          </p>

          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-ink sm:text-6xl md:text-7xl">
            <span data-hero-line className="block">
              KEJAR 30 MISI.
            </span>
            <span data-hero-line className="block text-secondary">
              JELAJAHI JOGJA.
            </span>
            <span data-hero-line className="block">
              NAIK PODIUM.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base text-ink/70 md:text-lg">
            Millionaire Race adalah balapan tantangan nyata antar tim —
            selesaikan misi, dukung UMKM lokal, dan rebut posisi puncak leaderboard.
          </p>

          {/* Peserta didaftarkan panitia sebelum acara, lalu menerima QR cetak.
              Karena itu tidak ada pendaftaran mandiri di sini — cukup pindai.
              Halaman /auth/login & /auth/register tetap ada untuk panitia. */}
          <div className="mt-8 flex flex-wrap gap-4" id="daftar">
            <div data-hero-cta>
              <StartScanner />
            </div>
          </div>
          <p className="mt-3 text-sm text-ink/60">
            Belum punya QR? Hubungi panitia di meja registrasi.
          </p>
        </div>
      </div>
    </section>
  )
}
