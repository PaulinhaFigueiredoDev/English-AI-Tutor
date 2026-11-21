import { useCallback, useEffect, useState } from "react"
import { useOutletContext } from "react-router"

import type { MultipleChoiceExercise } from "@/domain/lesson"
import type { LessonProgress } from "@/domain/progress"
import { firstLesson } from "@/services/lesson-service"
import { appendAttempt, createAttempt, startLesson } from "@/services/progress-service"
import { readLessonProgress, updateLessonProgress } from "@/services/storage"

type Change = (progress: LessonProgress) => LessonProgress

export function useFirstLessonProgress() {
  const [progress, setProgress] = useState<LessonProgress>()
  const [loading, setLoading] = useState(Boolean(firstLesson))
  const [storageUnavailable, setStorageUnavailable] = useState(false)

  useEffect(() => {
    const lesson = firstLesson
    if (!lesson) return

    let active = true
    void readLessonProgress(lesson.id, lesson.contentVersion).then(
      (saved) => {
        if (!active) return
        setProgress(saved)
        setLoading(false)
      },
      () => {
        if (!active) return
        setStorageUnavailable(true)
        setLoading(false)
      },
    )

    return () => { active = false }
  }, [])

  const save = useCallback(async (change: Change) => {
    const lesson = firstLesson
    if (!lesson) return

    const update = (previous: LessonProgress | undefined) => change(previous ?? startLesson(lesson))

    if (!storageUnavailable) {
      try {
        setProgress(await updateLessonProgress(lesson.id, lesson.contentVersion, update))
        return
      } catch {
        setStorageUnavailable(true)
      }
    }

    setProgress(update)
  }, [storageUnavailable])

  const start = useCallback(() => save((current) => current), [save])
  const answer = useCallback((exercise: MultipleChoiceExercise, selectedOptionIndex: number) => {
    const attempt = createAttempt(exercise, selectedOptionIndex)
    return save((current) => appendAttempt(current, attempt))
  }, [save])

  return { progress, loading, storageUnavailable, start, answer }
}

export function useLessonProgress() {
  return useOutletContext<ReturnType<typeof useFirstLessonProgress>>()
}
