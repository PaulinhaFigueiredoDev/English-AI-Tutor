import { BookOpen, ChartNoAxesColumnIncreasing, MessageCircle, Play } from "lucide-react"
import { Link } from "react-router"

import tutorPortrait from "@/assets/tutor-portrait.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { usePageTitle } from "@/lib/use-page-title"
import { firstLesson, FIRST_LESSON_PATH } from "@/services/lesson-service"
import { summarizeLesson } from "@/services/progress-service"

const studyLinks = [
  { to: "/praticar", label: "Praticar conversação", description: "Converse em inglês e receba explicações em português.", icon: MessageCircle },
  { to: "/progresso", label: "Ver meu progresso", description: "Acompanhe suas aulas e veja o que revisar.", icon: ChartNoAxesColumnIncreasing },
]

export function HomePage() {
  usePageTitle("Início")
  const { progress, loading } = useLessonProgress()
  const summary = firstLesson && summarizeLesson(firstLesson, progress)
  const action = summary?.completed ? "Revisar aula" : progress ? "Continuar aula" : "Começar aula"

  return (
    <div className="page-stack">
      <header className="home-hero">
        <div className="hero-copy">
          <h1>Estudo guiado de <em>inglês com IA</em></h1>
          <p>Aprenda passo a passo com aulas curtas, exercícios e a ajuda de um tutor de IA.</p>
        </div>
        <img
          src={tutorPortrait}
          alt="Tutora virtual de inglês com óculos e fones de ouvido em um estúdio neon"
          width={680}
          height={850}
          fetchPriority="high"
          className="hero-portrait"
        />
      </header>

      <div className="flow-stack">
        <h2 className="section-heading">Sua trilha</h2>
        <Card aria-labelledby="next-lesson" className="lesson-card">
          <span className="feature-icon"><BookOpen size={24} aria-hidden="true" /></span>
          <div className="lesson-details">
            <p className="eyebrow">Unidade 1</p>
            <h3 id="next-lesson">{firstLesson?.title ?? "Aula indisponível"}</h3>
            {firstLesson && <p>Aprenda a cumprimentar, agradecer e se despedir em inglês.</p>}
            {progress && summary && (
              <p>{summary.exercisesCorrect} de {summary.exerciseCount} exercícios corretos</p>
            )}
          </div>
          {!loading && firstLesson && (
            <Button asChild>
              <Link to={FIRST_LESSON_PATH}><Play size={16} aria-hidden="true" />{action}</Link>
            </Button>
          )}
        </Card>
      </div>

      <div className="study-links">
        {studyLinks.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to} className="study-link">
            <span className="feature-icon"><Icon size={21} aria-hidden="true" /></span>
            <span><strong>{label}</strong><span className="study-description">{description}</span></span>
          </Link>
        ))}
      </div>
    </div>
  )
}
