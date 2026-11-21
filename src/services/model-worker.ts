import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm"

const handler = new WebWorkerMLCEngineHandler()
self.addEventListener("message", (event) => handler.onmessage(event))
