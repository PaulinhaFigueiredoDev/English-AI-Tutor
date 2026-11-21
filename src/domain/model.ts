export interface TutorModel {
  id: string
  name: string
  estimatedDownloadBytes: number
  licenseName: string
  licenseUrl: string
}

export type ModelStatus =
  | { state: "unconfigured" | "checking" | "unsupported" }
  | { state: "downloading"; model: TutorModel; progress: number }
  | { state: "loading" | "testing" | "ready"; model: TutorModel }
  | { state: "error"; message: string; model?: TutorModel }
