'use client'

import { useRef, useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useSheetImportMutation, type SheetImportResult, type SheetKind } from '@/hooks/use-sheets'
import { AppError } from '@/libs/api'
import { downloadSheet } from '@/utils/download-sheet'

/** Unduhan menembak API langsung, membawa token supaya lolos penjaga rute. */
interface SheetExchangePanelProps {
  kind: SheetKind
  title: string
  description: React.ReactNode
  templatePath: string
  exportPath: string
  templateFilename: string
  exportFilename: string
}

/**
 * Pertukaran data lewat lembar kerja: unduh contoh, unduh isi, unggah kembali.
 *
 * Peserta dan misi memakai panel yang sama persis — yang berbeda hanya alamat
 * dan kalimat penjelasnya. Menyalinnya jadi dua berarti dua tempat yang harus
 * diperbaiki setiap kali cara mengunduhnya berubah.
 */
export default function SheetExchangePanel({
  kind,
  title,
  description,
  templatePath,
  exportPath,
  templateFilename,
  exportFilename,
}: SheetExchangePanelProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const importSheet = useSheetImportMutation(kind)

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
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-1 text-sm text-ink/60">{description}</div>

      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => run(e.target.files?.[0])}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => download(templatePath, templateFilename)}>
          Template
        </Button>
        <Button size="sm" variant="secondary" onClick={() => download(exportPath, exportFilename)}>
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
          {/* Daftar ini memuat dua hal sekaligus: baris yang ditolak dan baris
              yang tersimpan tapi masih menyisakan pekerjaan (misalnya petugas
              yang belum punya akun). Karena itu judulnya "perlu diperiksa",
              bukan "dilewati" — separuhnya sudah masuk. */}
          <p className="font-bold text-ink">{result.skipped.length} baris perlu diperiksa</p>
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
