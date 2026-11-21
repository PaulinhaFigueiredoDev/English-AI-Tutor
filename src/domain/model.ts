export interface TutorModel {
  id: string
  name: string
  estimatedDownloadBytes: number
  licenseName: string
  licenseUrl: string
  requiredFeatures: readonly GPUFeatureName[]
  evaluationCandidate?: boolean
  disableThinking?: boolean
}

export type ModelStatus =
  | { state: "unconfigured" }
  | { state: "downloading"; model: TutorModel; progress: number }
  | { state: "preparing" | "loading" | "testing" | "ready"; model: TutorModel }
  | { state: "error"; message: string; model?: TutorModel }

export type ModelCompatibility =
  | { state: "unchecked" | "checking" }
  | { state: "unsupported"; message: string }
  | { state: "compatible"; models: TutorModel[] }
