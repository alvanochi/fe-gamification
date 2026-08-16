'use client'

import Button from '@/components/elements/Button'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]

/** Navigasi halaman dengan pilihan jumlah baris per halaman. */
export default function Pagination({
  page,
  perPage,
  total,
  totalPages,
  onPageChange,
  onPerPageChange,
}: {
  page: number
  perPage: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}) {
  if (total === 0) return null

  const from = (page - 1) * perPage + 1
  const to = Math.min(total, page * perPage)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-xs text-ink/50">
        {from}–{to} dari {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
          Per halaman
        </label>
        <select
          value={perPage}
          onChange={e => {
            onPerPageChange(Number(e.target.value))
            // Kembali ke halaman pertama: halaman ke-8 bisa jadi tidak ada
            // lagi setelah jumlah baris per halaman diperbesar.
            onPageChange(1)
          }}
          className="rounded-md border-brut-sm bg-paper-raised px-2 py-1 text-sm font-bold text-ink focus:outline-none"
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ←
        </Button>
        <span className="font-mono text-xs text-ink/60">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          →
        </Button>
      </div>
    </div>
  )
}
