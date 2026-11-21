import type { TutorModel } from "@/domain/model"

export const tutorModels: readonly TutorModel[] = [
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M Instruct",
    estimatedDownloadBytes: 213_000_000,
    licenseName: "Apache 2.0",
    licenseUrl: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct",
    requiredFeatures: ["shader-f16"],
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 0.5B Instruct",
    estimatedDownloadBytes: 291_000_000,
    licenseName: "Apache 2.0",
    licenseUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct",
    requiredFeatures: ["shader-f16"],
  },
]
