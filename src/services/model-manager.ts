import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm"

import type { ModelCompatibility, ModelStatus, TutorModel } from "@/domain/model"

import { tutorModels } from "./model-catalog"

interface ModelSnapshot {
  compatibility: ModelCompatibility
  status: ModelStatus
}

let snapshot: ModelSnapshot = { compatibility: { state: "unchecked" }, status: { state: "unconfigured" } }
let loadedEngine: WebWorkerMLCEngine | undefined
const listeners = new Set<() => void>()

function update(change: Partial<ModelSnapshot>) {
  snapshot = { ...snapshot, ...change }
  for (const listener of listeners) listener()
}

export function isLoadingModel(status: ModelStatus) {
  return status.state === "downloading" || status.state === "loading" || status.state === "testing"
}

async function detectCompatibility(): Promise<ModelCompatibility> {
  if (!isSecureContext) {
    return { state: "unsupported", message: "Abra o app em HTTPS ou localhost para usar WebGPU." }
  }

  if (!navigator.gpu) {
    return { state: "unsupported", message: "WebGPU não está disponível neste navegador." }
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter || adapter.info?.isFallbackAdapter) {
    return { state: "unsupported", message: "O navegador não disponibilizou um adaptador gráfico compatível." }
  }

  // Limites mínimos usados pelo runtime do WebLLM 0.2.89 ao solicitar o dispositivo.
  const limits = adapter.limits
  if (limits.maxBufferSize < 256 * 1024 ** 2 || limits.maxStorageBufferBindingSize < 128 * 1024 ** 2 ||
      limits.maxComputeWorkgroupStorageSize < 32 * 1024 || limits.maxStorageBuffersPerShaderStage < 10) {
    return { state: "unsupported", message: "Os limites do adaptador gráfico são insuficientes para o WebLLM." }
  }

  const models = tutorModels.filter((model) => model.requiredFeatures.every((feature) => adapter.features.has(feature)))
  return models.length > 0
    ? { state: "compatible", models }
    : { state: "unsupported", message: "O adaptador gráfico não oferece os recursos exigidos pelos modelos disponíveis." }
}

function describeLoadError(error: unknown) {
  const details = String(error)
  if (/quota|disk.{0,12}space|storage.{0,12}(full|insufficient)/i.test(details)) {
    return "O navegador não tem espaço para guardar o modelo. Libere espaço ou escolha um modelo menor e tente novamente."
  }

  if (!navigator.onLine || /network|fetch|download|failed to load resource/i.test(details)) {
    return "O download do modelo falhou. Confira a conexão e tente novamente. O navegador pode reutilizar arquivos já baixados."
  }

  if (/memory|device lost|buffer/i.test(details)) {
    return "O dispositivo não conseguiu carregar o modelo. Feche outras abas ou tente um modelo menor."
  }

  return "Não foi possível carregar ou testar o modelo. Tente novamente ou continue estudando sem IA."
}

function reportProgress(model: TutorModel, progress: number) {
  if (snapshot.status.state !== "downloading") return

  if (progress >= 1) {
    update({ status: { state: "loading", model } })
  } else if (Number.isFinite(progress)) {
    update({ status: { state: "downloading", model, progress: Math.max(snapshot.status.progress, progress) } })
  }
}

export const modelManager = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },

  getSnapshot() {
    return snapshot
  },

  async checkCompatibility() {
    if (snapshot.compatibility.state === "checking" || isLoadingModel(snapshot.status)) return

    update({ compatibility: { state: "checking" } })
    try {
      update({ compatibility: await detectCompatibility() })
    } catch {
      update({ compatibility: { state: "unsupported", message: "Não foi possível verificar o adaptador gráfico. Tente novamente." } })
    }
  },

  async load(modelId: string) {
    const { compatibility, status } = snapshot
    if (compatibility.state !== "compatible" || isLoadingModel(status) || status.state === "ready") return

    const model = compatibility.models.find((candidate) => candidate.id === modelId)
    if (!model) return

    update({ status: { state: "downloading", model, progress: 0 } })
    let worker: Worker | undefined
    let workerFailure: ((event: Event) => void) | undefined

    try {
      const { CreateWebWorkerMLCEngine, hasModelInCache } = await import("@mlc-ai/web-llm")
      const cached = await hasModelInCache(modelId)
      if (cached) update({ status: { state: "loading", model } })

      worker = new Worker(new URL("./model-worker.ts", import.meta.url), { type: "module" })
      const failure = new Promise<never>((_, reject) => {
        workerFailure = () => reject(new Error("O worker do modelo parou de responder."))
        worker?.addEventListener("error", workerFailure)
        worker?.addEventListener("messageerror", workerFailure)
      })
      loadedEngine = await Promise.race([failure, CreateWebWorkerMLCEngine(worker, model.id, {
        initProgressCallback: ({ progress }) => reportProgress(model, progress),
      }, { context_window_size: 1024 })])

      update({ status: { state: "testing", model } })
      const result = await Promise.race([failure, loadedEngine.chat.completions.create({
        messages: [{ role: "user", content: "Say hello in English." }],
        max_tokens: 12,
        temperature: 0,
      })])
      if (!result.choices[0]?.message.content?.trim()) throw new Error("O modelo não retornou texto.")

      update({ status: { state: "ready", model } })
    } catch (error) {
      worker?.terminate()
      loadedEngine = undefined
      update({ status: { state: "error", model, message: describeLoadError(error) } })
    } finally {
      if (workerFailure) {
        worker?.removeEventListener("error", workerFailure)
        worker?.removeEventListener("messageerror", workerFailure)
      }
    }
  },
}
