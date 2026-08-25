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
 * Pertukaran data lewat satu lembar kerja.
 *
 * Dulu ada dua lembar berisi orang yang sama — satu daftar peserta, satu
 * susunan kelompok — dan panitia harus menyunting keduanya lalu menjaga agar
 * keduanya tetap sepakat. Sekarang kolom Kelompok menempel pada baris
 * pesertanya: mengisinya berarti kelompok itu dibuat dan peserta itu
 * ditempatkan di dalamnya, sekali unggah.
 */
export default function SheetPanel() {
  const fileInput = useRef<HTMLInputElement>(null)
  const importSheet = useSheetImportMutation()

  const [result, setResult] = useState<SheetImportResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const error = importSheet.error as AppError | null

  const run = (file?: File) => {
    if (!file) return
    setResult(null)
    setNotice(null)
    importSheet.mutate(file, {
      onSuccess: res => {
        setNotice(res.message)
        setResult(res.data)
      },
      // Memilih berkas yang sama dua kali berturut-turut tidak memicu onChange
      // kalau nilainya tidak dikosongkan — dan mengunggah ulang berkas yang
      // baru saja diperbaiki justru hal yang paling sering dilakukan.
      onSettled: () => {
        if (fileInput.current) fileInput.current.value = ''
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
        Satu lembar untuk peserta sekaligus kelompoknya. Kolom:{' '}
        <strong>Nama, Nomor Telepon, Email, Nama Usaha, Kelompok</strong>. Baris yang diberi nama
        kelompok sama menjadi satu kelompok — kelompoknya dibuatkan bila belum ada. Peserta
        dicocokkan lewat nomor telepon, jadi mengunggah ulang berkas yang sama memperbarui datanya,
        bukan menggandakannya.
      </p>

      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => run(e.target.files?.[0])}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => download(endpoints.admin.sheetAccountTemplate, 'template-peserta.xlsx')}
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
        <Button size="sm" loading={importSheet.isPending} onClick={() => fileInput.current?.click()}>
          Unggah
        </Button>
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
