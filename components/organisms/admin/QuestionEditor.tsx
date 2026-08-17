'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/elements/Button'
import Input from '@/components/elements/Input'
import Label from '@/components/elements/Label'
import Select from '@/components/elements/Select'
import TextArea from '@/components/elements/TextArea'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useMissionQuestionsQuery, useSetQuestionsMutation } from '@/hooks/use-missions'
import { submissionService } from '@/services/submission.service'
import { AppError } from '@/libs/api'
import { Mission, QuestionType } from '@/types/mission'

interface DraftOption {
  optionText: string
  isCorrect: boolean
}

interface DraftQuestion {
  questionText: string
  imageUrl?: string
  type: QuestionType
  answerKey?: string
  point: number
  options: DraftOption[]
}

const emptyQuestion = (): DraftQuestion => ({
  questionText: '',
  type: 'PILIHAN_GANDA',
  point: 10,
  options: [
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
  ],
})

/**
 * Penyusun daftar pertanyaan untuk misi kuis.
 *
 * Kunci jawaban ditetapkan di sini dan hanya dibaca server saat memeriksa —
 * peserta tidak pernah menerimanya.
 */
export default function QuestionEditor({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const { data: existing, isLoading } = useMissionQuestionsQuery(mission.id)
  const { mutate: save, isPending, error } = useSetQuestionsMutation()
  const apiError = error as AppError | null

  const [questions, setQuestions] = useState<DraftQuestion[]>([])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!existing) return
    // Panitia tidak pernah dipagari lokasi, jadi `locked` selalu false di sini.
    const rows = existing.questions
    setQuestions(
      rows.length
        ? rows.map(q => ({
            questionText: q.questionText,
            imageUrl: q.imageUrl ?? undefined,
            type: q.type,
            answerKey: q.answerKey,
            point: q.point,
            options: q.options.map(o => ({
              optionText: o.optionText,
              isCorrect: !!o.isCorrect,
            })),
          }))
        : [emptyQuestion()],
    )
  }, [existing])

  const patch = (index: number, changes: Partial<DraftQuestion>) =>
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, ...changes } : q)))

  const patchOption = (qIndex: number, oIndex: number, changes: Partial<DraftOption>) =>
    setQuestions(prev =>
      prev.map((q, i) =>
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

  const isValid = questions.every(q => {
    if (!q.questionText.trim()) return false
    if (q.type === 'ISIAN_SINGKAT') return !!q.answerKey?.trim()
    return q.options.filter(o => o.optionText.trim()).length >= 2 && q.options.some(o => o.isCorrect)
  })

  if (isLoading) return <p className="text-sm text-ink/60">Memuat pertanyaan…</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">Pertanyaan — {mission.title}</h3>
          <p className="mt-1 text-sm text-ink/60">
            Jawaban peserta diperiksa otomatis. Poin misi dijumlahkan dari jawaban yang benar.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup
        </Button>
      </div>

      {feedback && (
        <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
          {feedback}
        </div>
      )}

      {questions.map((question, index) => (
        <div key={index} className="space-y-4 rounded-md border-brut bg-paper p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
              Pertanyaan {index + 1}
            </p>
            {questions.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== index))}
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
              accept="image/*"
              className="w-full text-xs text-ink/70"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handlePickImage(index, file)
              }}
            />
            {uploadingIndex === index && (
              <p className="mt-1 text-xs text-ink/50">Mengunggah gambar…</p>
            )}
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
                          patch(index, {
                            options: question.options.filter((_, j) => j !== oIndex),
                          })
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
        variant="secondary"
        size="sm"
        onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
      >
        Tambah Pertanyaan
      </Button>

      <ErrorMessage message={apiError?.message} />

      <Button
        size="lg"
        className="w-full"
        loading={isPending}
        disabled={!isValid}
        onClick={() =>
          save(
            {
              missionId: mission.id,
              questions: questions.map(q => ({
                ...q,
                options: q.type === 'PILIHAN_GANDA'
                  ? q.options.filter(o => o.optionText.trim())
                  : undefined,
                answerKey: q.type === 'ISIAN_SINGKAT' ? q.answerKey : undefined,
              })),
            },
            { onSuccess: () => setFeedback(`${questions.length} pertanyaan tersimpan.`) },
          )
        }
      >
        Simpan Pertanyaan
      </Button>
      {!isValid && (
        <p className="text-xs font-bold text-ink/50">
          Lengkapi teks pertanyaan, dan pastikan tiap pilihan ganda punya minimal 2 pilihan dengan
          satu jawaban benar.
        </p>
      )}
    </div>
  )
}
