'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Button from '@/components/elements/Button'
import ThemeToggle from '@/components/elements/ThemeToggle'
import { useLenis } from '@/providers/SmoothScrollProvider'

gsap.registerPlugin(ScrollTrigger)

const LINKS = [
  { href: '#cara-kerja', label: 'Cara Kerja' },
  { href: '#misi', label: 'Misi' },
  { href: '#leaderboard', label: 'Leaderboard' },
  { href: '#sponsor', label: 'Sponsor' },
]

export default function StickyNav() {
  const ref = useRef<HTMLElement>(null)
  const lenis = useLenis()

  useGSAP(
    () => {
      if (!ref.current) return
      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: self => {
          ref.current?.classList.toggle('is-compact', self.scroll() > 80)
        },
      })
    },
    { scope: ref },
  )

  const scrollTo = (id: string) => {
    if (lenis) {
      lenis.scrollTo(id, { offset: -88 })
    } else {
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      ref={ref}
      className="sticky top-0 z-50 border-b-[3px] border-ink bg-paper/95 backdrop-blur transition-[padding] duration-200
        py-4 [&.is-compact]:py-2"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
        <a
          href="#"
          onClick={e => {
            e.preventDefault()
            scrollTo('#top')
          }}
          className="font-display text-lg text-ink whitespace-nowrap"
        >
          MILLIONAIRE&nbsp;RACE
        </a>

        <ul className="hidden md:flex items-center gap-6 font-bold text-sm uppercase tracking-wide text-ink/80">
          {LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={e => {
                  e.preventDefault()
                  scrollTo(link.href)
                }}
                className="hover:text-secondary transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            size="sm"
            variant="primary"
            onClick={() => scrollTo('#daftar')}
            className="hidden sm:inline-flex"
          >
            Daftar
          </Button>
        </div>
      </div>
    </nav>
  )
}
