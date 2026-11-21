import type { LessonProgress } from "@/domain/progress"

const STORE = "lessonProgress"
type ProgressKey = [lessonId: string, contentVersion: number]

let connection: Promise<IDBDatabase> | undefined

function openDatabase() {
  if (connection) return connection

  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("english-ai-tutor", 1)
    let blocked = false

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: ["lessonId", "contentVersion"] })
    }
    request.onblocked = () => {
      blocked = true
      reject(new Error("Abra o aplicativo em uma única aba para atualizar os dados de estudo."))
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      if (blocked) {
        database.close()
        return
      }

      database.onversionchange = () => {
        database.close()
        if (connection === pending) connection = undefined
      }
      resolve(database)
    }
  })

  connection = pending
  void pending.catch(() => {
    if (connection === pending) connection = undefined
  })
  return pending
}

type UpdateProgress = (current: LessonProgress | undefined) => LessonProgress

function accessProgress(key: ProgressKey, update: UpdateProgress): Promise<LessonProgress>
function accessProgress(key: ProgressKey): Promise<LessonProgress | undefined>
async function accessProgress(key: ProgressKey, update?: UpdateProgress) {
  const database = await openDatabase()

  return new Promise<LessonProgress | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE, update ? "readwrite" : "readonly")
    const store = transaction.objectStore(STORE)
    const request = store.get(key)
    let progress: LessonProgress | undefined

    transaction.oncomplete = () => resolve(progress)
    transaction.onabort = () => reject(transaction.error ?? new Error("Transação de progresso interrompida."))
    request.onsuccess = () => {
      const saved: LessonProgress | undefined = request.result
      try {
        progress = update ? update(saved) : saved
        if (progress && progress !== saved) store.put(progress)
      } catch (error) {
        reject(error)
        transaction.abort()
      }
    }
  })
}

export function readLessonProgress(lessonId: string, contentVersion: number) {
  return accessProgress([lessonId, contentVersion])
}

export function updateLessonProgress(lessonId: string, contentVersion: number, update: UpdateProgress) {
  return accessProgress([lessonId, contentVersion], update)
}

export async function clearLessonProgress() {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite")
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error("Não foi possível limpar o progresso."))
    transaction.objectStore(STORE).clear()
  })
}
