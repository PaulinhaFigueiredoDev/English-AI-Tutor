import { BookOpen, LaptopMinimal, Trophy } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import tutorAvatar from "@/assets/tutor-avatar.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { usePageTitle } from "@/lib/use-page-title"

function StudyPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
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
  return (
    <StudyPage title="Progresso" description="Acompanhe suas aulas e descubra o que revisar.">
      <EmptyCard
        visual={<span className="feature-icon"><Trophy size={24} aria-hidden="true" /></span>}
        title="Nenhuma aula concluída"
      >
        <p>Suas aulas e sugestões de revisão aparecerão aqui conforme você estudar.</p>
        <Button asChild><Link to="/">Ver trilha</Link></Button>
      </EmptyCard>
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

export function LessonPage() {
  return (
    <StudyPage title="Cumprimentos e despedidas" description="Unidade 1 · Aula 1">
      <EmptyCard
        visual={<span className="feature-icon"><BookOpen size={24} aria-hidden="true" /></span>}
        title="Aula em preparação"
      >
        <p>O conteúdo e os exercícios serão habilitados na próxima entrega do currículo.</p>
        <Button asChild variant="outline"><Link to="/">Voltar à trilha</Link></Button>
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
