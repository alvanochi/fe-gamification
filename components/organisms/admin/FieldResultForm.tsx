'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/elements/Button'
import Label from '@/components/elements/Label'
import Input from '@/components/elements/Input'
import Select from '@/components/elements/Select'
import TextArea from '@/components/elements/TextArea'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useAdminGroupsQuery, useSubmitFieldResultMutation } from '@/hooks/use-field-results'
import { useMissionsQuery } from '@/hooks/use-missions'
import { AppError } from '@/libs/api'
import { describeScoring } from '@/utils/mission/type-meta'

/**
 * Form input hasil untuk petugas pos.
 *
 * MR6 menandai beberapa misi dengan pembuktian "LAPORAN PETUGAS" dan "INPUT
 * HASIL YANG DIDAPAT (diawasi oleh petugas pos)". Petugas cukup memasukkan
 * hasil mentahnya — sistem yang menghitung poinnya.
 */
export default function FieldResultForm() {
  const { data: groups } = useAdminGroupsQuery()
  const { data: missions } = useMissionsQuery()
  const { mutate: submitResult, isPending, error } = useSubmitFieldResultMutation()
  const apiError = error as AppError | null

  const [groupId, setGroupId] = useState('')
  const [missionId, setMissionId] = useState('')
  const [units, setUnits] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [awardedPoint, setAwardedPoint] = useState('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const mission = useMemo(
    () => missions?.find(m => m.id === missionId),
    [missions, missionId],
  )

  // Hanya misi yang memang dinilai petugas yang ditawarkan, supaya daftarnya
  // tidak dipenuhi misi mandiri yang buktinya diunggah peserta sendiri.
  const fieldMissions = useMemo(
    () =>
      (missions ?? []).filter(
        m =>
          m.proofType === 'LAPORAN_PETUGAS' ||
          m.proofType === 'INPUT_HASIL' ||
          m.scoringMode === 'PER_UNIT' ||
          m.scoringMode === 'TIME_BASED',
      ),
    [missions],
  )

  const isReady =
    !!groupId &&
    !!mission &&
    (mission.scoringMode !== 'PER_UNIT' || units !== '') &&
    (mission.scoringMode !== 'TIME_BASED' || timeSeconds !== '') &&
    (mission.scoringMode !== 'RANGE' || awardedPoint !== '')

  const handleSubmit = () => {
    setFeedback(null)
    submitResult(
      {
        groupId,
        missionId,
        units: units === '' ? undefined : Number(units),
        timeSeconds: timeSeconds === '' ? undefined : Number(timeSeconds),
        awardedPoint: awardedPoint === '' ? undefined : Number(awardedPoint),
        note: note.trim() || undefined,
      },
      {
        onSuccess: res => {
          setFeedback(res.message)
          setUnits('')
          setTimeSeconds('')
          setAwardedPoint('')
          setNote('')
        },
      },
    )
  }

  return (
    <div className="space-y-5 rounded-lg border-brut-lg bg-paper-raised p-6 shadow-brutal-lg sm:p-8">
      <div>
        <h3 className="font-display text-2xl text-ink">Input Hasil dari Pos</h3>
        <p className="mt-1 text-sm text-ink/60">
          Masukkan hasil mentahnya saja — poin dihitung otomatis sesuai aturan misi.
        </p>
      </div>

      {feedback && (
        <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
          {feedback}
        </div>
      )}

      <div>
        <Label required>Kelompok</Label>
        <Select value={groupId} onChange={e => setGroupId(e.target.value)}>
          <option value="">Pilih kelompok</option>
          {groups?.map(g => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.score} poin)
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label required>Misi</Label>
        <Select value={missionId} onChange={e => setMissionId(e.target.value)}>
          <option value="">Pilih misi</option>
          {fieldMissions.map(m => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
        {mission && (
          <p className="mt-1 text-xs text-ink/55">{describeScoring(mission)}</p>
        )}
        {fieldMissions.length === 0 && (
          <p className="mt-1 text-xs text-ink/50">
            Belum ada misi yang dinilai petugas pos. Atur pembuktian misi ke &quot;Laporan
            Petugas&quot; atau pilih penilaian per satuan/waktu.
          </p>
        )}
      </div>

      {mission?.scoringMode === 'PER_UNIT' && (
        <div>
          <Label required>Jumlah Hasil</Label>
          <Input
            type="number"
            min={0}
            value={units}
            onChange={e => setUnits(e.target.value)}
            placeholder="Misal: 2 anak panah tepat sasaran"
          />
          <p className="mt-1 text-xs text-ink/50">
            {mission.pointPerUnit} poin per hasil
            {mission.maxUnits ? `, dihitung maksimal ${mission.maxUnits}` : ''}
          </p>
        </div>
      )}

      {mission?.scoringMode === 'TIME_BASED' && (
        <div>
          <Label required>Waktu Tempuh (detik)</Label>
          <Input
            type="number"
            min={1}
            value={timeSeconds}
            onChange={e => setTimeSeconds(e.target.value)}
            placeholder="Misal: 240"
          />
          <p className="mt-1 text-xs text-ink/50">
            Waktu acuan {mission.timeTargetSeconds} detik untuk poin penuh
          </p>
        </div>
      )}

      {mission?.scoringMode === 'RANGE' && (
        <div>
          <Label required>Nilai ({mission.pointMin}–{mission.pointMax} poin)</Label>
          <Input
            type="number"
            min={mission.pointMin ?? 0}
            max={mission.pointMax ?? undefined}
            value={awardedPoint}
            onChange={e => setAwardedPoint(e.target.value)}
          />
        </div>
      )}

      <div>
        <Label>Catatan Petugas (opsional)</Label>
        <TextArea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Misal: diawasi oleh petugas pos A"
        />
      </div>

      <Button size="lg" className="w-full" loading={isPending} disabled={!isReady} onClick={handleSubmit}>
        Simpan Hasil
      </Button>
      <ErrorMessage message={apiError?.message} />
    </div>
  )
}
