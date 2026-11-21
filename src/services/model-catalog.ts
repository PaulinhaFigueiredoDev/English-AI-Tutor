import type { TutorModel } from "@/domain/model"

export const tutorModels: readonly TutorModel[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 0.5B Instruct",
    estimatedDownloadBytes: 291_000_000,
    licenseName: "Apache 2.0",
    licenseUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct",
    requiredFeatures: ["shader-f16"],
  },
  {
    id: "Qwen3-4B-q4f16_1-MLC",
    name: "Qwen3-4B",
    estimatedDownloadBytes: 2_280_000_000,
    licenseName: "Apache 2.0",
    licenseUrl: "https://huggingface.co/Qwen/Qwen3-4B",
    requiredFeatures: ["shader-f16"],
    evaluationCandidate: true,
    disableThinking: true,
  },
]
