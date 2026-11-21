const KEY = "english-ai-tutor:onboarding-complete"
let finishedInThisTab = false

export const ONBOARDING_PATH = "/configurar-ia"

export function hasFinishedOnboarding() {
  if (finishedInThisTab) return true

  try {
    return localStorage.getItem(KEY) === "true"
  } catch {
    return false
  }
}

export function finishOnboarding() {
  finishedInThisTab = true

  try {
    localStorage.setItem(KEY, "true")
  } catch {
    // O fluxo ainda pode ser dispensado na aba atual.
  }
}
