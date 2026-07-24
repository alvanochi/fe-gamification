import { MissionType } from '@/types/mission'

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
