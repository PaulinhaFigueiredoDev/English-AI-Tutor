export type LearnerLevel = "pre-A1" | "A1"

export interface MultipleChoiceExercise {
  id: string
  type: "multiple-choice"
  promptPt: string
  options: string[]
  optionsLanguage?: "en" | "pt-BR"
  correctOptionIndex: number
  feedbackPt: string
  reviewTopicPt?: string
}

export interface Lesson {
  schemaVersion: "1.0"
  contentVersion: number
  id: string
  unitId: string
  title: string
  level: LearnerLevel
  languageOfExplanation: "pt-BR"
  objectives: string[]
  vocabulary: { term: string; translationPt: string; example: string }[]
  grammar: { ruleId: string; explanationPt: string; examples: string[] }[]
  exercises: MultipleChoiceExercise[]
  guidedConversation: {
    goalPt: string
    maxTurns: number
    openingMessageEn: string
    allowedVocabulary: string[]
    correctionPolicyPt: string
  }
  completionCriteria: {
    requiredExerciseIds: string[]
    guidedConversationRequired: boolean
  }
  editorialStatus?: string
}
