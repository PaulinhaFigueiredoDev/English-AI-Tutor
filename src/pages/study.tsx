import { MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import tutorAvatar from "@/assets/tutor-avatar.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ONBOARDING_PATH } from "@/lib/onboarding-preference"
import { useModelStatus } from "@/lib/use-model-status"
import { usePageTitle } from "@/lib/use-page-title"
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
  const { status } = useModelStatus()

  return (
    <StudyPage title="Praticar" description="Conversa livre por texto para praticar seu inglês." icon={MessageCircle}>
      <EmptyCard
        visual={<img src={tutorAvatar} alt="" width={64} height={64} className="tutor-avatar" />}
        title="Tutor ainda indisponível"
      >
        {status.state === "ready" ? (
          <p>O modelo está pronto nesta aba. A conversa estará disponível após a integração do chat.</p>
        ) : (
          <>
            <p>Você já pode configurar e testar um modelo local. A conversa entra na etapa do chat.</p>
            <Button asChild variant="outline"><Link to={ONBOARDING_PATH}>Configurar IA local</Link></Button>
          </>
        )}
      </EmptyCard>
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
