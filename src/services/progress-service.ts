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

export function getStudyStreak(progress?: LessonProgress, today = new Date()) {
  if (!progress || Number.isNaN(today.getTime())) return 0

  const days = new Set(progress.attempts.map((attempt) => new Date(attempt.answeredAt).toDateString()))
  if (progress.guidedConversationCompletedAt) {
    days.add(new Date(progress.guidedConversationCompletedAt).toDateString())
  }

  const day = new Date(today)
  if (!days.has(day.toDateString())) day.setDate(day.getDate() - 1)

  let streak = 0
  while (days.has(day.toDateString())) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

export function getExercisesToReview(lesson: Lesson, progress?: LessonProgress) {
  const attemptedIncorrectly = new Set(
    progress?.attempts.filter((attempt) => !attempt.correct).map((attempt) => attempt.exerciseId),
  )
  return lesson.exercises.filter((exercise) => attemptedIncorrectly.has(exercise.id))
}
