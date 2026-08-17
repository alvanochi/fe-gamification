'use client'

import { useState } from 'react'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import LocationGate from '@/components/organisms/race/LocationGate'
import { useMissionQuestionsQuery } from '@/hooks/use-missions'
import { useSubmitMissionWithEvidenceMutation } from '@/hooks/use-submissions'
import { AppError } from '@/libs/api'
import { QuestionAnswer, QuizSubmitResult } from '@/types/mission'

/**
 * Misi kuis (MR6 jenis tugas "JAWAB PERTANYAAN").
 *
 * Jawaban diperiksa di server, jadi kunci jawaban tidak pernah sampai ke
 * perangkat peserta. Hasilnya langsung ditampilkan tanpa perlu antre validasi.
 */
export default function QuizForm({ missionId, disabled }: { missionId: string; disabled?: boolean }) {
  const { data, isLoading } = useMissionQuestionsQuery(missionId)
  const { mutate: submit, isPending, error } = useSubmitMissionWithEvidenceMutation()
  const apiError = error as AppError | null

  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
  const [result, setResult] = useState<QuizSubmitResult | null>(null)

  const questions = data?.questions

  if (isLoading) {
    return <p className="mt-4 text-sm text-ink/60">Memuat pertanyaan…</p>
  }

  // Soal misi berpagar koordinat baru terbuka setelah kelompok membuktikan
  // berada di lokasinya — supaya jawaban tidak bisa disiapkan dari rumah.
  if (data?.locked) {
    return <LocationGate missionId={missionId} />
  }

  if (!questions || questions.length === 0) {
    return (
      <p className="mt-4 rounded-md border-brut bg-paper px-4 py-3 text-sm text-ink/60">
        Panitia belum menyiapkan pertanyaan untuk misi ini.
      </p>
    )
  }

  if (result) {
    return (
      <div className="mt-4 rounded-md border-brut !border-success bg-paper px-4 py-4 text-center">
        <p className="font-display text-2xl text-success">
          {result.correctCount}/{result.totalQuestions} benar
        </p>
        <p className="mt-1 text-sm font-bold text-ink/70">{result.point} poin masuk ke timmu!</p>
      </div>
    )
  }

  const answeredCount = questions.filter(q => {
    const a = answers[q.id]
    return a?.selectedOptionId || a?.answerText?.trim()
  }).length
  const allAnswered = answeredCount === questions.length

  const setAnswer = (questionId: string, patch: Partial<QuestionAnswer>) =>
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], ...patch, questionId } }))

  return (
    <div className="mt-4 space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink/45">
        {answeredCount} dari {questions.length} pertanyaan terjawab
      </p>

      {questions.map(question => (
        <div key={question.id} className="rounded-md border-brut bg-paper px-4 py-3">
          <p className="text-sm font-bold text-ink">
            {question.orderNo}. {question.questionText}
            <span className="ml-2 font-mono text-[10px] text-ink/45">{question.point} poin</span>
          </p>

          {question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.imageUrl}
              alt={`Gambar soal ${question.orderNo}`}
              className="mt-2 w-full rounded border-brut-sm"
            />
          )}

          {question.type === 'PILIHAN_GANDA' ? (
            <ul className="mt-3 space-y-2">
              {question.options.map(option => {
                const selected = answers[question.id]?.selectedOptionId === option.id
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setAnswer(question.id, { selectedOptionId: option.id })}
                      className={`w-full rounded-md border-brut-sm px-3 py-2 text-left text-sm font-medium brutal-press-sm ${
                        selected ? 'bg-primary text-primary-ink' : 'bg-paper-raised text-ink'
                      }`}
                    >
                      {option.optionText}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <input
              value={answers[question.id]?.answerText ?? ''}
              disabled={disabled}
              onChange={e => setAnswer(question.id, { answerText: e.target.value })}
              placeholder="Ketik jawabanmu"
              className="mt-3 w-full rounded-md border-brut-sm bg-paper-raised px-3 py-2 text-sm font-medium text-ink focus:outline-none"
            />
          )}
        </div>
      ))}

      <Button
        size="sm"
        className="w-full"
        loading={isPending}
        disabled={disabled || !allAnswered}
        onClick={() =>
          submit(
            { missionId, answers: Object.values(answers) },
            { onSuccess: res => setResult(res.data as QuizSubmitResult) },
          )
        }
      >
        Kirim Jawaban
      </Button>
      {!allAnswered && (
        <p className="text-xs font-bold text-ink/50">Jawab semua pertanyaan sebelum mengirim.</p>
      )}
      <ErrorMessage message={apiError?.message} />
    </div>
  )
}
