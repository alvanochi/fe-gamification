import { ClueType, MissionCategory, MissionType, ProofType } from '@/types/mission'

export const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  TANTANGAN: 'Tantangan',
  BIGGER_BETTER: 'Bigger Better',
  SOAL_LOKASI: 'Soal Lokasi',
}

export const MISSION_TYPE_COLOR_VAR: Record<MissionType, string> = {
  TANTANGAN: 'var(--color-tantangan)',
  BIGGER_BETTER: 'var(--color-bigger-better)',
  SOAL_LOKASI: 'var(--color-soal-lokasi)',
}

export const MISSION_CATEGORY_LABEL: Record<MissionCategory, string> = {
  TERSTRUKTUR: 'Terstruktur',
  MANDIRI: 'Mandiri',
}

export const CLUE_TYPE_LABEL: Record<ClueType, string> = {
  NONE: 'Tanpa petunjuk',
  TEKS: 'Petunjuk teks',
  MORSE: 'Sandi morse',
  SANDI_ANGKA: 'Sandi angka',
  GPS: 'Titik GPS',
  FOTO: 'Foto lokasi',
  MAP: 'Peta',
}

export const PROOF_TYPE_LABEL: Record<ProofType, string> = {
  FOTO: 'Foto',
  VIDEO: 'Video',
  FOTO_VIDEO: 'Foto & video',
  LINK_SOSMED: 'Link sosial media',
  LAPORAN_PETUGAS: 'Laporan petugas',
  INPUT_HASIL: 'Input hasil',
}

/** `accept` untuk <input type="file"> sesuai bukti yang diminta misi. */
export const PROOF_ACCEPT: Record<ProofType, string> = {
  FOTO: 'image/*',
  VIDEO: 'video/*',
  FOTO_VIDEO: 'image/*,video/*',
  LINK_SOSMED: '',
  LAPORAN_PETUGAS: '',
  INPUT_HASIL: 'image/*',
}

/** Misi yang buktinya bukan unggahan file dari peserta. */
export const isFileProof = (proofType: ProofType) =>
  proofType === 'FOTO' || proofType === 'VIDEO' || proofType === 'FOTO_VIDEO' || proofType === 'INPUT_HASIL'

/** Rentang poin MR6 bila ada, mis. "50 - 100 pt"; selain itu poin tetap. */
export const formatMissionPoints = (mission: {
  pointWeight: number
  pointMin: number | null
  pointMax: number | null
}) =>
  mission.pointMin != null && mission.pointMax != null
    ? `${mission.pointMin}-${mission.pointMax} pt`
    : `${mission.pointWeight} pt`
