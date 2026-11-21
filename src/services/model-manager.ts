import type { AppConfig } from "@mlc-ai/web-llm"

import type { ModelCompatibility, ModelStatus, TutorModel } from "@/domain/model"

import { tutorModels } from "./model-catalog"

interface ModelSnapshot {
  compatibility: ModelCompatibility
  status: ModelStatus
  cacheCleanup: "idle" | "clearing" | "done" | "error"
}

let snapshot: ModelSnapshot = {
  compatibility: { state: "unchecked" },
  status: { state: "unconfigured" },
  cacheCleanup: "idle",
}
let activeWorker: Worker | undefined
const listeners = new Set<() => void>()
const webLLMCacheNames = ["webllm/model", "webllm/config", "webllm/wasm"]

function update(change: Partial<ModelSnapshot>) {
  snapshot = { ...snapshot, ...change }
  for (const listener of listeners) listener()
}

export function isLoadingModel(status: ModelStatus) {
  return status.state === "preparing" || status.state === "downloading" ||
    status.state === "loading" || status.state === "testing"
}

function withModelCacheLock<T>(operation: () => Promise<T>) {
  return navigator.locks
    ? navigator.locks.request("english-ai-tutor:model-cache", operation)
    : operation()
}

async function deleteOtherModelsFromCache(config: AppConfig, modelId: string) {
  const selected = config.model_list.find((record) => record.model_id === modelId)
  if (!selected) throw new Error("O modelo escolhido não foi encontrado no WebLLM.")
  const modelUrl = selected.model.endsWith("/") ? selected.model : `${selected.model}/`

  // WebLLM 0.2.89 uses these Cache Storage buckets. Its deletion helper fetches
  // an absent tensor manifest, so enumerate existing entries for offline and partial downloads.
  for (const name of await caches.keys()) {
    if (!webLLMCacheNames.includes(name)) continue
    const cache = await caches.open(name)
    for (const request of await cache.keys()) {
      const keep = name === "webllm/wasm"
        ? request.url === selected.model_lib
        : request.url.startsWith(modelUrl)
      if (!keep) await cache.delete(request)
    }
  }
}

function stopActiveWorker() {
  activeWorker?.terminate()
  activeWorker = undefined
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

  async clearCache() {
    if (isLoadingModel(snapshot.status) || snapshot.cacheCleanup === "clearing") return

    update({ cacheCleanup: "clearing" })
    try {
      await withModelCacheLock(async () => {
        for (const name of webLLMCacheNames) await caches.delete(name)
        const remaining = await caches.keys()
        if (webLLMCacheNames.some((name) => remaining.includes(name))) {
          throw new Error("Ainda há caches do WebLLM neste navegador.")
        }
        stopActiveWorker()
      })
      update({ cacheCleanup: "done", status: { state: "unconfigured" } })
    } catch {
      update({ cacheCleanup: "error" })
    }
  },

  async load(modelId: string, { reload = false }: { reload?: boolean } = {}) {
    const { compatibility, status, cacheCleanup } = snapshot
    if (compatibility.state !== "compatible" || isLoadingModel(status) || cacheCleanup === "clearing") return
    if (!reload && status.state === "ready" && status.model.id === modelId) return

    const model = compatibility.models.find((candidate) => candidate.id === modelId)
    if (!model) return

    update({ cacheCleanup: "idle", status: { state: "preparing", model } })

    try {
      await withModelCacheLock(async () => {
        const { CreateWebWorkerMLCEngine, hasModelInCache, prebuiltAppConfig } = await import("@mlc-ai/web-llm")
        await deleteOtherModelsFromCache(prebuiltAppConfig, modelId)
        stopActiveWorker()
        update({ status: { state: "downloading", model, progress: 0 } })
        if (await hasModelInCache(modelId)) update({ status: { state: "loading", model } })

        const worker = new Worker(new URL("./model-worker.ts", import.meta.url), { type: "module" })
        activeWorker = worker
        const events = new AbortController()
        const failure = new Promise<never>((_, reject) => {
          const fail = () => reject(new Error("O worker do modelo parou de responder."))
          worker.addEventListener("error", fail, { signal: events.signal })
          worker.addEventListener("messageerror", fail, { signal: events.signal })
        })

        try {
          const engine = await Promise.race([failure, CreateWebWorkerMLCEngine(worker, model.id, {
            initProgressCallback: ({ progress }) => reportProgress(model, progress),
          }, { context_window_size: 1024 })])

          update({ status: { state: "testing", model } })
          const result = await Promise.race([failure, engine.chat.completions.create({
            messages: [{ role: "user", content: "Say hello in English." }],
            max_tokens: 12,
            temperature: 0,
            ...(model.disableThinking && { extra_body: { enable_thinking: false } }),
          })])
          const response = result.choices[0]?.message.content
          const answer = model.disableThinking ? response?.replace(/^\s*<think>\s*<\/think>/, "") : response
          if (!answer?.trim()) throw new Error("O modelo não retornou texto.")
        } catch (error) {
          stopActiveWorker()
          throw error
        } finally {
          events.abort()
        }
      })
      update({ status: { state: "ready", model } })
    } catch (error) {
      stopActiveWorker()
      const message = snapshot.status.state === "preparing"
        ? "Não foi possível preparar o cache do modelo. Tente novamente ou continue estudando sem IA."
        : describeLoadError(error)
      update({ status: { state: "error", model, message } })
    }
  },
}
