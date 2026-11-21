import { BookOpen, ChartNoAxesColumnIncreasing, Circle, CircleCheck, CircleDot, Flame, Target, TrendingUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Link } from "react-router"

import { ProgressMeter } from "@/components/progress-meter"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { studyLevelLabels, useStudyPreferences } from "@/lib/study-preferences"
import { firstLesson, FIRST_LESSON_PATH } from "@/services/lesson-service"
import { getExercisesToReview, getStudyStreak, summarizeLesson } from "@/services/progress-service"

import { StudyCardHeading, StudyPage } from "./study"

function ProgressStat({ icon: Icon, label, value, description }: {
  icon: LucideIcon
  label: string
  value: string | number
  description?: string
}) {
  return (
    <div className="progress-stat">
      <dt className="text-sm text-muted-foreground">
        <span className="feature-icon"><Icon size={23} aria-hidden="true" /></span>
        {label}
      </dt>
      <dd>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </dd>
    </div>
  )
}

function nextGoal(started: boolean, summary: ReturnType<typeof summarizeLesson>) {
  if (!started) {
    return { description: "Comece pelos exercícios de cumprimentos e despedidas.", action: "Começar aula" }
  }
  if (summary.completed) {
    return { description: "Revise os cumprimentos e as despedidas da Aula 01.", action: "Revisar aula" }
  }
  if (summary.exercisesCorrect < summary.exerciseCount) {
    return { description: "Conclua os exercícios da Aula 01.", action: "Continuar aula" }
  }
  return {
    description: "A conversa guiada é o próximo objetivo. Ela ficará disponível com o chat da tutora.",
    action: "Revisar conteúdo",
  }
}

export function ProgressPage() {
  const { progress, loading, storageUnavailable, savingProgress } = useLessonProgress()
  const { preferences } = useStudyPreferences()
  const lesson = firstLesson
  const summary = lesson && summarizeLesson(lesson, progress)
  const completedLessons = Number(summary?.completed ?? false)
  const streak = getStudyStreak(progress)
  const ProgressIcon = summary?.completed ? CircleCheck : progress ? CircleDot : Circle
  const lessonStatus = summary?.completed ? "Aula concluída" : progress ? "Aula em andamento" : "Ainda não iniciada"
  const goal = summary && nextGoal(Boolean(progress), summary)
  const reviews = lesson ? getExercisesToReview(lesson, progress) : []

  return (
    <StudyPage
      title="Seu progresso em inglês"
      description="Acompanhe sua evolução, veja o que já concluiu e o próximo objetivo."
      icon={ChartNoAxesColumnIncreasing}
      className="progress-page"
    >
      {storageUnavailable && <p role="status" className="text-muted-foreground">O progresso desta aba não pôde ser salvo no navegador.</p>}
      {!savingProgress && !storageUnavailable && (
        <p className="text-sm text-muted-foreground">O salvamento está desativado. Novos avanços ficam nesta aba.</p>
      )}
      {loading ? (
        <p role="status" className="text-muted-foreground">Carregando progresso…</p>
      ) : (
        <>
          <dl className="progress-stats">
            <ProgressStat icon={Target} label="Aulas concluídas" value={completedLessons} />
            <ProgressStat icon={Flame} label="Sequência de estudos" value={`${streak} ${streak === 1 ? "dia" : "dias"}`} />
            <ProgressStat icon={TrendingUp} label="Nível atual" value={studyLevelLabels[preferences.level]} description="Informado no perfil" />
          </dl>

          {lesson && summary && goal ? (
            <div className="study-grid progress-grid">
              <Card aria-labelledby="lesson-progress" className="study-panel">
                <StudyCardHeading icon={BookOpen} id="lesson-progress" title="Seu progresso na trilha" description="Unidade 1 · Cumprimentos" />
                <ProgressMeter
                  label="Aulas concluídas na Unidade 1"
                  value={completedLessons}
                  max={1}
                  valueText={`${completedLessons} de 1 aula concluída`}
                />
                <ul className="grid gap-3">
                  <li className="flex items-start gap-3 border-t border-border pt-4">
                    <ProgressIcon size={22} className="mt-0.5 shrink-0 text-lavender" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="font-semibold">Aula 01 · {lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lessonStatus}</p>
                      {progress && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {summary.exercisesCorrect} de {summary.exerciseCount} exercícios corretos
                        </p>
                      )}
                      {progress && summary.conversationPending && (
                        <p className="mt-1 text-sm text-muted-foreground">Conversa guiada pendente</p>
                      )}
                    </div>
                  </li>
                </ul>
              </Card>
              <Card aria-labelledby="next-study-step" className="study-panel">
                <StudyCardHeading icon={Target} id="next-study-step" title="Próximo objetivo" />
                <p className="text-muted-foreground">{goal.description}</p>
                <Button asChild className="mt-auto"><Link to={FIRST_LESSON_PATH}>{goal.action}</Link></Button>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma aula disponível para acompanhar.</p>
          )}

          {reviews.length > 0 && (
            <Card aria-labelledby="review-topics" className="study-panel">
              <StudyCardHeading icon={BookOpen} id="review-topics" title="O que revisar" description="Sugestões com base nas suas respostas incorretas." />
              <ul className="grid gap-3">
                {reviews.map((exercise) => (
                  <li key={exercise.id} className="border-t border-border pt-3">
                    <h3 className="font-semibold">{exercise.reviewTopicPt ?? exercise.promptPt}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{exercise.feedbackPt}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </StudyPage>
  )
}
