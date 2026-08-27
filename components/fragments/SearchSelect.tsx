'use client'

import { useMemo, useState } from 'react'
import Input from '@/components/elements/Input'

export interface SearchSelectOption {
  value: string
  label: string
  /** Baris kecil di bawah label — mis. jenis misi atau nama usaha. */
  hint?: string
}

/**
 * Pemilih dengan pencarian.
 *
 * `<select>` biasa memaksa membaca puluhan baris untuk menemukan satu nama;
 * di daftar misi acara ini isinya sudah lewat lima puluh. Bentuknya sengaja
 * sama dengan kolom pencarian nama di beranda, supaya panitia yang sudah
 * memakai yang satu langsung mengerti yang lain.
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Ketik untuk mencari…',
  emptyLabel = 'Tidak ada',
  className = '',
}: {
  options: SearchSelectOption[]
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  /** Teks pilihan "kosongkan" — mis. "Tidak ada". */
  emptyLabel?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const selected = options.find(o => o.value === value) ?? null

  const matches = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const pool = keyword
      ? options.filter(o => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(keyword))
      : options
    // Daftar panjang dipangkas: yang lebih dari ini tidak dibaca, dicari.
    return pool.slice(0, 30)
  }, [options, query])

  if (selected) {
    return (
      <div
        className={`flex items-center gap-3 rounded-md border-brut bg-primary/15 px-4 py-3 ${className}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{selected.label}</p>
          {selected.hint && <p className="truncate text-xs text-ink/55">{selected.hint}</p>}
        </div>
        <button
          type="button"
          className="shrink-0 font-mono text-xs uppercase text-secondary"
          onClick={() => {
            onChange(undefined)
            setQuery('')
          }}
        >
          Ganti
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />

      <div className="mt-2 overflow-hidden rounded-md border-brut bg-paper">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="block w-full border-b border-ink/10 px-4 py-2.5 text-left text-sm text-ink/55 hover:bg-primary/10"
        >
          {emptyLabel}
        </button>

        {matches.length === 0 ? (
          <p className="px-4 py-3 text-sm text-ink/55">Tidak ada yang cocok.</p>
        ) : (
          // Sama seperti daftar nama di beranda: `data-lenis-prevent` melepas
          // gulirannya dari penggulir halus halaman.
          <ul data-lenis-prevent className="max-h-64 overflow-y-auto overscroll-contain">
            {matches.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setQuery('')
                  }}
                  className="block w-full border-b border-ink/10 px-4 py-3 text-left last:border-b-0 hover:bg-primary/10"
                >
                  <span className="block truncate text-sm font-bold text-ink">{option.label}</span>
                  {option.hint && (
                    <span className="block truncate text-xs text-ink/50">{option.hint}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
