'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export type ScrollRevealDirection = 'up' | 'down' | 'left' | 'right' | 'none'

interface UseScrollRevealOptions {
  direction?: ScrollRevealDirection
  distance?: number
  duration?: number
  delay?: number
  stagger?: number
  start?: string
}

const OFFSETS: Record<ScrollRevealDirection, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  direction = 'up',
  distance,
  duration = 0.7,
  delay = 0,
  stagger = 0.08,
  start = 'top 82%',
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const targets = ref.current.hasAttribute('data-reveal-item')
        ? [ref.current]
        : ref.current.querySelectorAll('[data-reveal-item]')
      const els = (targets && (targets as NodeListOf<Element>).length > 0
        ? targets
        : ref.current.children) as NodeListOf<Element> | HTMLCollection

      const offset = OFFSETS[direction]
      const from = {
        opacity: 0,
        x: offset.x !== undefined ? (distance ?? offset.x) : 0,
        y: offset.y !== undefined ? (distance ?? offset.y) : 0,
      }

      gsap.set(els, from)
      gsap.to(els, {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: ref.current,
          start,
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: ref },
  )

  return ref
}
