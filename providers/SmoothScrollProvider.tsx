'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface SmoothScrollContextType {
  lenis: Lenis | null
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({ lenis: null })

export const useLenis = () => useContext(SmoothScrollContext).lenis

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useState (not a ref) so setting the instance re-renders and propagates
  // through context — consumers need a live reference, not just a mutable box.
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Lenis touches window/document, so it must be constructed client-side only —
    // never at module scope or in the render body.
    const instance = new Lenis({
      autoRaf: false,
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    // Lenis can only be constructed client-side (it touches window/document),
    // and consumers need the live instance via context, so this initial
    // setState in effect is unavoidable here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance)

    const update = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    instance.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(update)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return (
    <SmoothScrollContext.Provider value={{ lenis }}>{children}</SmoothScrollContext.Provider>
  )
}
