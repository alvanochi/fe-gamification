'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const MOCK_ROWS = [
  { rank: 1, name: 'Tim Sinar Malioboro', point: 4820, medal: '🥇' },
  { rank: 2, name: 'Tim Barter Jaya', point: 4510, medal: '🥈' },
  { rank: 3, name: 'Tim Loper Koran', point: 4225, medal: '🥉' },
  { rank: 4, name: 'Tim Angkringan Squad', point: 3890, medal: '' },
  { rank: 5, name: 'Tim Prambanan Runners', point: 3650, medal: '' },
]

export default function LeaderboardTeaserSection() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('[data-point]').forEach(el => {
        const target = Number(el.dataset.point)
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: 1.4,
          ease: 'power2.out',
          snap: { value: 1 },
          onUpdate: () => {
            el.textContent = counter.value.toLocaleString('id-ID')
          },
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="leaderboard" ref={ref} className="bg-ink py-24 text-paper">
      <div className="mx-auto max-w-4xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Mode Pit Stop</p>
        <h2 className="mt-2 font-display text-3xl text-paper sm:text-5xl">LEADERBOARD LIVE</h2>
        <p className="mt-3 max-w-lg text-paper/70">
          Poin tantangan, rantai barter, dan engagement media sosial masuk otomatis ke satu papan
          skor. Contoh tampilan pit stop di layar proyektor:
        </p>

        <div className="mt-10 rounded-lg border-brut-lg border-primary bg-[#1f1b16] p-4 shadow-brutal-lg sm:p-6">
          <ul className="divide-y-2 divide-primary/20">
            {MOCK_ROWS.map(row => (
              <li key={row.rank} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="w-8 font-display text-lg text-primary">
                    {row.medal || `#${row.rank}`}
                  </span>
                  <span className="font-bold text-paper">{row.name}</span>
                </div>
                <span className="font-mono text-lg text-primary">
                  <span data-point={row.point}>0</span> pts
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-xs text-paper/50">*Contoh ilustratif — data akan tersambung ke sistem poin sungguhan.</p>
      </div>
    </section>
  )
}
