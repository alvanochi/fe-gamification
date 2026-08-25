'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import QuestionsBuilder, {
  emptyQuestion,
  questionsValid,
  toQuestionPayload,
  type DraftQuestion,
} from '@/components/organisms/admin/QuestionsBuilder'
import { useMissionQuestionsQuery, useSetQuestionsMutation } from '@/hooks/use-missions'
import { AppError } from '@/libs/api'
import { Mission, MissionQuestion } from '@/types/mission'

const toDrafts = (rows: MissionQuestion[]): DraftQuestion[] =>
  rows.length
    ? rows.map(q => ({
        questionText: q.questionText,
        imageUrl: q.imageUrl ?? undefined,
        type: q.type,
        answerKey: q.answerKey,
        point: q.point,
        options: q.options.map(o => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
      }))
    : [emptyQuestion()]

/**
 * Draf soal dipisahkan ke komponen sendiri supaya keadaan awalnya cukup
 * ditetapkan sekali saat dipasang — menyalinnya lewat effect setiap kali data
 * berubah akan menimpa ketikan panitia begitu query menyegarkan dirinya.
 */
function QuestionDraftForm({
  mission,
  initialQuestions,
}: {
  mission: Mission
  initialQuestions: DraftQuestion[]
}) {
  const { mutate: save, isPending, error } = useSetQuestionsMutation()
  const apiError = error as AppError | null

  const [questions, setQuestions] = useState<DraftQuestion[]>(initialQuestions)
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <>
      {feedback && (
        <div className="rounded-md border-brut !border-success bg-paper p-4 text-sm font-bold text-success">
          {feedback}
        </div>
      )}

      <QuestionsBuilder questions={questions} onChange={setQuestions} />

      <ErrorMessage message={apiError?.message} />

      <Button
        size="lg"
        className="w-full"
        loading={isPending}
        disabled={!questionsValid(questions)}
        onClick={() =>
          save(
            { missionId: mission.id, questions: toQuestionPayload(questions) },
            { onSuccess: () => setFeedback(`${questions.length} pertanyaan tersimpan.`) },
          )
        }
      >
        Simpan Pertanyaan
      </Button>
    </>
  )
}

/**
 * Menyunting daftar soal misi kuis yang sudah tersimpan.
 *
 * Soal awalnya disusun bersamaan dengan misinya; layar ini untuk memperbaiki
 * atau menambahnya belakangan, memakai penyusun yang sama persis.
 */
export default function QuestionEditor({
  mission,
  onClose,
}: {
  mission: Mission
  onClose: () => void
}) {
  const { data: existing, isLoading } = useMissionQuestionsQuery(mission.id)

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

      {isLoading || !existing ? (
        <p className="text-sm text-ink/60">Memuat pertanyaan…</p>
      ) : (
        // Panitia tidak pernah dipagari lokasi, jadi `locked` selalu false di sini.
        <QuestionDraftForm mission={mission} initialQuestions={toDrafts(existing.questions)} />
      )}
    </div>
  )
}
