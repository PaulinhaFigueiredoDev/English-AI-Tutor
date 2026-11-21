import { ChartNoAxesColumnIncreasing, GraduationCap, House, MessageCircle, Settings } from "lucide-react"
import { useEffect, useRef } from "react"
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router"

import { hasFinishedOnboarding, ONBOARDING_PATH } from "@/lib/onboarding-preference"
import { useFirstLessonProgress } from "@/lib/use-lesson-progress"
import { HomePage } from "@/pages/home"
import { LessonPage } from "@/pages/lesson"
import { OnboardingPage } from "@/pages/onboarding"
import { ProgressPage } from "@/pages/progress"
import { SettingsPage } from "@/pages/settings"
import { NotFoundPage, PracticePage } from "@/pages/study"
import { FIRST_LESSON_PATH } from "@/services/lesson-service"

const navigation = [
  { to: "/", label: "Início", icon: House },
  { to: "/praticar", label: "Praticar", icon: MessageCircle },
  { to: "/progresso", label: "Progresso", icon: ChartNoAxesColumnIncreasing },
]

function AppLayout() {
  const lessonProgress = useFirstLessonProgress()
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname
      main.current?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="app-header">
        <Link to="/" className="brand" aria-label="English AI Tutor, início">
          <span className="brand-icon"><GraduationCap size={23} aria-hidden="true" /></span>
          <span className="brand-name"><span>English</span>{" "}<span>AI <span className="brand-accent">Tutor</span></span></span>
        </Link>
        <NavLink to="/configuracoes" className="mobile-settings-link" aria-label="Configurações">
          <Settings size={19} aria-hidden="true" />
          <span className="hidden sm:inline">Configurações</span>
        </NavLink>
      </header>

      <nav className="app-nav" aria-label="Navegação principal">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className="nav-link">
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/configuracoes" className="nav-link desktop-settings-link">
          <Settings size={19} aria-hidden="true" />
          <span>Configurações</span>
        </NavLink>
      </nav>

      <main ref={main} id="conteudo" tabIndex={-1} className="app-main">
        <Outlet context={lessonProgress} />
      </main>
    </div>
  )
}

function HomeEntry() {
  return hasFinishedOnboarding() ? <HomePage /> : <Navigate to={ONBOARDING_PATH} replace />
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeEntry />} />
        <Route path={ONBOARDING_PATH} element={<OnboardingPage />} />
        <Route path="praticar" element={<PracticePage />} />
        <Route path="progresso" element={<ProgressPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path={FIRST_LESSON_PATH} element={<LessonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
