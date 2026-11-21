import type { LearnerLevel } from "./lesson"

export type TutorContext = { level: LearnerLevel } & (
  | { mode: "guided"; lessonId: string }
  | { mode: "free"; lessonId?: never }
)

export type TutorSession = TutorContext & {
  id: string
  startedAt: string
  updatedAt: string
}

export interface Correction {
  originalText: string
  correctedText: string
  explanationPt: string
  category?: string
}

export type Message = {
  id: string
  sessionId: string
  text: string
  createdAt: string
} & (
  | { role: "learner"; correction?: never }
  | { role: "tutor"; correction?: Correction }
)

export interface TutorHistory {
  session: TutorSession
  revision: string
  messages: Message[]
  failures: { kind: "format" | "generation"; createdAt: string }[]
}
