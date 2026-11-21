import type { Lesson, MultipleChoiceExercise } from "@/domain/lesson"

import firstLessonSource from "../../curriculum/unit-01-lesson-01.json?raw"

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function listOf<T>(value: unknown, check: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.length > 0 && value.every(check)
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
}

function vocabularyEntry(value: unknown): value is Lesson["vocabulary"][number] {
  return record(value) && text(value.term) && text(value.translationPt) && text(value.example)
}

function grammarEntry(value: unknown): value is Lesson["grammar"][number] {
  return record(value) && text(value.ruleId) && text(value.explanationPt) && listOf(value.examples, text)
}

function isOptionIndex(options: string[], index: unknown): index is number {
  return typeof index === "number" && Number.isInteger(index) && index >= 0 && index < options.length
}

function exercise(value: unknown): value is MultipleChoiceExercise {
  return record(value) && value.type === "multiple-choice" && text(value.id) && text(value.promptPt) &&
    listOf(value.options, text) && value.options.length >= 2 &&
    isOptionIndex(value.options, value.correctOptionIndex) && text(value.feedbackPt)
}

function guidedConversation(value: unknown): value is Lesson["guidedConversation"] {
  return record(value) && text(value.goalPt) && positiveInteger(value.maxTurns) &&
    text(value.openingMessageEn) && listOf(value.allowedVocabulary, text) && text(value.correctionPolicyPt)
}

function isLesson(value: unknown): value is Lesson {
  if (!record(value) || value.schemaVersion !== "1.0" || !positiveInteger(value.contentVersion) ||
      !text(value.id) || !text(value.unitId) || !text(value.title) ||
      (value.level !== "pre-A1" && value.level !== "A1") || value.languageOfExplanation !== "pt-BR" ||
      !listOf(value.objectives, text) || !listOf(value.vocabulary, vocabularyEntry) ||
      !listOf(value.grammar, grammarEntry) || !listOf(value.exercises, exercise) ||
      !guidedConversation(value.guidedConversation) ||
      (value.editorialStatus !== undefined && !text(value.editorialStatus))) {
    return false
  }

  const exerciseIds = new Set(value.exercises.map((item) => item.id))
  const criteria = value.completionCriteria
  return exerciseIds.size === value.exercises.length && record(criteria) &&
    typeof criteria.guidedConversationRequired === "boolean" && listOf(criteria.requiredExerciseIds, text) &&
    new Set(criteria.requiredExerciseIds).size === criteria.requiredExerciseIds.length &&
    criteria.requiredExerciseIds.every((id) => exerciseIds.has(id))
}

export function parseLesson(source: string): Lesson | undefined {
  try {
    const value: unknown = JSON.parse(source)
    return isLesson(value) ? value : undefined
  } catch {
    return undefined
  }
}

export function gradeExercise(exercise: MultipleChoiceExercise, selectedOptionIndex: number) {
  if (!isOptionIndex(exercise.options, selectedOptionIndex)) {
    throw new RangeError("Opção inexistente no exercício.")
  }

  return selectedOptionIndex === exercise.correctOptionIndex
}

export const FIRST_LESSON_PATH = "/aulas/unit-01-lesson-01"
export const firstLesson = parseLesson(firstLessonSource)
