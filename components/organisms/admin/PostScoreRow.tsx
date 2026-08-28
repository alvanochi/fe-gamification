'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import TextArea from '@/components/elements/TextArea'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useSubmitFieldResultMutation } from '@/hooks/use-field-results'
import type { PostQueue, PostQueueRow } from '@/hooks/use-post-queue'
import { AppError } from '@/libs/api'
import { formatTime } from '@/utils/format/formatDate'

const jam = (iso: string) => formatTime(iso)

/**
 * Sudah berapa lama kelompok ini di pos, dibanding jatahnya.
 *
 * Dihitung di sini, bukan dengan hitung mundur berdetak: layar petugas sudah
 * menyegarkan dirinya sendiri, dan yang dibutuhkannya bukan angka yang
 * bergerak melainkan penanda "yang ini sudah lewat waktunya". Kelompok yang
 * sudah check-out dibekukan pada lama menginapnya, bukan terus bertambah.
 */
const lamaDiPos = (row: PostQueueRow, durationMinutes: number | null) => {
  if (!durationMinutes) return null

  const mulai = new Date(row.checkedInAt).getTime()
  const akhir = row.checkedOutAt ? new Date(row.checkedOutAt).getTime() : Date.now()
  const menit = Math.floor((akhir - mulai) / 60_000)

  return { menit, lewat: menit > durationMinutes, jatah: durationMinutes }
}

/**
 * Satu kelompok di pos, beserta form penilaiannya.
 *
 * Formnya menyesuaikan cara penilaian misi: hitungan hasil, waktu tempuh, atau
 * nilai penjurian. Petugas memasukkan hasil mentahnya saja — poinnya dihitung
 * server, jadi tidak ada aritmetika yang dikerjakan sambil berdiri di lapangan.
 */
export default function PostScoreRow({
  row,
  mission,
  onScored,
}: {
  row: PostQueueRow
  mission: PostQueue['mission']
  onScored: () => void
}) {
  const submitResult = useSubmitFieldResultMutation()
  const [open, setOpen] = useState(false)
  const [units, setUnits] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [awardedPoint, setAwardedPoint] = useState('')
  const [note, setNote] = useState('')

  const apiError = submitResult.error as AppError | null
  const scored = row.resultStatus !== null
  const durasi = lamaDiPos(row, mission.durationMinutes)

  const ready =
    (mission.scoringMode !== 'PER_UNIT' || units !== '') &&
    (mission.scoringMode !== 'TIME_BASED' || timeSeconds !== '') &&
    (mission.scoringMode !== 'RANGE' || awardedPoint !== '')

  const save = () =>
    submitResult.mutate(
      {
        groupId: row.groupId,
        missionId: mission.id,
        units: units === '' ? undefined : Number(units),
        timeSeconds: timeSeconds === '' ? undefined : Number(timeSeconds),
        awardedPoint: awardedPoint === '' ? undefined : Number(awardedPoint),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false)
          onScored()
        },
      },
    )

  return (
    <li className="rounded-md border-brut bg-paper-raised">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{row.groupName}</p>
          <p className="truncate font-mono text-[11px] text-ink/45">
            datang {jam(row.checkedInAt)}
            {row.scannedName ? ` · dari ${row.scannedName}` : ''}
            {row.checkedOutAt ? ` · pergi ${jam(row.checkedOutAt)}` : ''}
          </p>
        </div>

        {durasi && (
          <span
            className={`shrink-0 rounded-full border-brut-sm px-3 py-1 font-mono text-[10px] font-bold uppercase ${
              durasi.lewat ? 'bg-danger text-white' : 'bg-paper text-ink/60'
            }`}
            title={`Jatah ${durasi.jatah} menit sejak check-in`}
          >
            {durasi.lewat ? `lewat ${durasi.menit - durasi.jatah} mnt` : `${durasi.menit}/${durasi.jatah} mnt`}
          </span>
        )}

        {scored ? (
          <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 font-mono text-[10px] uppercase text-success">
            {row.awardedPoint != null ? `${row.awardedPoint} poin` : 'dinilai'}
          </span>
        ) : (
          <Button size="sm" variant={open ? 'ghost' : 'primary'} onClick={() => setOpen(!open)}>
            {open ? 'Tutup' : 'Beri Nilai'}
          </Button>
        )}
      </div>

      {open && !scored && (
        <div className="space-y-3 border-t border-ink/10 px-4 py-4">
          {mission.scoringMode === 'PER_UNIT' && (
            <div>
              <Label required>Jumlah hasil</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={units}
                onChange={e => setUnits(e.target.value)}
                placeholder="mis. 2"
              />
              <p className="mt-1 text-xs text-ink/50">
                {mission.pointPerUnit} poin per hasil
                {mission.maxUnits ? `, dihitung maksimal ${mission.maxUnits}` : ''}
              </p>
            </div>
          )}

          {mission.scoringMode === 'TIME_BASED' && (
            <div>
              <Label required>Waktu tempuh (detik)</Label>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={timeSeconds}
                onChange={e => setTimeSeconds(e.target.value)}
                placeholder="mis. 240"
              />
              <p className="mt-1 text-xs text-ink/50">
                Waktu acuan {mission.timeTargetSeconds} detik untuk poin penuh
              </p>
            </div>
          )}

          {mission.scoringMode === 'RANGE' && (
            <div>
              <Label required>
                Nilai ({mission.pointMin}–{mission.pointMax} poin)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={mission.pointMin ?? 0}
                max={mission.pointMax ?? undefined}
                value={awardedPoint}
                onChange={e => setAwardedPoint(e.target.value)}
              />
            </div>
          )}

          {mission.scoringMode === 'FLAT' && (
            <p className="rounded-md border-brut-sm bg-paper px-3 py-2 text-sm text-ink/65">
              Misi ini bernilai tetap {mission.pointWeight} poin bila berhasil.
            </p>
          )}

          <div>
            <Label>Catatan (opsional)</Label>
            <TextArea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="mis. percobaan kedua"
            />
          </div>

          <Button
            size="sm"
            className="w-full"
            loading={submitResult.isPending}
            disabled={!ready}
            onClick={save}
          >
            Simpan Nilai {row.groupName}
          </Button>
          <ErrorMessage message={apiError?.message} />
        </div>
      )}
    </li>
  )
}
