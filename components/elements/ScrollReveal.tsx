'use client'

import { useScrollReveal, ScrollRevealDirection } from '@/hooks/use-scroll-reveal'

interface ScrollRevealProps {
  children: React.ReactNode
  direction?: ScrollRevealDirection
  delay?: number
  stagger?: number
  className?: string
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  stagger = 0.08,
  className = '',
}: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>({ direction, delay, stagger })

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
