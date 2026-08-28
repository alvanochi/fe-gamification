'use client'

import SheetExchangePanel from '@/components/fragments/SheetExchangePanel'
import { endpoints } from '@/libs/endpoint'

/**
 * Lembar kerja peserta — satu lembar untuk data peserta sekaligus kelompoknya.
 *
 * Dulu ada dua lembar berisi orang yang sama, dan panitia harus menyunting
 * keduanya lalu menjaga agar keduanya tetap sepakat. Kolom Kelompok kini
 * menempel pada baris pesertanya: mengisinya berarti kelompok itu dibuat dan
 * peserta itu ditempatkan di dalamnya, sekali unggah.
 */
export default function SheetPanel() {
  return (
    <SheetExchangePanel
      kind="accounts"
      title="Lembar Kerja Peserta"
      templatePath={endpoints.admin.sheetAccountTemplate}
      exportPath={endpoints.admin.sheetAccounts}
      templateFilename="template-peserta.xlsx"
      exportFilename="daftar-peserta.xlsx"
      description={
        <>
          Satu lembar untuk peserta sekaligus kelompoknya. Kolom:{' '}
          <strong>Nama, Nomor Telepon, Email, Jenis Kelamin (L/P), Nama Usaha, Kelompok</strong>.
          Baris yang diberi nama kelompok sama menjadi satu kelompok — kelompoknya dibuatkan bila
          belum ada. Peserta dicocokkan lewat nomor telepon, jadi mengunggah ulang berkas yang sama
          memperbarui datanya, bukan menggandakannya.
        </>
      }
    />
  )
}
