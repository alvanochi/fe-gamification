import { MissionBoardStatus, MissionType } from '@/types/mission'

/**
 * Urutan tetap tipe misi, dipakai di layar peserta maupun antrean validasi.
 *
 * Dengan urutan yang sama di mana-mana, panitia yang berpindah antar layar
 * tidak perlu mencari ulang letak tiap kelompok misi.
 */
export const MISSION_TYPE_ORDER: MissionType[] = [
  'TANTANGAN',
  'BIGGER_BETTER',
  'SOAL_LOKASI',
  'KUIS',
]

/** Pecah satu daftar menjadi kelompok per tipe misi, tanpa kelompok kosong. */
export const groupByMissionType = <T>(items: T[], typeOf: (item: T) => MissionType) =>
  MISSION_TYPE_ORDER.map(type => ({ type, items: items.filter(item => typeOf(item) === type) }))
    .filter(group => group.items.length > 0)

/**
 * Bagian-bagian papan misi peserta.
 *
 * Pengelompokannya sengaja memakai kata yang sama persis dengan tombol
 * saringannya: peserta yang menekan "Belum Dikerjakan" menemukan judul yang
 * sama di daftarnya, bukan istilah lain yang harus diterjemahkan sendiri.
 * Keadaan tiap misi dihitung server, jadi hitungannya berlaku untuk seluruh
 * misi — bukan hanya yang kebetulan ada di halaman ini.
 */
export const STATUS_META: Record<MissionBoardStatus, { title: string; hint: string; accent: string }> = {
  BELUM: {
    title: 'Belum Dikerjakan',
    hint: 'Yang masih menunggu giliran tim kalian.',
    accent: 'text-danger',
  },
  MENUNGGU: {
    title: 'Menunggu Validasi',
    hint: 'Bukti sudah masuk. Panitia akan memeriksanya.',
    accent: 'text-warning',
  },
  SELESAI: {
    title: 'Selesai',
    hint: 'Poinnya sudah masuk ke timmu.',
    accent: 'text-success',
  },
}

export const STATUS_ORDER: MissionBoardStatus[] = ['BELUM', 'MENUNGGU', 'SELESAI']
