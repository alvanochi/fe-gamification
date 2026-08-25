import { getLatestSubmissionForMission } from '@/utils/mission/submission-status'
import { Mission, MissionType, Submission } from '@/types/mission'

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

export type MissionStatus = 'BELUM' | 'MENUNGGU' | 'SELESAI'

export const statusOf = (mission: Mission, submissions: Submission[]): MissionStatus => {
  const latest = getLatestSubmissionForMission(submissions, mission.id)
  // Bukti yang ditolak berarti misinya terbuka lagi.
  if (!latest || latest.status === 'REJECTED') return 'BELUM'
  return latest.status === 'APPROVED' ? 'SELESAI' : 'MENUNGGU'
}

export type SectionKey =
  | 'WAJIB'
  | 'YEL_YEL'
  | 'DI_POS'
  | 'MANDIRI'
  | 'MENUNGGU'
  | 'SELESAI'

interface SectionMeta {
  title: string
  hint: string
  accent: string
}

/**
 * Urutan bagian mengikuti apa yang paling mendesak dikerjakan kelompok, bukan
 * urutan misi di database.
 *
 * Dengan tiga puluh misi lebih, daftar datar memaksa peserta membaca semuanya
 * untuk tahu mana yang bisa dikerjakan sekarang. Dipecah begini, yang menahan
 * langkah mereka selalu berada di paling atas.
 */
export const SECTION_META: Record<SectionKey, SectionMeta> = {
  WAJIB: {
    title: 'Kerjakan Dulu',
    hint: 'Misi lain terkunci sampai yang ini disetujui panitia.',
    accent: 'text-danger',
  },
  YEL_YEL: {
    title: 'Yel-Yel',
    hint: 'Ada batas waktunya sendiri — makin cepat makin besar poinnya.',
    accent: 'text-warning',
  },
  DI_POS: {
    title: 'Di Pos Panitia',
    hint: 'Datangi posnya, tunjukkan QR ke petugas, baru kerjakan.',
    accent: 'text-secondary',
  },
  MANDIRI: {
    title: 'Bisa Dikerjakan Sendiri',
    hint: 'Tanpa pos, tanpa antre. Kerjakan kapan saja bersama tim.',
    accent: 'text-ink/60',
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

export const SECTION_ORDER: SectionKey[] = [
  'WAJIB',
  'YEL_YEL',
  'DI_POS',
  'MANDIRI',
  'MENUNGGU',
  'SELESAI',
]

/** Bagian mana yang menampung sebuah misi, dilihat dari keadaannya sekarang. */
export const sectionOf = (mission: Mission, submissions: Submission[]): SectionKey => {
  const status = statusOf(mission, submissions)
  if (status === 'SELESAI') return 'SELESAI'
  if (status === 'MENUNGGU') return 'MENUNGGU'

  if (mission.isMandatory) return 'WAJIB'
  if (mission.isYelYel) return 'YEL_YEL'
  return mission.requiresCheckIn || mission.category === 'TERSTRUKTUR' ? 'DI_POS' : 'MANDIRI'
}

/**
 * Urutkan misi mengikuti urutan bagian lalu tipenya, supaya tiap halaman tetap
 * rapi: satu bagian jarang terpotong dua halaman, dan di dalamnya misi bertipe
 * sama selalu berdampingan.
 */
export const sortBySection = (missions: Mission[], submissions: Submission[]): Mission[] =>
  [...missions].sort((a, b) => {
    const bySection =
      SECTION_ORDER.indexOf(sectionOf(a, submissions)) -
      SECTION_ORDER.indexOf(sectionOf(b, submissions))
    if (bySection !== 0) return bySection

    const byType = MISSION_TYPE_ORDER.indexOf(a.type) - MISSION_TYPE_ORDER.indexOf(b.type)
    return byType !== 0 ? byType : a.title.localeCompare(b.title, 'id')
  })
