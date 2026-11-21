import { Send, Trash2 } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Link, useLocation } from "react-router"

import tutorAvatar from "@/assets/tutor-avatar.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Lesson } from "@/domain/lesson"
import type { Correction, TutorContext } from "@/domain/tutor"
import { ONBOARDING_PATH } from "@/lib/onboarding-preference"
import { useModelStatus } from "@/lib/use-model-status"
import { useTutorChat } from "@/lib/use-tutor-chat"
import { isLoadingModel } from "@/services/model-manager"
import { MAX_TUTOR_INPUT_LENGTH } from "@/services/tutor-service"

const suggestions = ["Hi! How are you?", "Can I ask a question?", "Let's talk about food."]

function CorrectionNote({ correction }: { correction: Correction }) {
  return (
    <div className="chat-correction">
      <p className="font-semibold text-lavender">Correção sugerida</p>
      <p><span className="sr-only">Original: </span><del lang="en">{correction.originalText}</del></p>
      <p><span className="sr-only">Sugestão: </span><strong lang="en">{correction.correctedText}</strong></p>
      <p className="text-sm text-muted-foreground">{correction.explanationPt}</p>
    </div>
  )
}

export function TutorChat({ context, lesson, completedAt, onComplete }: {
  context: TutorContext
  lesson?: Lesson
  completedAt?: string
  onComplete?: (at: string, temporary: boolean) => Promise<void>
}) {
  const chat = useTutorChat(context, lesson)
  const { status, cacheCleanup } = useModelStatus()
  const { pathname } = useLocation()
  const [draft, setDraft] = useState("")
  const scrollArea = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const title = useId()
  const inputId = useId()
  const inputHelp = useId()
  const messages = chat.history?.messages
  const turns = messages?.filter((message) => message.role === "tutor").length ?? 0
  const maxTurns = lesson?.guidedConversation.maxTurns
  const finalTurn = maxTurns !== undefined && turns >= maxTurns ? messages?.at(-1)?.createdAt : undefined
  const complete = Boolean(finalTurn)
  const pending = messages?.at(-1)?.role === "learner"
  const ready = status.state === "ready" && cacheCleanup !== "clearing"
  const modelBusy = isLoadingModel(status) || cacheCleanup === "clearing"
  const composerDisabled = !ready || chat.loading || chat.busy || pending || complete
  const sendDisabled = composerDisabled || !draft.trim()
  const clearDisabled = chat.loading || chat.busy || !(messages?.length || chat.history?.failures.length)

  useEffect(() => {
    if (finalTurn && !completedAt && onComplete) void onComplete(finalTurn, chat.temporary)
  }, [finalTurn, completedAt, onComplete, chat.temporary])

  useEffect(() => {
    if (scrollArea.current) scrollArea.current.scrollTop = scrollArea.current.scrollHeight
  }, [messages, chat.busy, chat.error, chat.notice])

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendDisabled) return
    void chat.send(draft)
    setDraft("")
  }

  async function clearConversation() {
    if (clearDisabled) return
    if (!window.confirm("Limpar as mensagens desta conversa? Seu progresso nas aulas será preservado.")) return
    if (await chat.clear()) setDraft("")
  }

  return (
    <Card id={lesson ? "lesson-conversation" : undefined} tabIndex={lesson ? -1 : undefined} aria-labelledby={title} className={lesson ? "tutor-chat" : "tutor-chat p-3 sm:p-5"}>
      <header className="flow-stack">
        <h2 id={title} className="section-heading">{lesson ? "Conversa guiada" : "Conversa livre"}</h2>
        {lesson && <p className="text-muted-foreground">{lesson.guidedConversation.goalPt}</p>}
      </header>

      <div ref={scrollArea} className="chat-scroll" role="region" aria-label="Área de conversa" tabIndex={0}>
        <div className="chat-log" role="log" aria-label="Mensagens da conversa">
          <article className="chat-turn chat-turn-tutor">
            <img src={tutorAvatar} width={36} height={36} alt="" className="chat-avatar" />
            <div className="chat-bubble">
              <p className="sr-only">Tutora:</p>
              <p lang="en">{lesson?.guidedConversation.openingMessageEn ?? "Hi! I’m your English tutor. How are you today?"}</p>
            </div>
          </article>
          {messages?.map((message) => (
            <article key={message.id} className={`chat-turn chat-turn-${message.role}`}>
              {message.role === "tutor" && <img src={tutorAvatar} width={36} height={36} alt="" className="chat-avatar" />}
              <div className="chat-bubble">
                <p className="sr-only">{message.role === "tutor" ? "Tutora:" : "Você:"}</p>
                <p className="whitespace-pre-wrap wrap-anywhere" lang={message.role === "tutor" ? "en" : undefined}>{message.text}</p>
                {message.role === "tutor" && message.correction && <CorrectionNote correction={message.correction} />}
              </div>
            </article>
          ))}
        </div>
        <div className="flow-stack px-1">
          <p className="text-sm text-muted-foreground empty:sr-only" role="status">
            {chat.loading ? "Carregando conversa…" :
              chat.clearing ? "Limpando conversa…" :
                chat.busy ? "A tutora está respondendo…" :
                  chat.notice ?? (complete ? "Conversa guiada concluída." : maxTurns ? `${turns} de ${maxTurns} turnos concluídos.` : "")}
          </p>
          {chat.storageUnavailable && <p className="text-sm text-muted-foreground">O histórico fica disponível nesta aba. O navegador não conseguiu salvá-lo.</p>}
          {!chat.storageUnavailable && chat.temporary && <p className="text-sm text-muted-foreground">As novas mensagens desta conversa ficam nesta aba.</p>}
          {chat.error && <p role="alert" className="text-muted-foreground">{chat.error}</p>}
          {!complete && !ready && (
            <div className="flow-stack">
              <p className="text-muted-foreground">{modelBusy ? "A IA local está sendo preparada." : "Carregue a IA local para conversar com a tutora."}</p>
              <div>
                <Button asChild variant="outline">
                  <Link to={ONBOARDING_PATH} state={{ returnTo: pathname }}>{modelBusy ? "Ver configuração" : "Configurar IA local"}</Link>
                </Button>
              </div>
            </div>
          )}
          {pending && !chat.busy && !complete && (
            <div className="flex flex-wrap gap-2">
              {ready && <Button type="button" onClick={() => {
                input.current?.focus()
                void chat.retry()
              }}>Tentar resposta novamente</Button>}
              <Button type="button" variant="outline" onClick={() => {
                input.current?.focus()
                void chat.discard()
              }}>Descartar mensagem pendente</Button>
            </div>
          )}
          {!lesson && ready && !chat.loading && !messages?.length && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button key={suggestion} type="button" variant="outline" lang="en" onClick={() => {
                  setDraft(suggestion)
                  input.current?.focus()
                }}>{suggestion}</Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <form className="flow-stack" onSubmit={send}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">Sua mensagem</label>
          <Button
            type="button"
            variant="outline"
            aria-disabled={clearDisabled}
            className="min-h-8 px-2.5 aria-disabled:opacity-50"
            onClick={() => void clearConversation()}
          >
            <Trash2 size={15} aria-hidden="true" />Limpar conversa
          </Button>
        </div>
        <div className="chat-composer">
          <textarea
            id={inputId}
            ref={input}
            rows={2}
            maxLength={MAX_TUTOR_INPUT_LENGTH}
            value={draft}
            readOnly={composerDisabled}
            aria-disabled={composerDisabled}
            aria-describedby={inputHelp}
            placeholder="Digite sua mensagem em inglês…"
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }}
          />
          <Button type="submit" aria-disabled={sendDisabled} className="aria-disabled:opacity-50">
            <Send size={18} aria-hidden="true" /><span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>
        <p id={inputHelp} className="text-sm text-muted-foreground">
          Até {MAX_TUTOR_INPUT_LENGTH} caracteres. Enter para enviar e Shift+Enter para uma nova linha.
        </p>
      </form>
    </Card>
  )
}
