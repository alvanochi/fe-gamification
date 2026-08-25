'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import Select from '@/components/elements/Select'
import TextArea from '@/components/elements/TextArea'
import { submissionService } from '@/services/submission.service'
import { MissionQuestionPayload, QuestionType } from '@/types/mission'
import { IMAGE_ACCEPT } from '@/utils/mission/type-meta'

export interface DraftOption {
  optionText: string
  isCorrect: boolean
}

export interface DraftQuestion {
  questionText: string
  imageUrl?: string
  type: QuestionType
  answerKey?: string
  point: number
  options: DraftOption[]
}

export const emptyQuestion = (): DraftQuestion => ({
  questionText: '',
  type: 'PILIHAN_GANDA',
  point: 10,
  options: [
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
  ],
})

/** Soal yang belum lengkap tidak bisa dinilai server, jadi ditahan di sini. */
export const questionsValid = (questions: DraftQuestion[]) =>
  questions.length > 0 &&
  questions.every(q => {
    if (!q.questionText.trim()) return false
    if (q.type === 'ISIAN_SINGKAT') return !!q.answerKey?.trim()
    return q.options.filter(o => o.optionText.trim()).length >= 2 && q.options.some(o => o.isCorrect)
  })

/** Bentuk yang diterima server: pilihan hanya untuk PG, kunci hanya untuk isian. */
export const toQuestionPayload = (questions: DraftQuestion[]): MissionQuestionPayload[] =>
  questions.map(q => ({
    questionText: q.questionText.trim(),
    imageUrl: q.imageUrl,
    type: q.type,
    point: q.point,
    options: q.type === 'PILIHAN_GANDA' ? q.options.filter(o => o.optionText.trim()) : undefined,
    answerKey: q.type === 'ISIAN_SINGKAT' ? q.answerKey : undefined,
  }))

/**
 * Penyusun daftar pertanyaan misi kuis.
 *
 * Dipakai dua tempat sekaligus: saat misi kuis dibuat, dan saat daftar soalnya
 * disunting belakangan. Keduanya menyusun hal yang sama persis, jadi layarnya
 * pun satu — memisahkannya dulu berarti dua tempat yang harus diperbaiki
 * setiap kali bentuk soal berubah.
 *
 * Kunci jawaban ditetapkan di sini dan hanya dibaca server saat memeriksa —
 * peserta tidak pernah menerimanya.
 */
export default function QuestionsBuilder({
  questions,
  onChange,
}: {
  questions: DraftQuestion[]
  onChange: (questions: DraftQuestion[]) => void
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const patch = (index: number, changes: Partial<DraftQuestion>) =>
    onChange(questions.map((q, i) => (i === index ? { ...q, ...changes } : q)))

  const patchOption = (qIndex: number, oIndex: number, changes: Partial<DraftOption>) =>
    onChange(
      questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIndex
                  ? { ...o, ...changes }
                  : // Hanya satu jawaban benar per pertanyaan.
                    changes.isCorrect
                    ? { ...o, isCorrect: false }
                    : o,
              ),
            }
          : q,
      ),
    )

  const handlePickImage = async (index: number, file: File) => {
    setUploadingIndex(index)
    try {
      patch(index, { imageUrl: await submissionService.uploadEvidence(file) })
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div className="space-y-5">
      {questions.map((question, index) => (
        <div key={index} className="space-y-4 rounded-md border-brut bg-paper p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
              Pertanyaan {index + 1}
            </p>
            {questions.length > 1 && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onChange(questions.filter((_, i) => i !== index))}
              >
                Hapus
              </Button>
            )}
          </div>

          <div>
            <Label required>Pertanyaan</Label>
            <TextArea
              value={question.questionText}
              onChange={e => patch(index, { questionText: e.target.value })}
              placeholder="Misal: Apa nama tanaman pada foto berikut?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Bentuk Jawaban</Label>
              <Select
                value={question.type}
                onChange={e => patch(index, { type: e.target.value as QuestionType })}
              >
                <option value="PILIHAN_GANDA">Pilihan ganda</option>
                <option value="ISIAN_SINGKAT">Isian singkat</option>
              </Select>
            </div>
            <div>
              <Label required>Poin</Label>
              <Input
                type="number"
                min={0}
                value={question.point}
                onChange={e => patch(index, { point: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Gambar Pendukung (opsional)</Label>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              className="w-full text-xs text-ink/70"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handlePickImage(index, file)
              }}
            />
            {uploadingIndex === index && <p className="mt-1 text-xs text-ink/50">Mengunggah gambar…</p>}
            {question.imageUrl && uploadingIndex !== index && (
              <p className="mt-1 text-xs font-bold text-success">Gambar tersimpan</p>
            )}
          </div>

          {question.type === 'PILIHAN_GANDA' ? (
            <div>
              <Label required>Pilihan Jawaban</Label>
              <p className="mb-2 text-xs text-ink/50">Tandai lingkaran pada jawaban yang benar.</p>
              <ul className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <li key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect}
                      onChange={() => patchOption(index, oIndex, { isCorrect: true })}
                      className="h-4 w-4 shrink-0"
                    />
                    <Input
                      value={option.optionText}
                      onChange={e => patchOption(index, oIndex, { optionText: e.target.value })}
                      placeholder={`Pilihan ${oIndex + 1}`}
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          patch(index, { options: question.options.filter((_, j) => j !== oIndex) })
                        }
                        className="shrink-0 px-2 font-bold text-danger"
                        aria-label="Hapus pilihan"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  patch(index, {
                    options: [...question.options, { optionText: '', isCorrect: false }],
                  })
                }
              >
                Tambah Pilihan
              </Button>
            </div>
          ) : (
            <div>
              <Label required>Kunci Jawaban</Label>
              <Input
                value={question.answerKey ?? ''}
                onChange={e => patch(index, { answerKey: e.target.value })}
                placeholder="Misal: Jahe"
              />
              <p className="mt-1 text-xs text-ink/50">
                Perbandingan mengabaikan besar-kecil huruf dan spasi berlebih.
              </p>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...questions, emptyQuestion()])}
      >
        Tambah Pertanyaan
      </Button>

      {!questionsValid(questions) && (
        <p className="text-xs font-bold text-ink/50">
          Lengkapi teks pertanyaan, dan pastikan tiap pilihan ganda punya minimal 2 pilihan dengan
          satu jawaban benar.
        </p>
      )}
    </div>
  )
}
