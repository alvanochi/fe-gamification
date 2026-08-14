import { ClueType, MissionCategory, MissionType, ProofType, ScoringMode } from '@/types/mission'

export const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  TANTANGAN: 'Tantangan',
  BIGGER_BETTER: 'Bigger Better',
  SOAL_LOKASI: 'Soal Lokasi',
  KUIS: 'Kuis',
}

export const MISSION_TYPE_COLOR_VAR: Record<MissionType, string> = {
  TANTANGAN: 'var(--color-tantangan)',
  BIGGER_BETTER: 'var(--color-bigger-better)',
  SOAL_LOKASI: 'var(--color-soal-lokasi)',
  KUIS: 'var(--color-secondary)',
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

interface ScoringShape {
  pointWeight: number
  pointMin: number | null
  pointMax: number | null
  scoringMode?: ScoringMode
  pointPerUnit?: number | null
  maxUnits?: number | null
  timeTargetSeconds?: number | null
}

/** Label poin ringkas untuk lencana di kartu misi. */
export const formatMissionPoints = (mission: ScoringShape) => {
  switch (mission.scoringMode) {
    case 'RANGE':
      return `${mission.pointMin}-${mission.pointMax} pt`
    case 'PER_UNIT':
      return `${mission.pointPerUnit}/hasil`
    case 'TIME_BASED':
      return `≤${mission.pointWeight} pt`
    case 'AUTO_QUIZ':
      return 'Poin per jawaban'
    default:
      // Misi lama yang punya rentang tapi belum bermigrasi ke scoringMode.
      return mission.pointMin != null && mission.pointMax != null
        ? `${mission.pointMin}-${mission.pointMax} pt`
        : `${mission.pointWeight} pt`
  }
}

/** Penjelasan cara penilaian dengan bahasa sehari-hari. */
export const describeScoring = (mission: ScoringShape): string => {
  switch (mission.scoringMode) {
    case 'RANGE':
      return `Dinilai panitia antara ${mission.pointMin}–${mission.pointMax} poin sesuai kualitas hasil`
    case 'PER_UNIT':
      return `${mission.pointPerUnit} poin untuk setiap hasil${
        mission.maxUnits ? `, dihitung maksimal ${mission.maxUnits}` : ''
      }`
    case 'TIME_BASED':
      return `Makin cepat makin tinggi. Poin penuh ${mission.pointWeight} bila selesai dalam ${
        mission.timeTargetSeconds
      } detik`
    case 'AUTO_QUIZ':
      return 'Dinilai otomatis begitu jawaban dikirim'
    default:
      return `${mission.pointWeight} poin bila disetujui panitia`
  }
}

export const SCORING_MODE_LABEL: Record<ScoringMode, string> = {
  FLAT: 'Poin tetap',
  RANGE: 'Rentang (dinilai panitia)',
  PER_UNIT: 'Per satuan hasil',
  TIME_BASED: 'Berdasarkan waktu',
  AUTO_QUIZ: 'Otomatis dari jawaban',
}
