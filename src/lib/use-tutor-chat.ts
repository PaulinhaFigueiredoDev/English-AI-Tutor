import { useEffect, useSyncExternalStore } from "react"

import type { Lesson } from "@/domain/lesson"
import type { Message, TutorContext, TutorHistory } from "@/domain/tutor"
import { modelManager } from "@/services/model-manager"
import { clearTutorHistory, readTutorHistory, updateTutorHistory } from "@/services/storage"
import type { GuidedCompletion } from "@/services/storage"
import { MAX_TUTOR_INPUT_LENGTH, respondAsTutor, TutorFormatError } from "@/services/tutor-service"

import { isStudyProgressSavingEnabled } from "./study-preferences"

interface ChatState {
  history?: TutorHistory
  loading: boolean
  busy: boolean
  clearing?: boolean
  temporary: boolean
  storageUnavailable: boolean
  error?: string
  notice?: string
}

const initial: ChatState = { loading: true, busy: false, temporary: false, storageUnavailable: false }
const chats = new Map<string, ChatState>()
const epochs = new Map<string, symbol>()
const listeners = new Set<() => void>()
let generation = 0
const historyChannel = typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel("english-ai-tutor:chat-history")

function getEpoch(id: string) {
  const current = epochs.get(id)
  if (current) return current
  const epoch = Symbol()
  epochs.set(id, epoch)
  return epoch
}

function publish(id: string, state: ChatState) {
  chats.set(id, state)
  for (const listener of listeners) listener()
}

