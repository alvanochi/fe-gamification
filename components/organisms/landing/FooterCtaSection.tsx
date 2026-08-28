'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function FooterCtaSection() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-cta-panel]', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      gsap.to('[data-medal]', {
        rotate: 8,
        duration: 1.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    },
    { scope: ref },
  )

  return (
    <footer ref={ref} className="pb-10 pt-4">
      <div className="mx-auto max-w-6xl px-6">
        <div
          data-cta-panel
          className="relative overflow-hidden rounded-lg border-brut-xl bg-ink px-8 py-14 text-center shadow-brutal-lg
            sm:px-16"
          style={{
            backgroundImage:
              'repeating-conic-gradient(var(--color-paper) 0% 25%, var(--color-ink) 0% 50%)',
            backgroundSize: '28px 28px',
            backgroundColor: 'var(--color-ink)',
          }}
        >
          <div className="relative rounded-md border-brut bg-paper-raised px-6 py-10 sm:px-12">
            <span data-medal className="mx-auto mb-4 block w-fit text-6xl">
              🏅
            </span>
            <h2 className="font-display text-3xl text-ink sm:text-5xl">
              GARIS FINISH MENUNGGU
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">
              Cari namamu, masukkan nomor teleponmu, dan langsung mulai bertanding bersama timmu.
            </p>
          </div>
        </div>

        {/* Deretan "Didukung oleh" dilepas dari sini: logo sponsor sudah
            tampil di seksi sponsor tepat di atasnya, jadi mengulanginya di
            bawah garis finish hanya menggandakan hal yang sama. */}

        <div className="mt-10 flex flex-col items-center gap-2 text-center text-sm text-ink/60">
          <p className="font-display text-base text-ink">MMBC Race</p>
          <p>Platform gamifikasi promosi wisata &amp; akselerasi UMKM Yogyakarta.</p>
          <p>#MMBCRace</p>
        </div>
      </div>
    </footer>
  )
}
