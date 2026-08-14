'use client'

import { useEffect } from 'react'
import Button from '@/components/elements/Button'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Dialog konfirmasi untuk aksi yang tidak bisa dibatalkan (keluar akun,
 * memilih ketua, menghapus data).
 */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Esc untuk menutup, dan cegah halaman di belakang ikut ter-scroll.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label={cancelLabel}
        disabled={loading}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink/60"
      />

      <div className="relative w-full max-w-sm rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description && <div className="mt-2 text-sm text-ink/70">{description}</div>}

        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