export function resetTutorChats() {
  generation++
  epochs.clear()
  chats.clear()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

async function restore(id: string) {
  if (chats.has(id)) return
  const started = getEpoch(id)
  publish(id, initial)
  try {
    const history = await readTutorHistory(id)
    if (started === getEpoch(id)) publish(id, { ...initial, history, loading: false })
  } catch {
    if (started === getEpoch(id)) publish(id, { ...initial, loading: false, temporary: true, storageUnavailable: true })
  }
}

class HistoryChanged extends Error {
  constructor(readonly history?: TutorHistory) { super() }
}

async function save(id: string, current: ChatState, history: TutorHistory, started: symbol, completion?: GuidedCompletion) {
  if (started !== getEpoch(id)) return current
  let state = { ...current, history, temporary: current.temporary || !isStudyProgressSavingEnabled() }
  if (!state.temporary) {
    try {
      await updateTutorHistory(id, (saved) => {
        if (started !== getEpoch(id) || saved?.revision !== current.history?.revision) throw new HistoryChanged(saved)
        return history
      }, completion)
    } catch (error) {
      if (error instanceof HistoryChanged) throw error
      state = { ...state, temporary: true, storageUnavailable: true }
    }
  }
  if (started === getEpoch(id)) publish(id, state)
  return state
}

function withRevision(history: TutorHistory, change: Partial<Pick<TutorHistory, "messages" | "failures">>) {
  return { ...history, ...change, revision: crypto.randomUUID(), session: { ...history.session, updatedAt: new Date().toISOString() } }
}

function reportConflict(id: string, state: ChatState, error: HistoryChanged) {
  publish(id, {
    ...state,
    history: error.history,
    busy: false,
    error: "A conversa mudou em outra aba. Continue a partir do histórico atualizado.",
  })
}

async function runTurn(id: string, context: TutorContext, lesson: Lesson | undefined, text?: string) {
  const current = chats.get(id)
  if (!current || current.loading || current.busy || modelManager.getSnapshot().status.state !== "ready") return

  const pending = current.history?.messages.at(-1)?.role === "learner"
  const replies = current.history?.messages.filter((message) => message.role === "tutor").length ?? 0
  const learnerText = text?.trim()
  if (text !== undefined ? !learnerText || learnerText.length > MAX_TUTOR_INPUT_LENGTH || pending : !pending) return
  if (lesson && replies >= lesson.guidedConversation.maxTurns) return

  const started = getEpoch(id)
  const date = new Date().toISOString()
  let state: ChatState = { ...current, busy: true, error: undefined, notice: undefined }
  publish(id, state)

  try {
    const history: TutorHistory = state.history ?? {
      session: { ...context, id, startedAt: date, updatedAt: date },
      revision: "",
      messages: [],
      failures: [],
    }
    if (learnerText) {
      const message: Message = { id: crypto.randomUUID(), sessionId: id, role: "learner", text: learnerText, createdAt: date }
      state = await save(id, state, withRevision(history, { messages: [...history.messages, message] }), started)
    }
    if (started !== getEpoch(id) || !state.history) return
    const result = await respondAsTutor(context, state.history.messages, lesson)
    if (started !== getEpoch(id)) return
    const reply: Message = {
      id: crypto.randomUUID(), sessionId: id, role: "tutor", text: result.reply,
      correction: result.correction, createdAt: new Date().toISOString(),
    }
    const completion = lesson && replies + 1 === lesson.guidedConversation.maxTurns ? {
      lessonId: lesson.id, contentVersion: lesson.contentVersion,
      startedAt: state.history.session.startedAt, completedAt: reply.createdAt,
    } : undefined
    state = await save(id, state, withRevision(state.history, { messages: [...state.history.messages, reply] }), started, completion)
  } catch (error) {
    if (started !== getEpoch(id)) return
    if (error instanceof HistoryChanged) {
      reportConflict(id, state, error)
      return
    }
    const kind = error instanceof TutorFormatError ? "format" : "generation"
    const message = kind === "format"
      ? "A tutora enviou uma resposta incompleta. Tente novamente."
      : "A tutora não conseguiu responder. Confira a IA local e tente novamente."
    if (state.history) {
      try {
        state = await save(id, state, withRevision(state.history, {
          failures: [...state.history.failures, { kind, createdAt: new Date().toISOString() }],
        }), started)
      } catch (conflict) {
        if (conflict instanceof HistoryChanged && started === getEpoch(id)) reportConflict(id, state, conflict)
        return
      }
    }
    if (started === getEpoch(id)) publish(id, { ...state, busy: false, error: message })
    return
  }
  if (started === getEpoch(id)) publish(id, { ...state, busy: false })
}

async function discardTurn(id: string) {
  const state = chats.get(id)
  if (!state?.history || state.busy || state.history.messages.at(-1)?.role !== "learner") return

  const started = getEpoch(id)
  publish(id, { ...state, busy: true })
  try {
    await save(id, { ...state, error: undefined }, withRevision(state.history, {
      messages: state.history.messages.slice(0, -1),
    }), started)
  } catch (error) {
    if (error instanceof HistoryChanged && started === getEpoch(id)) reportConflict(id, state, error)
  }
}

function resetConversation(id: string, change: Partial<ChatState> = {}) {
  epochs.delete(id)
  publish(id, { ...initial, loading: false, notice: "Conversa limpa.", ...change })
}

historyChannel?.addEventListener("message", (event) => {
  const id: unknown = event.data
  if (typeof id !== "string" || !chats.has(id)) return

  epochs.delete(id)
  chats.delete(id)
  void restore(id)
})

async function clearConversation(id: string) {
  const state = chats.get(id)
  if (!state?.history || state.loading || state.busy) return false

  const started = getEpoch(id)
  publish(id, { ...state, busy: true, clearing: true, error: undefined, notice: undefined })
  try {
    await clearTutorHistory(id)
  } catch {
    if (started !== getEpoch(id)) return false
    if (state.storageUnavailable) {
      resetConversation(id, {
        temporary: true, storageUnavailable: true, notice: undefined,
        error: "A conversa desta aba foi limpa. Não foi possível confirmar a limpeza do histórico salvo.",
      })
      return true
    }
    publish(id, { ...state, error: "Não foi possível limpar a conversa. Tente novamente.", notice: undefined })
    return false
  }

  if (started !== getEpoch(id)) return false
  resetConversation(id)
  historyChannel?.postMessage(id)
  return true
}

export function useTutorChat(context: TutorContext, lesson?: Lesson) {
  const id = lesson ? `guided:${lesson.id}:${lesson.contentVersion}` : "free"
  const reset = useSyncExternalStore(subscribe, () => generation)
  const state = useSyncExternalStore(subscribe, () => chats.get(id) ?? initial)

  useEffect(() => { void restore(id) }, [id, reset])

  return {
    ...state,
    send: (text: string) => runTurn(id, context, lesson, text),
    retry: () => runTurn(id, context, lesson),
    discard: () => discardTurn(id),
    clear: () => clearConversation(id),
  }
}
