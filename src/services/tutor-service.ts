import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm"

import type { Lesson } from "@/domain/lesson"
import type { Correction, Message, TutorContext } from "@/domain/tutor"

import { modelManager } from "./model-manager"

export const MAX_TUTOR_INPUT_LENGTH = 240

const replySchema = JSON.stringify({
  type: "object",
  properties: {
    reply: { type: "string" },
    correction: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          properties: {
            originalText: { type: "string" },
            correctedText: { type: "string" },
            explanationPt: { type: "string" },
            category: { enum: ["grammar", "vocabulary", "word order"] },
          },
          required: ["originalText", "correctedText", "explanationPt", "category"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ["reply", "correction"],
  additionalProperties: false,
})

export class TutorFormatError extends Error {}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" && value.trim() && value.length <= maximum ? value.trim() : undefined
}

function readCorrection(value: unknown, learnerText: string): Correction | undefined {
  if (value === null) return undefined
  if (!object(value)) throw new TutorFormatError()

  const originalText = text(value.originalText, MAX_TUTOR_INPUT_LENGTH)
  const correctedText = text(value.correctedText, 280)
  const explanationPt = text(value.explanationPt, 360)
  const category = text(value.category, 45)
  if (!originalText || !correctedText || !explanationPt || !learnerText.includes(originalText) || originalText === correctedText) {
    throw new TutorFormatError()
  }
  return { originalText, correctedText, explanationPt, category }
}

function readReply(raw: string, learnerText: string) {
  const json = raw.replace(/^\s*<think>[\s\S]*?<\/think>/, "").trim()
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new TutorFormatError()
  }
  const reply = object(value) && text(value.reply, 400)
  if (!reply || !/\p{L}/u.test(reply) || !object(value)) throw new TutorFormatError()
  return { reply, correction: readCorrection(value.correction, learnerText) }
}

export async function respondAsTutor(context: TutorContext, messages: Message[], lesson?: Lesson) {
  const latest = messages.at(-1)
  if (latest?.role !== "learner") throw new Error("Não há mensagem para responder.")

  const instructions = [
    `You are a friendly English teacher for a ${context.level} beginner. Answer the student's message in simple English. Use up to two short sentences and finish with one simple question.`,
    "Keep your teaching role and use the JSON response schema. Put your actual answer in reply.",
    "Set correction to null when the message is correct or ambiguous. For a clear mistake, copy the exact excerpt into originalText, provide the corrected English in correctedText and explain briefly in Brazilian Portuguese in explanationPt.",
  ]
  if (context.mode === "guided") {
    if (!lesson || lesson.id !== context.lessonId) throw new Error("A lição não está disponível.")
    const { allowedVocabulary, correctionPolicyPt, goalPt, maxTurns } = lesson.guidedConversation
    const turn = messages.filter((message) => message.role === "learner").length
    instructions.push(`Lesson: ${goalPt} Vocabulary: ${allowedVocabulary.join(", ")}. ${correctionPolicyPt}`)
    if (turn >= maxTurns) instructions.push("Finish with a short goodbye instead of a question.")
  }

  const history: ChatCompletionMessageParam[] = messages.slice(-5).map((message) => ({
    role: message.role === "learner" ? "user" : "assistant",
    content: message === latest ? message.text : message.text.slice(0, 100),
  }))
  const raw = await modelManager.completeTurn([{ role: "system", content: instructions.join(" ") }, ...history], replySchema)
  return readReply(raw, latest.text)
}
