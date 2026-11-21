import { MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { TutorChat } from "@/components/tutor-chat"
import { Button } from "@/components/ui/button"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { usePageTitle } from "@/lib/use-page-title"
import { useStudyPreferences } from "@/lib/study-preferences"
import { cn } from "@/lib/utils"

export function StudyPage({ title, description, icon: Icon, className, children }: {
  title: string
  description: string
  icon?: LucideIcon
  className?: string
  children: ReactNode
}) {
  usePageTitle(title)

  return (
    <div className={cn("page-stack", className)}>
      <header className="page-intro">
        {Icon && <span className="feature-icon"><Icon size={24} aria-hidden="true" /></span>}
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </div>
  )
}

export function StudyCardHeading({ icon: Icon, id, title, description }: {
  icon: LucideIcon
  id: string
  title: string
  description?: string
}) {
  return (
    <div className="study-card-heading">
      <span className="feature-icon"><Icon size={22} aria-hidden="true" /></span>
      <div>
        <h2 id={id} className="section-heading">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

export function PracticePage() {
  const { preferences } = useStudyPreferences()
  const { resetVersion } = useLessonProgress()

  return (
    <StudyPage title="Praticar" description="Conversa livre por texto para praticar seu inglês." icon={MessageCircle} className="practice-page">
      <TutorChat key={resetVersion} context={{ mode: "free", level: preferences.level }} />
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
