'use client'

import SheetExchangePanel from '@/components/fragments/SheetExchangePanel'
import { endpoints } from '@/libs/endpoint'

/**
 * Lembar kerja misi.
 *
 * Rangkaian misi acara disusun panitia di spreadsheet jauh sebelum sistemnya
 * ada — lengkap dengan sesi, lokasi, dan cara penilaiannya. Mengetik ulang
 * lima puluh misi lewat form memakan waktu berjam-jam, dan tiap barisnya satu
 * kesempatan salah ketik.
 */
export default function MissionSheetPanel() {
  return (
    <SheetExchangePanel
      kind="missions"
      title="Lembar Kerja Misi"
      templatePath={endpoints.admin.sheetMissionTemplate}
      exportPath={endpoints.admin.sheetMissions}
      templateFilename="template-misi.xlsx"
      exportFilename="daftar-misi.xlsx"
      description={
        <>
          Susun seluruh misi di Excel, lalu unggah sekali. Misi dicocokkan lewat{' '}
          <strong>Judul</strong> — judul yang sudah ada diperbarui, bukan digandakan. Tipe,
          Kategori, Pembuktian, dan Cara Penilaian ditulis dalam bahasa Indonesia seperti di
          template (mis. &quot;Tantangan&quot;, &quot;Per Satuan&quot;), sedangkan Wajib, Wajib
          Check-in, dan Yel-Yel diisi Ya/Tidak.{' '}
          <strong>Soal kuis tidak ikut lembar ini</strong> — buat misinya di sini, lalu susun
          soalnya lewat tombol Kelola Pertanyaan.
        </>
      }
    />
  )
}
