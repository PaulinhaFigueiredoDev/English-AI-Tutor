export interface ExerciseAttempt {
  exerciseId: string
  selectedOptionIndex: number
  correct: boolean
  answeredAt: string
}

export interface LessonProgress {
  lessonId: string
  contentVersion: number
  startedAt: string
  attempts: ExerciseAttempt[]
  guidedConversationCompletedAt?: string
}
