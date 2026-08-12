'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useSponsorsQuery } from '@/hooks/use-sponsors'

export default function SponsorUmkmMarqueeSection() {
  const ref = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { data: sponsors, isLoading } = useSponsorsQuery()

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

  if (!isLoading && (!sponsors || sponsors.length === 0)) return null

  const doubled = sponsors ? [...sponsors, ...sponsors] : []

  return (
    <section id="sponsor" ref={ref} className="overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Didukung UMKM Lokal
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-5xl">MITRA &amp; SPONSOR</h2>
      </div>

      <div className="mt-12 flex w-max" ref={trackRef}>
        {doubled.map((sponsor, i) => (
          <div
            key={`${sponsor.id}-${i}`}
            className="mx-4 flex w-52 flex-shrink-0 -rotate-2 flex-col items-center gap-3 rounded-sm
              border-brut bg-paper-raised p-3 pb-5 shadow-brutal-sm even:rotate-2"
          >
            <div className="flex h-28 w-full items-center justify-center bg-ink/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="text-center text-sm font-bold text-ink">{sponsor.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
