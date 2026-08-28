'use client'

import { useQuizReviewQuery } from '@/hooks/use-submissions'

/**
 * Jawaban kuis satu kelompok, untuk dibaca panitia sebelum memberi nilai.
 *
 * Pilihan ganda sudah diperiksa sistem — hasilnya ditandai benar/salah di sini
 * hanya sebagai konteks. Yang sebenarnya menunggu adalah isian singkat:
 * pencocokan huruf demi huruf menolak jawaban yang sebenarnya benar, jadi
 * jawaban peserta ditaruh berdampingan dengan kunci jawabannya dan panitia
 * yang memutuskan.
 */
export default function QuizReviewPanel({ submissionId }: { submissionId: string }) {
  const { data, isLoading } = useQuizReviewQuery(submissionId)

  if (isLoading) return <p className="mt-3 text-sm text-ink/55">Memuat jawaban…</p>
  if (!data) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/45">
        Jawaban kelompok
      </p>

      <ul className="space-y-2">
        {data.answers.map(answer => {
          const isEssay = answer.type === 'ISIAN_SINGKAT'

          return (
            <li
              key={answer.questionId}
              className={`rounded-md border-brut-sm px-3 py-2 text-sm ${
                isEssay ? 'bg-warning/10' : 'bg-paper'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold text-ink">
                  {answer.orderNo}. {answer.questionText}
                </p>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink/45">
                  {answer.point} pt · {isEssay ? 'isian singkat' : 'pilihan ganda'}
                </span>
              </div>

              <p className="mt-1 text-ink/80">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                  Jawab:{' '}
                </span>
                {answer.answerText || answer.selectedOptionText || (
                  <span className="text-ink/40">tidak dijawab</span>
                )}
              </p>

              {isEssay ? (
                <p className="mt-0.5 text-ink/60">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                    Kunci:{' '}
                  </span>
                  {answer.answerKey || <span className="text-ink/40">tidak ada</span>}
                </p>
              ) : (
                <p
                  className={`mt-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    answer.isCorrect ? 'text-success' : 'text-danger'
                  }`}
                >
                  {answer.isCorrect ? 'benar · dinilai sistem' : 'salah · dinilai sistem'}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-ink/55">
        Pilihan ganda benar bernilai <strong className="text-ink">{data.autoPoint} poin</strong>.
        Isian singkat menyimpan <strong className="text-ink">{data.manualPoint} poin</strong> lagi —
        tambahkan ke nilai di bawah sesuai jawaban yang kamu terima. Nilai penuh{' '}
        {data.maxPoint} poin.
      </p>
    </div>
  )
}
