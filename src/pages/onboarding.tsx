import { CheckCircle2, Cpu, LaptopMinimal } from "lucide-react"
import { useRef, useState } from "react"
import { Link } from "react-router"

import tutorAvatar from "@/assets/tutor-avatar.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ModelStatus, TutorModel } from "@/domain/model"
import { finishOnboarding } from "@/lib/onboarding-preference"
import { useModelStatus } from "@/lib/use-model-status"
import { StudyPage } from "@/pages/study"
import { firstLesson, FIRST_LESSON_PATH } from "@/services/lesson-service"
import { tutorModels } from "@/services/model-catalog"
import { isLoadingModel, modelManager } from "@/services/model-manager"

function formatDownloadSize(bytes: number) {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} GB`
  }
  return `${Math.round(bytes / 1_000_000)} MB`
}

function ModelChoice({ model, selected, suggested, onSelect }: {
  model: TutorModel
  selected: boolean
  suggested: boolean
  onSelect: () => void
}) {
  return (
    <div className="rounded-xl border border-border p-3 has-checked:border-lavender has-checked:bg-accent">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="tutor-model"
          value={model.id}
          checked={selected}
          onChange={onSelect}
          className="mt-1 size-4 shrink-0 accent-lavender"
        />
        <span>
          <strong className="block">{model.name}</strong>
          <span className="block text-sm text-muted-foreground">
            Cerca de {formatDownloadSize(model.estimatedDownloadBytes)}
            {suggested && " · Menor download"}
            {model.evaluationCandidate && " · Candidato principal em avaliação"}
          </span>
        </span>
      </label>
      <a className="ml-7 inline-flex min-h-8 items-center text-sm text-lavender underline" href={model.licenseUrl} target="_blank" rel="noreferrer">
        Licença {model.licenseName} de {model.name} (nova aba)
      </a>
    </div>
  )
}

function LoadStatus({ status }: { status: ModelStatus }) {
  switch (status.state) {
    case "preparing":
      return <p role="status">Preparando o cache de {status.model.name}…</p>
    case "downloading": {
      const percent = Math.round(status.progress * 100)
      return (
        <div className="flow-stack">
          <p role="status">Baixando arquivos de {status.model.name}…</p>
          <progress aria-label="Download do modelo" max={100} value={percent || undefined} className="h-2 w-full accent-lavender" />
          {percent > 0 && <p className="text-sm text-muted-foreground">{percent}%</p>}
        </div>
      )
    }
    case "loading":
      return <p role="status">Carregando {status.model.name} na memória…</p>
    case "testing":
      return <p role="status">Testando uma resposta de {status.model.name}…</p>
    case "ready":
      return (
        <div className="flex items-start gap-3" role="status">
          <CheckCircle2 size={22} className="shrink-0 text-lavender" aria-hidden="true" />
          <div>
            <p className="font-semibold">Modelo pronto nesta aba</p>
            <p className="text-muted-foreground">{status.model.name} respondeu ao teste local. A conversa com o tutor será habilitada na etapa do chat.</p>
          </div>
        </div>
      )
    case "error":
      return <p role="alert" className="rounded-xl border border-border p-3 text-muted-foreground">{status.message}</p>
    default:
      return null
  }
}

export function OnboardingPage() {
  const { compatibility, status, cacheCleanup } = useModelStatus()
  const setupHeading = useRef<HTMLHeadingElement>(null)
  const [manual, setManual] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const compatible = compatibility.state === "compatible"
  const checking = compatibility.state === "checking"
  const busy = isLoadingModel(status) || cacheCleanup === "clearing"
  const ready = status.state === "ready"
  const choices = compatible ? compatibility.models : manual && compatibility.state === "unchecked" ? tutorModels : []
  const defaultChoice = compatible ? choices[0]?.id : undefined
  const preferredId = selectedId ?? (ready || status.state === "error" ? status.model?.id : undefined)
  const selected = choices.find((model) => model.id === preferredId) ?? choices.find((model) => model.id === defaultChoice)
  const selectedIsReady = ready && status.model.id === selected?.id

  const check = () => {
    setupHeading.current?.focus()
    void modelManager.checkCompatibility()
  }

  function chooseManually() {
    setupHeading.current?.focus()
    setManual(true)
  }

  function confirmDownload() {
    if (!selected) return
    setupHeading.current?.focus()
    void modelManager.load(selected.id)
  }

  return (
    <StudyPage title="Configurar IA local" description="Prepare o modelo no navegador para praticar com a tutora.">
      {!busy && !ready && (
        <Card aria-labelledby="model-welcome" className="flex items-start gap-4">
          <img src={tutorAvatar} alt="" width={64} height={64} className="tutor-avatar shrink-0" />
          <div className="space-y-1">
            <h2 id="model-welcome" className="section-heading">Olá! Posso verificar seu dispositivo?</h2>
            <p className="text-muted-foreground">Vou verificar se o navegador consegue rodar um modelo local. Você também pode escolher um modelo manualmente ou começar a aula sem IA.</p>
          </div>
        </Card>
      )}

      <Card aria-labelledby="model-setup" className="flow-stack">
        <div className="flex items-center gap-3">
          <span className="feature-icon"><Cpu size={22} aria-hidden="true" /></span>
          <h2 ref={setupHeading} id="model-setup" tabIndex={-1} className="section-heading">Modelo de IA</h2>
        </div>

        {compatibility.state === "unchecked" && !manual && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={check}><LaptopMinimal size={17} aria-hidden="true" />Verificar dispositivo</Button>
            <Button type="button" variant="outline" onClick={chooseManually}>Escolher manualmente</Button>
          </div>
        )}
        {checking && <p role="status">Verificando a compatibilidade com WebGPU…</p>}
        {compatibility.state === "unsupported" && (
          <div className="flow-stack">
            <p role="status" className="text-muted-foreground">{compatibility.message} A Aula 01 continua disponível.</p>
            <div><Button type="button" variant="outline" onClick={check}>Verificar novamente</Button></div>
          </div>
        )}

        {ready && <LoadStatus status={status} />}
        {choices.length > 0 && !busy && (
          <>
            {compatible && <p role="status" className="text-muted-foreground">WebGPU detectado. A execução do modelo será confirmada com um teste após o carregamento.</p>}
            <p className="text-muted-foreground">Os modelos estão em avaliação para uso pedagógico em português.</p>
            <fieldset className="grid min-w-0 gap-2">
              <legend className="mb-2 font-medium">Escolha o modelo</legend>
              {choices.map((model) => (
                <ModelChoice
                  key={model.id}
                  model={model}
                  selected={selected?.id === model.id}
                  suggested={model.id === defaultChoice}
                  onSelect={() => setSelectedId(model.id)}
                />
              ))}
            </fieldset>
            {compatible ? (
              <>
                <p className="text-sm text-muted-foreground">Ao confirmar, o navegador remove o cache dos outros modelos, reutiliza os arquivos do modelo escolhido e baixa os que faltarem.</p>
                {status.state === "error" && <LoadStatus status={status} />}
                <div>
                  <Button type="button" disabled={!selected || selectedIsReady} onClick={confirmDownload}>
                    {ready ? "Autorizar troca de modelo" : status.state === "error" ? "Tentar baixar ou carregar novamente" : "Autorizar download e testar"}
                  </Button>
                </div>
              </>
            ) : (
              <div><Button type="button" disabled={!selected} onClick={check}>Verificar modelo escolhido</Button></div>
            )}
          </>
        )}

        {isLoadingModel(status) && <LoadStatus status={status} />}
        {cacheCleanup === "clearing" && <p role="status">Limpando o cache do modelo…</p>}
      </Card>

      {!busy && (
        <div>
          <Button asChild variant={ready ? "default" : "outline"}>
            <Link to={firstLesson ? FIRST_LESSON_PATH : "/"} onClick={finishOnboarding}>
              {ready ? "Começar minha primeira aula" : "Estudar sem IA"}
            </Link>
          </Button>
        </div>
      )}
    </StudyPage>
  )
}
