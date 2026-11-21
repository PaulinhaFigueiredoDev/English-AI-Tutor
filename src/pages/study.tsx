import { LaptopMinimal, Trophy } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import tutorAvatar from "@/assets/tutor-avatar.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { usePageTitle } from "@/lib/use-page-title"
import { firstLesson, FIRST_LESSON_PATH } from "@/services/lesson-service"
import { summarizeLesson } from "@/services/progress-service"

export function StudyPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  usePageTitle(title)

  return (
    <div className="page-stack">
      <header className="page-intro">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </div>
  )
}

function EmptyCard({ visual, title, children }: { visual: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="empty-card">
      {visual}
      <h2>{title}</h2>
      {children}
    </Card>
  )
}

export function PracticePage() {
  return (
    <StudyPage title="Praticar" description="Conversa livre por texto para praticar seu inglês.">
      <EmptyCard
        visual={<img src={tutorAvatar} alt="" width={64} height={64} className="tutor-avatar" />}
        title="Tutor ainda indisponível"
      >
        <p>A conversa será habilitada após a integração do modelo de IA local.</p>
        <Button asChild variant="outline"><Link to="/configuracoes">Ver configurações</Link></Button>
      </EmptyCard>
    </StudyPage>
  )
}

export function ProgressPage() {
  const { progress, loading, storageUnavailable } = useLessonProgress()
  const summary = firstLesson && progress && summarizeLesson(firstLesson, progress)

  return (
    <StudyPage title="Progresso" description="Acompanhe suas aulas e descubra o que revisar.">
      {storageUnavailable && <p role="status" className="text-muted-foreground">O progresso desta aba não pôde ser salvo no navegador.</p>}

      {loading ? (
        <p role="status" className="text-muted-foreground">Carregando progresso…</p>
      ) : firstLesson && summary ? (
        <Card aria-labelledby="lesson-progress" className="flow-stack">
          <h2 id="lesson-progress" className="section-heading">{firstLesson.title}</h2>
          <p className="font-medium text-lavender">{summary.completed ? "Aula concluída" : "Aula em andamento"}</p>
          <p className="text-muted-foreground">{summary.exercisesCorrect} de {summary.exerciseCount} exercícios corretos</p>
          {summary.conversationPending && <p className="text-muted-foreground">Conversa guiada pendente</p>}
          <div><Button asChild><Link to={FIRST_LESSON_PATH}>{summary.completed ? "Revisar aula" : "Continuar aula"}</Link></Button></div>
        </Card>
      ) : (
        <EmptyCard
          visual={<span className="feature-icon"><Trophy size={24} aria-hidden="true" /></span>}
          title="Nenhuma aula iniciada"
        >
          <p>Comece pela trilha para acompanhar seu progresso.</p>
          <Button asChild><Link to="/">Ver trilha</Link></Button>
        </EmptyCard>
      )}
    </StudyPage>
  )
}

export function SettingsPage() {
  return (
    <StudyPage title="Configurações" description="Gerencie o modelo de IA e seus dados de estudo.">
      <Card className="settings-card">
        <span className="feature-icon"><LaptopMinimal size={24} aria-hidden="true" /></span>
        <div>
          <h2>Modelo de IA local</h2>
          <p>Nenhum modelo configurado. A seleção e o download ficarão disponíveis após a integração do WebLLM.</p>
        </div>
      </Card>
    </StudyPage>
  )
}

export function NotFoundPage() {
  return (
    <StudyPage title="Página não encontrada" description="Confira o endereço ou volte para a sua trilha de estudo.">
      <div><Button asChild><Link to="/">Voltar ao início</Link></Button></div>
    </StudyPage>
  )
}
