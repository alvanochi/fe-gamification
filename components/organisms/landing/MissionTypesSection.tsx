'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const MISSION_TYPES = [
  {
    code: 'A',
    name: 'Tantangan',
    color: 'var(--color-tantangan)',
    rotate: -4,
    desc: 'Jalankan instruksi, ambil foto/video bukti, panitia verifikasi.',
    tag: 'Foto & Video',
  },
  {
    code: 'B',
    name: 'Bigger Better',
    color: 'var(--color-bigger-better)',
    rotate: 3,
    desc: 'Barter beruntun mulai dari barang kecil — rantai barter dinilai dari langkah terakhir yang lengkap dokumentasinya.',
    tag: 'Rantai Barter',
  },
  {
    code: 'C',
    name: 'Soal Lokasi',
    color: 'var(--color-soal-lokasi)',
    rotate: -2,
    desc: 'Jawab kuis, lalu unggah foto — tombol upload hanya aktif di dalam radius lokasi jawaban (geofencing).',
    tag: 'Geofencing',
  },
]

export default function MissionTypesSection() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('[data-mission-card]').forEach((card, i) => {
        const rotate = Number(card.dataset.restRotate)
        gsap.from(card, {
          y: 60,
          opacity: 0,
          rotate: rotate * 3.5,
          duration: 0.7,
          delay: i * 0.1,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: card,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="misi" ref={ref} className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">3 Tipe Misi</p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-5xl">
          30 MISI, TIGA CARA MAIN
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {MISSION_TYPES.map(mission => (
            <div
              key={mission.code}
              data-mission-card
              data-rest-rotate={mission.rotate}
              style={{ transform: `rotate(${mission.rotate}deg)` }}
              className="relative rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg
                transition-transform duration-200 hover:rotate-0"
            >
              <span
                className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center
                  rounded-full border-brut-lg font-display text-lg text-white shadow-brutal-sm"
                style={{ background: mission.color }}
              >
                {mission.code}
              </span>

              <span
                className="inline-block rounded-sm border-brut-sm px-2 py-0.5 font-mono text-[10px]
                  uppercase tracking-widest"
                style={{ background: mission.color, color: '#fff' }}
              >
                {mission.tag}
              </span>

              <h3 className="mt-4 font-display text-2xl text-ink">{mission.name}</h3>
              <p className="mt-2 text-sm text-ink/70">{mission.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
