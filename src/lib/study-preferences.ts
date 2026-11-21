import { useSyncExternalStore } from "react"

import type { LearnerLevel } from "@/domain/lesson"

export const dailyGoals = [5, 10, 15, 20, 30] as const
export const studyFocuses = ["Conversação", "Vocabulário", "Gramática"] as const
export const studyLevelLabels: Record<LearnerLevel, string> = { "pre-A1": "Pré-A1", A1: "A1" }

interface StudyPreferences {
  name: string
  level: LearnerLevel
  dailyGoal: typeof dailyGoals[number]
  focus: typeof studyFocuses[number]
  reminder: boolean
  saveProgress: boolean
  reminderDismissedOn: string
}

const key = "english-ai-tutor:study-preferences"
const defaults: StudyPreferences = {
  name: "",
  level: "pre-A1",
  dailyGoal: 15,
  focus: "Conversação",
  reminder: false,
  saveProgress: true,
  reminderDismissedOn: "",
}

function readPreferences() {
  try {
    const saved: Partial<StudyPreferences> | null = JSON.parse(localStorage.getItem(key) ?? "null")
    if (!saved) return { preferences: defaults, preferencesUnavailable: false }

    return {
      preferences: {
        name: typeof saved.name === "string" ? saved.name.slice(0, 60) : defaults.name,
        level: saved.level === "A1" ? saved.level : defaults.level,
        dailyGoal: dailyGoals.find((goal) => goal === saved.dailyGoal) ?? defaults.dailyGoal,
        focus: studyFocuses.find((focus) => focus === saved.focus) ?? defaults.focus,
        reminder: typeof saved.reminder === "boolean" ? saved.reminder : defaults.reminder,
        saveProgress: typeof saved.saveProgress === "boolean" ? saved.saveProgress : defaults.saveProgress,
        reminderDismissedOn: typeof saved.reminderDismissedOn === "string" ? saved.reminderDismissedOn : "",
      },
      preferencesUnavailable: false,
    }
  } catch {
    return { preferences: defaults, preferencesUnavailable: true }
  }
}

let snapshot = readPreferences()
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

window.addEventListener("storage", (event) => {
  if (event.storageArea !== localStorage || (event.key !== key && event.key !== null)) return
  snapshot = readPreferences()
  notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function updateStudyPreferences(change: Partial<StudyPreferences>) {
  const current = snapshot.preferencesUnavailable ? snapshot.preferences : readPreferences().preferences
  const preferences = { ...current, ...change }
  try {
    localStorage.setItem(key, JSON.stringify(preferences))
    snapshot = { preferences, preferencesUnavailable: false }
  } catch {
    snapshot = { preferences, preferencesUnavailable: true }
  }
  notify()
}

export function useStudyPreferences() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
