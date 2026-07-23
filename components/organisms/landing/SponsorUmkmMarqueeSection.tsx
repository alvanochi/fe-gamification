'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

const SPONSORS = [
  'Angkringan Lik Man',
  'Batik Sido Mukti',
  'Bakpia Kurniasari',
  'Kopi Klotok',
  'Silver Kotagede',
  'Gudeg Yu Djum',
]

export default function SponsorUmkmMarqueeSection() {
  const ref = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!trackRef.current) return
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
    { scope: ref },
  )

  const doubled = [...SPONSORS, ...SPONSORS]

  return (
    <section id="sponsor" ref={ref} className="overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Didukung UMKM Lokal
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-5xl">MITRA &amp; SPONSOR</h2>
      </div>

      <div className="mt-12 flex w-max" ref={trackRef}>
        {doubled.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="mx-4 flex w-52 flex-shrink-0 -rotate-2 flex-col items-center gap-3 rounded-sm
              border-brut bg-paper-raised p-3 pb-5 shadow-brutal-sm even:rotate-2"
          >
            <div className="flex h-28 w-full items-center justify-center bg-ink/5 font-display text-xs text-ink/40">
              LOGO
            </div>
            <p className="text-center text-sm font-bold text-ink">{name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
