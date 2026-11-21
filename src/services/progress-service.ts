import type { Lesson, MultipleChoiceExercise } from "@/domain/lesson"
import type { ExerciseAttempt, LessonProgress } from "@/domain/progress"

import { gradeExercise } from "./lesson-service"

export function startLesson(lesson: Lesson): LessonProgress {
  return {
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    startedAt: new Date().toISOString(),
    attempts: [],
  }
}

export function createAttempt(exercise: MultipleChoiceExercise, selectedOptionIndex: number): ExerciseAttempt {
  return {
    exerciseId: exercise.id,
    selectedOptionIndex,
    correct: gradeExercise(exercise, selectedOptionIndex),
    answeredAt: new Date().toISOString(),
  }
}

export function appendAttempt(progress: LessonProgress, attempt: ExerciseAttempt): LessonProgress {
  if (progress.attempts.some((saved) => saved.exerciseId === attempt.exerciseId && saved.correct)) {
    return progress
  }

  return { ...progress, attempts: [...progress.attempts, attempt] }
}

export function summarizeLesson(lesson: Lesson, progress?: LessonProgress) {
  const { requiredExerciseIds, guidedConversationRequired } = lesson.completionCriteria
  const correctIds = new Set(progress?.attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.exerciseId))
  const exercisesCorrect = requiredExerciseIds.filter((id) => correctIds.has(id)).length
  const exerciseCount = requiredExerciseIds.length
  const conversationPending = guidedConversationRequired && !progress?.guidedConversationCompletedAt

  return {
    exercisesCorrect,
    exerciseCount,
    conversationPending,
    completed: exercisesCorrect === exerciseCount && !conversationPending,
  }
}
