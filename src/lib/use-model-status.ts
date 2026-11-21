import { useSyncExternalStore } from "react"

import { modelManager } from "@/services/model-manager"

export function useModelStatus() {
  return useSyncExternalStore(modelManager.subscribe, modelManager.getSnapshot)
}
