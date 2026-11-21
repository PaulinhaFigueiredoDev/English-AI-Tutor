import { BookOpen, MessageCircle } from "lucide-react"
import { useEffect, useId, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { MultipleChoiceExercise } from "@/domain/lesson"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { firstLesson } from "@/services/lesson-service"
import { summarizeLesson } from "@/services/progress-service"
import { StudyPage } from "@/pages/study"

function ExerciseForm({ exercise }: { exercise: MultipleChoiceExercise }) {
  const { progress, loading, answer } = useLessonProgress()
  const legend = useId()
  const [selected, setSelected] = useState<number>()
  const [saving, setSaving] = useState(false)
  const lastAttempt = progress?.attempts.filter((attempt) => attempt.exerciseId === exercise.id).at(-1)
  const correct = lastAttempt?.correct === true
  const selection = correct ? lastAttempt.selectedOptionIndex : selected ?? lastAttempt?.selectedOptionIndex
  const disabled = loading || saving || correct || selection === undefined

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    setSaving(true)
    try {
      await answer(exercise, selection)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card aria-labelledby={legend}>
      <form onSubmit={submit} className="flow-stack">
        <fieldset disabled={loading || saving || correct} className="min-w-0">
          <legend id={legend} className="mb-3 font-semibold">{exercise.promptPt}</legend>
          <div className="grid gap-2">
            {exercise.options.map((option, index) => (
              <label key={index} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 has-checked:border-lavender has-checked:bg-accent">
                <input
                  type="radio"
                  name={legend}
                  value={index}
                  checked={selection === index}
                  onChange={() => setSelected(index)}
                  className="size-4 shrink-0 accent-lavender"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        <p role="status" className={correct ? "text-sm text-lavender" : "text-sm text-muted-foreground"}>
          {lastAttempt && (correct ? `Correto! ${exercise.feedbackPt}` : `Resposta incorreta. ${exercise.feedbackPt} Tente novamente.`)}
        </p>
        <div>
          <Button type="submit" aria-disabled={disabled} className="aria-disabled:opacity-60">
            {correct ? "Exercício concluído" : "Conferir resposta"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function LessonPage() {
  const { loading, progress, start, storageUnavailable } = useLessonProgress()

  useEffect(() => {
    if (!loading && !progress) void start()
  }, [loading, progress, start])

  const lesson = firstLesson
  if (!lesson) {
    return (
      <StudyPage title="Aula indisponível" description="O conteúdo desta aula não pôde ser carregado.">
        <div><Button asChild variant="outline"><Link to="/">Voltar à trilha</Link></Button></div>
      </StudyPage>
    )
  }

  const summary = summarizeLesson(lesson, progress)

  return (
    <StudyPage title={lesson.title} description="Unidade 1 · Aula 1">
      {storageUnavailable && (
        <p role="status" className="rounded-xl border border-border bg-card p-4 text-muted-foreground">
          O navegador não conseguiu salvar seu progresso. Você pode estudar nesta aba, mas perderá o avanço se recarregar a página.
        </p>
      )}

      <Card aria-labelledby="lesson-objectives" className="flow-stack">
        <h2 id="lesson-objectives" className="section-heading">Objetivos da aula</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </Card>

      <section aria-labelledby="lesson-vocabulary" className="flow-stack">
        <h2 id="lesson-vocabulary" className="section-heading">Vocabulário</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {lesson.vocabulary.map(({ term, translationPt, example }) => (
            <div key={term} className="rounded-2xl border border-border bg-card p-4">
              <dt lang="en" className="font-semibold text-lavender">{term}</dt>
              <dd className="text-muted-foreground">{translationPt}</dd>
              <dd lang="en" className="mt-1 text-sm">{example}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Card aria-labelledby="lesson-grammar" className="flow-stack">
        <h2 id="lesson-grammar" className="section-heading">Como usar</h2>
        {lesson.grammar.map((rule) => (
          <div key={rule.ruleId} className="space-y-2">
            <p className="text-muted-foreground">{rule.explanationPt}</p>
            <ul lang="en" className="flex flex-wrap gap-2">
              {rule.examples.map((example) => <li key={example} className="rounded-lg bg-accent px-3 py-1 text-sm">{example}</li>)}
            </ul>
          </div>
        ))}
      </Card>

      <section aria-labelledby="lesson-exercises" className="flow-stack">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lesson-exercises" className="section-heading">Exercícios</h2>
          <p className="text-sm text-muted-foreground" role="status">
            {loading ? "Carregando progresso…" : `${summary.exercisesCorrect} de ${summary.exerciseCount} corretos`}
          </p>
        </div>
        {lesson.exercises.map((exercise) => <ExerciseForm key={exercise.id} exercise={exercise} />)}
      </section>

      <Card aria-labelledby="lesson-conversation" className="flex items-start gap-4">
        <span className="feature-icon"><MessageCircle size={24} aria-hidden="true" /></span>
        <div className="space-y-1">
          <h2 id="lesson-conversation" className="section-heading">Conversa guiada</h2>
          <p className="text-muted-foreground">{lesson.guidedConversation.goalPt}</p>
          {summary.conversationPending && <p className="text-sm font-medium text-lavender">Pendente até que o tutor esteja disponível.</p>}
        </div>
      </Card>

      <div>
        <Button asChild variant="outline"><Link to="/progresso"><BookOpen size={16} aria-hidden="true" />Ver meu progresso</Link></Button>
      </div>
    </StudyPage>
  )
}
