'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useSheetImportMutation, type SheetImportResult } from '@/hooks/use-accounts'
import { endpoints } from '@/libs/endpoint'
import { AppError } from '@/libs/api'

/** Unduhan menembak API langsung, membawa token supaya lolos penjaga rute. */
const downloadSheet = async (path: string, filename: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ''
  const token = localStorage.getItem('accessToken')

  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Gagal mengunduh berkas')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Pertukaran data lewat lembar kerja.
 *
 * Daftar peserta acara ini hidup di spreadsheet jauh sebelum sistemnya ada,
 * dan panitia menata pembagian kelompok jauh lebih cepat di sana daripada
 * lewat layar. Panel ini menerima berkasnya apa adanya, dan mengeluarkannya
 * kembali dalam bentuk yang sama.
 */
export default function SheetPanel({ canImportGroups }: { canImportGroups: boolean }) {
  const accountsInput = useRef<HTMLInputElement>(null)
  const groupsInput = useRef<HTMLInputElement>(null)

  const importAccounts = useSheetImportMutation('accounts')
  const importGroups = useSheetImportMutation('groups')

  const [result, setResult] = useState<SheetImportResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const error =
    (importAccounts.error as AppError | null) ?? (importGroups.error as AppError | null)

  const run = (
    mutation: typeof importAccounts,
    file: File | undefined,
    input: HTMLInputElement | null,
  ) => {
    if (!file) return
    setResult(null)
    setNotice(null)
    mutation.mutate(file, {
      onSuccess: res => {
        setNotice(res.message)
        setResult(res.data)
      },
      // Memilih berkas yang sama dua kali berturut-turut tidak memicu onChange
      // kalau nilainya tidak dikosongkan — dan mengunggah ulang berkas yang
      // baru saja diperbaiki justru hal yang paling sering dilakukan.
      onSettled: () => {
        if (input) input.value = ''
      },
    })
  }

  const download = (path: string, filename: string) => {
    setDownloadError(null)
    downloadSheet(path, filename).catch(() =>
      setDownloadError('Gagal mengunduh berkas. Coba lagi.'),
    )
  }

  return (
    <section className="rounded-lg border-brut bg-paper-raised p-5 shadow-brutal-sm">
      <h2 className="font-display text-xl text-ink">Lembar Kerja</h2>
      <p className="mt-1 text-sm text-ink/60">
        Unduh untuk ditata di Excel, lalu unggah kembali. Peserta dicocokkan lewat nomor telepon —
        baris yang nomornya sudah terdaftar diperbarui, bukan digandakan.
      </p>

      <input
        ref={accountsInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => run(importAccounts, e.target.files?.[0], accountsInput.current)}
      />
      <input
        ref={groupsInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => run(importGroups, e.target.files?.[0], groupsInput.current)}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border-brut bg-paper p-4">
          <p className="font-bold text-ink">Daftar Peserta</p>
          <p className="mt-1 text-xs text-ink/55">
            Kolom: Nama, Nomor Telepon, Email, Nama Usaha, Kelompok, Kategori.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                download(endpoints.admin.sheetAccountTemplate, 'template-peserta.xlsx')
              }
            >
              Template
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => download(endpoints.admin.sheetAccounts, 'daftar-peserta.xlsx')}
            >
              Unduh
            </Button>
            <Button
              size="sm"
              loading={importAccounts.isPending}
              onClick={() => accountsInput.current?.click()}
            >
              Unggah
            </Button>
          </div>
        </div>

        <div className="rounded-md border-brut bg-paper p-4">
          <p className="font-bold text-ink">Susunan Kelompok</p>
          <p className="mt-1 text-xs text-ink/55">
            Isi kolom Kelompok pada tiap baris. Jumlah anggota per kelompok mengikuti banyaknya
            baris yang kamu beri nama kelompok sama.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => download(endpoints.admin.sheetGroups, 'susunan-kelompok.xlsx')}
            >
              Unduh
            </Button>
            {canImportGroups && (
              <Button
                size="sm"
                loading={importGroups.isPending}
                onClick={() => groupsInput.current?.click()}
              >
                Unggah
              </Button>
            )}
          </div>
          {!canImportGroups && (
            <p className="mt-2 text-xs text-ink/50">
              Mengunggah susunan kelompok hanya untuk Super Admin.
            </p>
          )}
        </div>
      </div>

      {notice && <p className="mt-4 text-sm font-bold text-success">{notice}</p>}
      <ErrorMessage message={error?.message ?? downloadError ?? undefined} className="mt-3" />

      {result && result.skipped.length > 0 && (
        <div className="mt-4 rounded-md border-brut !border-warning bg-warning/10 p-4">
          <p className="font-bold text-ink">{result.skipped.length} baris dilewati</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            {result.skipped.slice(0, 15).map(row => (
              <li key={`${row.row}-${row.name}`}>
                <span className="font-mono text-xs text-ink/45">baris {row.row}</span>{' '}
                <strong>{row.name}</strong> — {row.reason}
              </li>
            ))}
          </ul>
          {result.skipped.length > 15 && (
            <p className="mt-2 text-xs text-ink/50">
              …dan {result.skipped.length - 15} baris lainnya.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
