'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import TextArea from '@/components/elements/TextArea'
import ErrorMessage from '@/components/elements/ErrorMessage'
import ConfirmModal from '@/components/fragments/ConfirmModal'
import ImageListField from '@/components/fragments/ImageListField'
import SearchSelect from '@/components/fragments/SearchSelect'
import { useAdminGroupsQuery } from '@/hooks/use-admin-groups'
import { useGroupDetailQuery } from '@/hooks/use-monitoring'
import { useMissionsQuery } from '@/hooks/use-missions'
import { useCreateManualSubmissionMutation } from '@/hooks/use-manual-submission'
import { AppError } from '@/libs/api'
import { MISSION_TYPE_LABEL } from '@/utils/mission/type-meta'

/**
 * Mengirim bukti misi atas nama sebuah kelompok.
 *
 * Jalur pemulihan, bukan jalur biasa. Di lapangan selalu ada kelompok yang
 * kehilangan buktinya karena sesuatu di luar kendalinya — ponsel mati saat
 * mengunggah, sesi misi keburu tutup padahal mereka sudah mengerjakannya,
 * petugas terlanjur men-check-out sebelum buktinya terkirim. Sebelum ini
 * satu-satunya obatnya adalah menyuntik basis data langsung.
 *
 * Urutannya sengaja bertingkat: kelompok dulu, baru anggotanya, baru misinya.
 * Daftar anggota tidak bisa disusun sebelum kelompoknya dipilih, dan
 * memperlihatkan dua ratus nama sekaligus hanya membuka peluang salah pilih
 * orang dari kelompok yang keliru.
 */
