import { BookOpen, ChartNoAxesColumnIncreasing, MessageCircle, Play } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const studyLinks = [
  { to: "/praticar", label: "Praticar conversação", description: "Converse em inglês e receba explicações em português.", icon: MessageCircle },
  { to: "/progresso", label: "Ver meu progresso", description: "Acompanhe suas aulas e veja o que revisar.", icon: ChartNoAxesColumnIncreasing },
]

export function HomePage() {
  return (
    <div className="page-stack">
      <header className="home-hero">
        <div className="hero-copy">
          <h1>Estudo guiado de <em>inglês com IA</em></h1>
          <p>Aprenda passo a passo com aulas curtas, exercícios e a ajuda de um tutor de IA.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-grid" />
          <span className="hero-star">✦</span>
          <span className="speech speech-hello"><MessageCircle size={22} />Hello!</span>
          <span className="speech speech-hi">Hi!</span>
        </div>
      </header>

      <div className="flow-stack">
        <h2 className="section-heading">Sua trilha</h2>
        <Card aria-labelledby="next-lesson" className="lesson-card">
          <span className="feature-icon"><BookOpen size={24} aria-hidden="true" /></span>
          <div className="lesson-details">
            <p className="eyebrow">Unidade 1</p>
            <h3 id="next-lesson">Cumprimentos e despedidas</h3>
            <p>Aprenda a cumprimentar, agradecer e se despedir em inglês.</p>
          </div>
          <Button asChild>
            <Link to="/aulas/unit-01-lesson-01"><Play size={16} aria-hidden="true" />Começar aula</Link>
          </Button>
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
