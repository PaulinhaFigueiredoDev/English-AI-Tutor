import type { LessonProgress } from "@/domain/progress"
import type { TutorHistory } from "@/domain/tutor"

const STORE = "lessonProgress"
const CHAT_STORE = "tutorHistory"
type ProgressKey = [lessonId: string, contentVersion: number]

let connection: Promise<IDBDatabase> | undefined

function openDatabase() {
  if (connection) return connection

  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("english-ai-tutor", 2)
    let blocked = false

    request.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) request.result.createObjectStore(STORE, { keyPath: ["lessonId", "contentVersion"] })
      if (event.oldVersion < 2) request.result.createObjectStore(CHAT_STORE, { keyPath: "session.id" })
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

type UpdateRecord<T> = (current: T | undefined) => T
type UpdateProgress = UpdateRecord<LessonProgress>
type RelatedWrite = { store: string; write: (transaction: IDBTransaction) => void }

function accessRecord<T>(name: string, key: IDBValidKey, update: UpdateRecord<T>, related?: RelatedWrite): Promise<T>
function accessRecord<T>(name: string, key: IDBValidKey): Promise<T | undefined>
async function accessRecord<T>(name: string, key: IDBValidKey, update?: UpdateRecord<T>, related?: RelatedWrite) {
  const database = await openDatabase()

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(related ? [name, related.store] : name, update ? "readwrite" : "readonly")
    const store = transaction.objectStore(name)
    const request = store.get(key)
    let record: T | undefined

    transaction.oncomplete = () => resolve(record)
    transaction.onabort = () => reject(transaction.error ?? new Error("Transação de estudo interrompida."))
    request.onsuccess = () => {
      const saved: T | undefined = request.result
      try {
        record = update ? update(saved) : saved
        if (record !== undefined && record !== saved) {
          store.put(record)
          related?.write(transaction)
        }
      } catch (error) {
        reject(error)
        transaction.abort()
      }
    }
  })
}

export function readLessonProgress(lessonId: string, contentVersion: number) {
  const key: ProgressKey = [lessonId, contentVersion]
  return accessRecord<LessonProgress>(STORE, key)
}

export function updateLessonProgress(lessonId: string, contentVersion: number, update: UpdateProgress) {
  return accessRecord(STORE, [lessonId, contentVersion], update)
}

export function readTutorHistory(sessionId: string) {
  return accessRecord<TutorHistory>(CHAT_STORE, sessionId)
}

export type GuidedCompletion = Pick<LessonProgress, "lessonId" | "contentVersion" | "startedAt"> & { completedAt: string }

export function updateTutorHistory(sessionId: string, update: UpdateRecord<TutorHistory>, completion?: GuidedCompletion) {
  const related = completion && {
    store: STORE,
    write(transaction: IDBTransaction) {
      const { lessonId, contentVersion, startedAt, completedAt } = completion
      const store = transaction.objectStore(STORE)
      const request = store.get([lessonId, contentVersion])
      request.onsuccess = () => {
        const saved: LessonProgress | undefined = request.result
        if (saved?.guidedConversationCompletedAt) return
        store.put({ ...(saved ?? { lessonId, contentVersion, startedAt, attempts: [] }), guidedConversationCompletedAt: completedAt })
      }
    },
  }
  return accessRecord(CHAT_STORE, sessionId, update, related)
}

export async function clearTutorHistory(sessionId: string) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CHAT_STORE, "readwrite")
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error("Não foi possível limpar a conversa."))
    transaction.objectStore(CHAT_STORE).delete(sessionId)
  })
}

export async function clearStudyData() {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([STORE, CHAT_STORE], "readwrite")
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error("Não foi possível limpar o progresso."))
    transaction.objectStore(STORE).clear()
    transaction.objectStore(CHAT_STORE).clear()
  })
}
