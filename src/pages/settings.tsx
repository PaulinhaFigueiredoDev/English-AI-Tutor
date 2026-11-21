import {
  Bell, BookOpen, CalendarDays, Cloud, Cpu, Database, ExternalLink, Info, LaptopMinimal, Settings,
  RotateCcw, ShieldCheck, Target, Trash2, UserRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

import { version } from "../../package.json"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ONBOARDING_PATH } from "@/lib/onboarding-preference"
import { dailyGoals, studyFocuses, studyLevelLabels, updateStudyPreferences, useStudyPreferences } from "@/lib/study-preferences"
import { useLessonProgress } from "@/lib/use-lesson-progress"
import { useModelStatus } from "@/lib/use-model-status"
import { isLoadingModel, modelManager } from "@/services/model-manager"

import { StudyCardHeading, StudyPage } from "./study"

function SettingsSwitch({ icon: Icon, label, checked, onChange, description }: {
  icon: LucideIcon
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}) {
  return (
    <label className="settings-row">
      <Icon size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className="settings-switch"
        checked={checked}
        aria-describedby={description}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
  )
}

function ProfileSettings() {
  const { preferences } = useStudyPreferences()

  return (
    <Card aria-labelledby="settings-profile" className="settings-panel sm:p-4">
      <StudyCardHeading icon={UserRound} id="settings-profile" title="Seu perfil" description="Gerencie seu nome e nível de inglês." />
      <label className="settings-field">
        <span>Nome</span>
        <input
          className="settings-input"
          autoComplete="given-name"
          maxLength={60}
          placeholder="Aluno"
          value={preferences.name}
          onChange={(event) => updateStudyPreferences({ name: event.currentTarget.value })}
        />
      </label>
      <label className="settings-field">
        <span>Nível de inglês</span>
        <select
          className="settings-input"
          value={preferences.level}
          onChange={(event) => updateStudyPreferences({ level: event.currentTarget.value === "A1" ? "A1" : "pre-A1" })}
        >
          <option value="pre-A1">{studyLevelLabels["pre-A1"]} (Iniciante)</option>
          <option value="A1">{studyLevelLabels.A1} (Básico)</option>
        </select>
      </label>
    </Card>
  )
}

