'use client'

import { useState, useSyncExternalStore } from 'react'
import Button from '@/components/elements/Button'
import { useSettingsQuery } from '@/hooks/use-settings'
import { formatTime } from '@/utils/format/formatDate'

const SEEN_KEY = 'announcement-seen-at'

/**
 * Pop-up pengumuman panitia.
 *
 * Muncul sekali per pengumuman: penanda yang disimpan adalah waktu pengumuman,
 * bukan sekadar "sudah pernah dilihat", sehingga pengumuman berikutnya tetap
 * tampil sementara yang lama tidak muncul lagi tiap pindah halaman.
 */
// localStorage adalah sumber di luar React; dibaca lewat useSyncExternalStore
// supaya nilainya konsisten antara render server dan klien tanpa effect.
const noopSubscribe = () => () => {}
const readSeen = () => (typeof window === 'undefined' ? null : localStorage.getItem(SEEN_KEY))

export default function AnnouncementPopup({ enabled = true }: { enabled?: boolean }) {
  const { data } = useSettingsQuery(enabled)
  const stored = useSyncExternalStore(noopSubscribe, readSeen, () => null)
  const [justDismissed, setJustDismissed] = useState<string | null>(null)
  const dismissedAt = justDismissed ?? stored

  const announcedAt = data?.announcedAt ?? null
  const message = data?.announcement

  if (!message || !announcedAt || dismissedAt === announcedAt) return null

  const close = () => {
    localStorage.setItem(SEEN_KEY, announcedAt)
    setJustDismissed(announcedAt)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup pengumuman"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink/70"
      />
      <div className="relative w-full max-w-sm rounded-lg border-brut-lg bg-paper-raised p-6 text-center shadow-brutal-lg">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">
          Pengumuman Panitia
        </p>
        <p className="mt-3 whitespace-pre-line font-display text-xl text-ink">{message}</p>
        <p className="mt-2 text-xs text-ink/45">
          {formatTime(announcedAt)} WIB
        </p>
        <Button size="lg" className="mt-5 w-full" onClick={close}>
          YA, SAYA SIAP!
        </Button>
      </div>
    </div>
  )
}
