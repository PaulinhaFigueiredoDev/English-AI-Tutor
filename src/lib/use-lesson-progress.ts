import { useCallback, useEffect, useRef, useState } from "react"
import { useOutletContext } from "react-router"

import type { MultipleChoiceExercise } from "@/domain/lesson"
import type { LessonProgress } from "@/domain/progress"
import { firstLesson } from "@/services/lesson-service"
import { appendAttempt, createAttempt, startLesson } from "@/services/progress-service"
import { clearLessonProgress, readLessonProgress, updateLessonProgress } from "@/services/storage"

import { useStudyPreferences } from "./study-preferences"

type Change = (progress: LessonProgress) => LessonProgress
type ProgressUpdate = (progress?: LessonProgress) => LessonProgress

export function useFirstLessonProgress() {
  const { preferences } = useStudyPreferences()
  const [savedProgress, setSavedProgress] = useState<LessonProgress>()
  const [temporaryUpdates, setTemporaryUpdates] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(Boolean(firstLesson))
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)
  const channel = useRef<BroadcastChannel | undefined>(undefined)
  const revision = useRef(0)
  const progress = temporaryUpdates.reduce<LessonProgress | undefined>(
    (current, update) => update(current),
    savedProgress,
  )

  const resetView = useCallback(() => {
    revision.current++
    setResetVersion(revision.current)
    setSavedProgress(undefined)
    setTemporaryUpdates([])
    setLoading(false)
  }, [])

  useEffect(() => {
    const lesson = firstLesson
    if (!lesson) return

    let active = true
    const startRevision = revision.current
    const progressChannel = typeof BroadcastChannel === "undefined"
      ? undefined
      : new BroadcastChannel("english-ai-tutor:study-progress")
    channel.current = progressChannel
    progressChannel?.addEventListener("message", resetView)

    void readLessonProgress(lesson.id, lesson.contentVersion).then(
      (saved) => {
        if (!active || revision.current !== startRevision) return
        setSavedProgress(saved)
        setLoading(false)
      },
      () => {
        if (!active || revision.current !== startRevision) return
        setStorageUnavailable(true)
        setLoading(false)
      },
    )

    return () => {
      active = false
      progressChannel?.close()
      channel.current = undefined
    }
  }, [resetView])

  const save = useCallback(async (change: Change) => {
    const lesson = firstLesson
    if (!lesson) return

    const initial = startLesson(lesson)
    const update = (previous?: LessonProgress) => change(previous ?? initial)
    const startRevision = revision.current

    if (preferences.saveProgress && !storageUnavailable) {
      try {
        const saved = await updateLessonProgress(lesson.id, lesson.contentVersion, update)
        if (revision.current === startRevision) setSavedProgress(saved)
        return
      } catch {
        if (revision.current !== startRevision) return
        setStorageUnavailable(true)
      }
    }

    setTemporaryUpdates((updates) => [...updates, update])
  }, [preferences.saveProgress, storageUnavailable])

  const clear = useCallback(async () => {
    await clearLessonProgress()
    resetView()
    setStorageUnavailable(false)
    channel.current?.postMessage("cleared")
  }, [resetView])

  const start = useCallback(() => save((current) => current), [save])
  const answer = useCallback((exercise: MultipleChoiceExercise, selectedOptionIndex: number) => {
    const attempt = createAttempt(exercise, selectedOptionIndex)
    return save((current) => appendAttempt(current, attempt))
  }, [save])

  return { progress, loading, storageUnavailable, savingProgress: preferences.saveProgress, resetVersion, start, answer, clear }
}

export function useLessonProgress() {
  return useOutletContext<ReturnType<typeof useFirstLessonProgress>>()
}
