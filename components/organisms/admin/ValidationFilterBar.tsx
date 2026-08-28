'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import { Mission } from '@/types/mission'
import { MISSION_TYPE_COLOR_VAR, MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'

interface ValidationFilterBarProps {
  missions: Mission[]
  /** Jumlah bukti yang menunggu per misi, untuk angka di sebelah namanya. */
  pendingByMission: Record<string, number>
  selectedIds: string[]
  onToggle: (missionId: string) => void
  onReplace: (missionIds: string[]) => void
}

/**
 * Pembagian tugas validasi.
 *
 * Empat panitia memvalidasi bersamaan, masing-masing memegang beberapa misi
 * tertentu. Tanpa saringan ini mereka bertiga membuka antrean yang sama,
 * saling mendahului bukti yang sedang dibaca orang lain, dan tetap harus
 * menyisir puluhan kartu untuk menemukan yang menjadi tanggung jawabnya.
 *
 * Pilihannya disimpan di peramban masing-masing, bukan di server: ini
 * pembagian kerja yang bisa berubah di tengah acara — panitia yang antreannya
 * habis tinggal mencentang misi lain untuk membantu, tanpa perlu menunggu
 * Super Admin mengubah apa pun.
 */
export default function ValidationFilterBar({
  missions,
  pendingByMission,
  selectedIds,
  onToggle,
  onReplace,
}: ValidationFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const keyword = search.trim().toLowerCase()
  const visible = keyword
    ? missions.filter(m =>
        `${m.title} ${m.locationName ?? ''} ${MISSION_TYPE_LABEL[m.type]}`
          .toLowerCase()
          .includes(keyword),
      )
    : missions

  // Misi yang dipilih ditampilkan sebagai lencana walau tidak sedang ada
  // buktinya — pembagian tugasnya tetap terbaca saat antreannya kosong.
  const selected = selectedIds
    .map(id => missions.find(m => m.id === id))
    .filter((m): m is Mission => !!m)

  const waitingHere = selectedIds.reduce((sum, id) => sum + (pendingByMission[id] ?? 0), 0)

  return (
    <section className="rounded-lg border-brut bg-paper-raised p-4 shadow-brutal-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
            Misi yang kamu validasi
          </p>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {selected.length === 0
              ? 'Semua misi'
              : `${selected.length} misi · ${waitingHere} menunggu`}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {selected.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => onReplace([])}>
              Tampilkan Semua
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setIsOpen(open => !open)}>
            {isOpen ? 'Tutup' : 'Pilih Misi'}
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map(mission => (
            <li key={mission.id}>
              <button
                type="button"
                onClick={() => onToggle(mission.id)}
                title="Lepas dari daftar tugasmu"
                className="flex items-center gap-2 rounded-full border-brut-sm bg-paper px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink/70 brutal-press-sm"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: MISSION_TYPE_COLOR_VAR[mission.type] }}
                />
                {mission.title}
                {pendingByMission[mission.id] ? ` (${pendingByMission[mission.id]})` : ''}
                <span aria-hidden className="text-ink/40">
                  ✕
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari misi…"
          />

          {/* data-lenis-prevent: tanpa itu gulir di dalam daftar ini diambil
              alih Lenis dan halaman di belakangnya yang ikut bergerak. */}
          <ul
            data-lenis-prevent
            className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-md border-brut bg-paper p-2"
          >
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-sm text-ink/50">
                Tidak ada misi yang cocok.
              </li>
            )}

            {visible.map(mission => {
              const checked = selectedIds.includes(mission.id)
              const waiting = pendingByMission[mission.id] ?? 0

              return (
                <li key={mission.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-paper-raised">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                      checked={checked}
                      onChange={() => onToggle(mission.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{mission.title}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-widest text-ink/45">
                        {MISSION_TYPE_LABEL[mission.type]}
                        {mission.locationName ? ` · ${mission.locationName}` : ''}
                      </span>
                    </span>
                    {waiting > 0 && (
                      <span className="shrink-0 rounded-full border-brut-sm bg-warning px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
                        {waiting}
                      </span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReplace(visible.map(m => m.id))}
            >
              Pilih semua yang tampil
            </Button>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => onReplace([])}>
                Kosongkan pilihan
              </Button>
            )}
          </div>

          <p className="mt-3 text-xs text-ink/50">
            Pilihan ini tersimpan di perangkat ini saja, jadi tiap panitia bisa memegang misinya
            sendiri. Kosongkan untuk kembali melihat seluruh antrean.
          </p>
        </div>
      )}
    </section>
  )
}