function StudyPreferenceSettings() {
  const { preferences } = useStudyPreferences()

  return (
    <Card aria-labelledby="settings-preferences" className="settings-panel sm:p-4">
      <StudyCardHeading
        icon={BookOpen}
        id="settings-preferences"
        title="Preferências de estudo"
        description="Ajuste como e quanto você quer estudar."
      />
      <label className="settings-row">
        <CalendarDays size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>Meta diária de estudo</span>
        <select
          className="settings-input"
          value={preferences.dailyGoal}
          onChange={(event) => {
            const value = Number(event.currentTarget.value)
            const dailyGoal = dailyGoals.find((goal) => goal === value)
            if (dailyGoal !== undefined) updateStudyPreferences({ dailyGoal })
          }}
        >
          {dailyGoals.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
        </select>
      </label>
      <label className="settings-row">
        <Target size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>Foco principal</span>
        <select
          className="settings-input"
          value={preferences.focus}
          onChange={(event) => {
            const value = event.currentTarget.value
            const focus = studyFocuses.find((item) => item === value)
            if (focus) updateStudyPreferences({ focus })
          }}
        >
          {studyFocuses.map((focus) => <option key={focus}>{focus}</option>)}
        </select>
      </label>
      <SettingsSwitch
        icon={Bell}
        label="Lembrete de estudo"
        checked={preferences.reminder}
        onChange={(reminder) => updateStudyPreferences({ reminder, reminderDismissedOn: "" })}
        description="settings-reminder-note"
      />
      <p id="settings-reminder-note" className="sr-only">Mostra a meta diária na tela inicial.</p>
    </Card>
  )
}

function ModelSettings() {
  const { status, cacheCleanup } = useModelStatus()
  const ready = status.state === "ready"
  const busy = isLoadingModel(status)
  const model = "model" in status ? status.model : undefined
  const reloadDisabled = busy || cacheCleanup === "clearing"
  const modelStatus = ready ? `${status.model.name} está pronto nesta aba.` :
    busy ? "Carregamento do modelo em andamento." : "Nenhum modelo em execução nesta aba."

  function confirmReload() {
    if (!model || reloadDisabled) return

    if (window.confirm(`Recarregar ${model.name}? O app usa os arquivos em cache e pode baixar novamente os que faltarem.`)) {
      void modelManager.load(model.id, { reload: true })
    }
  }

  return (
    <Card aria-labelledby="settings-model" className="settings-panel sm:p-4">
      <StudyCardHeading icon={Cpu} id="settings-model" title="Modelo de IA" description="Escolha como o tutor roda no seu navegador." />
      <fieldset className="settings-mode-grid">
        <legend className="sr-only">Modo de IA</legend>
        <label className="settings-mode settings-mode-local">
          <input type="radio" name="model-mode" value="local" defaultChecked aria-labelledby="model-local-title" aria-describedby="model-mode-local" />
          <span className="grid gap-1">
            <LaptopMinimal size={23} aria-hidden="true" />
            <strong id="model-local-title">Local (WebLLM)</strong>
            <small id="model-mode-local">No seu navegador.</small>
          </span>
        </label>
        <label className="settings-mode">
          <input type="radio" name="model-mode" value="online" disabled aria-labelledby="model-online-title" aria-describedby="model-mode-online" />
          <span className="grid gap-1">
            <Cloud size={23} aria-hidden="true" />
            <strong id="model-online-title">Online (API)</strong>
            <small id="model-mode-online">Indisponível.</small>
          </span>
        </label>
      </fieldset>
      <p role="status" className="text-sm text-muted-foreground">{modelStatus}</p>
      {status.state === "error" && <p role="alert" className="text-sm text-muted-foreground">{status.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-9">
          <Link to={ONBOARDING_PATH}>{ready ? "Trocar modelo" : busy ? "Ver configuração" : "Configurar IA local"}</Link>
        </Button>
        {model && (
          <Button type="button" variant="outline" aria-disabled={reloadDisabled} className="min-h-9 aria-disabled:opacity-50" onClick={confirmReload}>
            Recarregar modelo
          </Button>
        )}
      </div>
    </Card>
  )
}

function PrivacySettings() {
  const { preferences } = useStudyPreferences()
  const { loading, clear } = useLessonProgress()
  const { status, cacheCleanup } = useModelStatus()
  const [studyCleanup, setStudyCleanup] = useState<"idle" | "clearing" | "done" | "error">("idle")
  const cacheCleanupDisabled = isLoadingModel(status) || cacheCleanup === "clearing"
  const studyCleanupDisabled = loading || studyCleanup === "clearing"

  function confirmCacheCleanup() {
    if (cacheCleanupDisabled) return

    if (window.confirm("Remover os arquivos dos modelos deste navegador? Para usar a IA novamente, será preciso baixar o modelo. Seu progresso nas aulas será preservado.")) {
      void modelManager.clearCache()
    }
  }

  async function confirmStudyCleanup() {
    if (studyCleanupDisabled) return
    if (!window.confirm("Apagar o progresso e as respostas das aulas deste navegador? Esta ação é permanente. Seu perfil, suas preferências e os arquivos da IA serão preservados.")) return

    setStudyCleanup("clearing")
    try {
      await clear()
      setStudyCleanup("done")
    } catch {
      setStudyCleanup("error")
    }
  }

  return (
    <Card aria-labelledby="settings-privacy" className="settings-panel sm:p-4">
      <StudyCardHeading icon={ShieldCheck} id="settings-privacy" title="Dados e privacidade" description="Gerencie seus dados de estudo no navegador." />
      <SettingsSwitch
        icon={Database}
        label="Salvar progresso neste navegador"
        checked={preferences.saveProgress}
        onChange={(saveProgress) => updateStudyPreferences({ saveProgress })}
        description="settings-progress-note"
      />
      <p id="settings-progress-note" className={preferences.saveProgress ? "sr-only" : "text-sm text-muted-foreground"}>
        Com o salvamento desativado, novos avanços ficam nesta aba. O progresso já salvo é preservado.
      </p>
      <div className="settings-row">
        <RotateCcw size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>Limpar dados de estudo</span>
        <Button
          type="button"
          variant="outline"
          aria-label="Limpar dados de estudo"
          aria-disabled={studyCleanupDisabled}
          className="min-h-9 aria-disabled:opacity-50"
          onClick={() => void confirmStudyCleanup()}
        >
          Limpar
        </Button>
      </div>
      <div className="settings-row">
        <Trash2 size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>Cache do modelo</span>
        <Button
          type="button"
          variant="outline"
          aria-label="Limpar cache do modelo"
          aria-disabled={cacheCleanupDisabled}
          className="min-h-9 aria-disabled:opacity-50"
          onClick={confirmCacheCleanup}
        >
          Limpar
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground empty:sr-only">
        {studyCleanup === "clearing" && "Limpando os dados de estudo…"}
        {studyCleanup === "done" && "Dados de estudo removidos."}
      </p>
      <p role="status" className="text-sm text-muted-foreground empty:sr-only">
        {cacheCleanup === "clearing" && "Limpando o cache do modelo…"}
        {cacheCleanup === "done" && "Cache do modelo limpo. Seu progresso nas aulas foi preservado."}
      </p>
      {studyCleanup === "error" && <p role="alert" className="text-sm text-muted-foreground">Não foi possível limpar os dados de estudo. Tente novamente.</p>}
      {cacheCleanup === "error" && <p role="alert" className="text-sm text-muted-foreground">Não foi possível limpar o cache do modelo. Tente novamente.</p>}
    </Card>
  )
}

export function SettingsPage() {
  const { preferencesUnavailable } = useStudyPreferences()

  return (
    <StudyPage title="Configurações" description="Personalize sua experiência de estudo." icon={Settings} className="settings-page">
      {preferencesUnavailable && (
        <p role="status" className="text-muted-foreground">O navegador não conseguiu salvar suas preferências. Elas ficam nesta aba.</p>
      )}
      <div className="settings-grid">
        <ProfileSettings />
        <StudyPreferenceSettings />
        <ModelSettings />
        <PrivacySettings />
        <Card aria-labelledby="settings-about" className="settings-about sm:p-4">
          <StudyCardHeading icon={Info} id="settings-about" title="Sobre o English AI Tutor" description="Versão, tecnologias e licenças." />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Versão {version} (MVP)</p>
            <Button asChild variant="outline" className="min-h-9">
              <a href="https://github.com/PaulinhaFigueiredoDev/English-AI-Tutor#tecnologias" target="_blank" rel="noreferrer">
                Ver detalhes<span className="sr-only"> (nova aba)</span><ExternalLink size={16} aria-hidden="true" />
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </StudyPage>
  )
}