export default function ManualSubmissionForm() {
  const groupsQuery = useAdminGroupsQuery()
  const missionsQuery = useMissionsQuery()

  const [groupId, setGroupId] = useState<string>()
  const [userId, setUserId] = useState<string>()
  const [missionId, setMissionId] = useState<string>()
  const [answerText, setAnswerText] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [approve, setApprove] = useState(false)
  const [awardedPoint, setAwardedPoint] = useState('')
  const [done, setDone] = useState<string | null>(null)

  const detailQuery = useGroupDetailQuery(groupId ?? null)
  const { mutate: submit, isPending, error } = useCreateManualSubmissionMutation()
  const apiError = error as AppError | null

  const mission = missionsQuery.data?.find(m => m.id === missionId)
  const members = detailQuery.data?.members ?? []

  const parsedPoint = Number(awardedPoint)
  const pointValid =
    !approve || (awardedPoint.trim() !== '' && Number.isInteger(parsedPoint) && parsedPoint >= 0)

  const hasEvidence = mediaUrls.length > 0 || answerText.trim() !== ''
  const ready = !!userId && !!missionId && hasEvidence && pointValid

  const reset = () => {
    setUserId(undefined)
    setMissionId(undefined)
    setAnswerText('')
    setMediaUrls([])
    setApprove(false)
    setAwardedPoint('')
  }

  return (
    <div className="space-y-5 rounded-lg border-brut bg-paper-raised p-6 shadow-brutal-sm">
      <div>
        <Label required>
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-ink">
            1
          </span>
          Kelompok
        </Label>
        <SearchSelect
          className="mt-2"
          value={groupId}
          onChange={value => {
            setGroupId(value)
            // Anggota yang terpilih ikut dilepas: ia milik kelompok yang lama,
            // dan membiarkannya berarti bukti tercatat di kelompok yang salah.
            setUserId(undefined)
          }}
          options={(groupsQuery.data ?? []).map(g => ({
            value: g.id,
            label: g.name,
            hint: `${g.memberCount} anggota · ${g.score} poin`,
          }))}
          placeholder="Cari nama kelompok…"
        />
      </div>

      <div>
        <Label required>
          <span
            className={`mr-2 inline-flex size-5 items-center justify-center rounded-full font-mono text-[10px] ${
              groupId ? 'bg-primary text-primary-ink' : 'bg-ink/15 text-ink/45'
            }`}
          >
            2
          </span>
          Atas nama peserta
        </Label>
        {!groupId ? (
          <p className="mt-2 rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/50">
            Pilih kelompoknya dulu.
          </p>
        ) : detailQuery.isLoading ? (
          <p className="mt-2 rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/50">
            Memuat anggota…
          </p>
        ) : (
          <SearchSelect
            className="mt-2"
            value={userId}
            onChange={setUserId}
            options={members.map(m => ({
              value: m.id,
              label: m.fullname,
              hint: m.checkInAt ? 'sudah hadir' : 'belum hadir',
            }))}
            placeholder="Cari nama anggota…"
          />
        )}
        <p className="mt-1 text-xs text-ink/50">
          Buktinya tercatat atas nama peserta ini, bukan atas namamu — itu memang yang terjadi di
          lapangan. Poin tetap masuk ke kelompoknya.
        </p>
      </div>

      <div>
        <Label required>
          <span
            className={`mr-2 inline-flex size-5 items-center justify-center rounded-full font-mono text-[10px] ${
              userId ? 'bg-primary text-primary-ink' : 'bg-ink/15 text-ink/45'
            }`}
          >
            3
          </span>
          Misi
        </Label>
        <SearchSelect
          className="mt-2"
          value={missionId}
          onChange={setMissionId}
          options={(missionsQuery.data ?? []).map(m => ({
            value: m.id,
            label: m.title,
            hint: `${MISSION_TYPE_LABEL[m.type]}${m.locationName ? ` · ${m.locationName}` : ''}`,
          }))}
          placeholder="Cari judul misi…"
        />
      </div>

      <div>
        <Label>Bukti (foto)</Label>
        <ImageListField
          className="mt-2"
          value={mediaUrls}
          onChange={setMediaUrls}
          label="Ketuk untuk pilih foto bukti"
        />
      </div>

      <div>
        <Label>Keterangan</Label>
        <TextArea
          value={answerText}
          onChange={e => setAnswerText(e.target.value)}
          placeholder="Mis. bukti dikirim lewat WhatsApp karena aplikasi error saat unggah"
        />
        <p className="mt-1 text-xs text-ink/50">
          Isi salah satu: foto, keterangan, atau keduanya. Keterangan berguna sebagai jejak alasan
          bukti ini dimasukkan panitia.
        </p>
      </div>

      {/* Dua jalur yang berbeda maksudnya. Menunggu validasi memperlakukan
          buktinya persis seperti kiriman peserta biasa — masuk antrean,
          diperiksa panitia. Langsung disetujui memotong itu, dan dipakai saat
          buktinya sudah diperiksa di luar sistem. */}
      <div className="rounded-md border-brut-sm bg-paper p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-primary)]"
            checked={approve}
            onChange={e => setApprove(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-bold text-ink">Langsung setujui</span>
            <span className="block text-xs text-ink/55">
              Tanpa ini, buktinya masuk antrean Validasi seperti kiriman peserta biasa.
            </span>
          </span>
        </label>

        {approve && (
          <div className="mt-3">
            <Label required>Nilai yang diberikan</Label>
            <Input
              className="mt-2 w-40"
              type="number"
              min={0}
              value={awardedPoint}
              onChange={e => setAwardedPoint(e.target.value)}
              error={!pointValid}
              placeholder={mission ? String(mission.pointWeight) : '0'}
            />
            {mission && (
              <p className="mt-1 text-xs text-ink/50">
                Poin bawaan misi ini {mission.pointWeight}
                {mission.pointMin != null && mission.pointMax != null
                  ? ` · rentangnya ${mission.pointMin}–${mission.pointMax}`
                  : ''}
              </p>
            )}
          </div>
        )}
      </div>

      <ErrorMessage message={apiError?.message} />

      <Button
        size="lg"
        className="w-full"
        loading={isPending}
        disabled={!ready}
        onClick={() =>
          submit(
            {
              userId: userId!,
              missionId: missionId!,
              answerText: answerText.trim() || undefined,
              mediaUrls,
              approve,
              awardedPoint: approve ? parsedPoint : undefined,
            },
            {
              onSuccess: res => {
                setDone(res.message)
                reset()
              },
            },
          )
        }
      >
        Kirim Bukti
      </Button>

      <ConfirmModal
        open={!!done}
        title="Bukti tercatat ✓"
        description={<p>{done}</p>}
        confirmLabel="Selesai"
        cancelLabel="Kirim Lagi"
        onConfirm={() => setDone(null)}
        onCancel={() => setDone(null)}
      />
    </div>
  )
}
