'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

const FLOATING_SQUARES = [
  { top: '12%', left: '8%', size: 40, rotate: -12, color: 'var(--color-secondary)' },
  { top: '22%', left: '82%', size: 28, rotate: 20, color: 'var(--color-primary)' },
  { top: '68%', left: '12%', size: 34, rotate: 8, color: 'var(--color-ink)' },
  { top: '78%', left: '76%', size: 46, rotate: -18, color: 'var(--color-secondary)' },
  { top: '42%', left: '92%', size: 24, rotate: 30, color: 'var(--color-ink)' },
  { top: '8%', left: '46%', size: 22, rotate: -25, color: 'var(--color-primary)' },
  { top: '88%', left: '40%', size: 32, rotate: 15, color: 'var(--color-ink)' },
]

export default function InteractiveBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      // Seed the initial value in px so GSAP infers the "px" unit for this
      // custom property — without this it defaults to whatever unit was in
      // the JSX (e.g. "%"), silently turning raw clientX/Y pixel numbers
      // into nonsense values like "758%".
      gsap.set(el, { '--x': window.innerWidth / 2 + 'px', '--y': window.innerHeight / 3 + 'px' })

      const setX = gsap.quickTo(el, '--x', { duration: 0.6, ease: 'power3.out' })
      const setY = gsap.quickTo(el, '--y', { duration: 0.6, ease: 'power3.out' })

      const handleMove = (e: PointerEvent) => {
        setX(e.clientX)
        setY(e.clientY)
      }

      window.addEventListener('pointermove', handleMove)

      // Slow, idle drift for each floating square — each on its own
      // duration/delay so they don't all bob in visible unison.
      gsap.utils.toArray<HTMLElement>('[data-float-square]').forEach((square, i) => {
        gsap.to(square, {
          y: '+=24',
          x: i % 2 === 0 ? '+=14' : '-=14',
          rotation: '+=20',
          duration: 5 + (i % 4),
          delay: i * 0.3,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      return () => window.removeEventListener('pointermove', handleMove)
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper"
      style={
        {
          '--x': '50vw',
          '--y': '30vh',
        } as React.CSSProperties
      }
    >
      {/* checkpoint-map dot grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-ink) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* cursor-following spotlight, like a radar highlighting your position on the map */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background:
            'radial-gradient(500px circle at var(--x) var(--y), color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(800px circle at var(--x) var(--y), color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%)',
        }}
      />

      {/* floating ticket/stamp squares, drifting slowly for ambient life */}
      {FLOATING_SQUARES.map((sq, i) => (
        <span
          key={i}
          data-float-square
          className="absolute rounded-sm border-brut-sm opacity-[0.18]"
          style={{
            top: sq.top,
            left: sq.left,
            width: sq.size,
            height: sq.size,
            borderColor: sq.color,
            transform: `rotate(${sq.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
