// server/src/services/openai.ts
import OpenAI from "openai";

export const MODEL_ID =
  process.env.OPENAI_MODEL || "gpt-4o-mini";

export function makeOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    console.warn("⚠️ OPENAI_API_KEY is missing");
    return null;
  }

  return new OpenAI({
    apiKey: key,
  });
}

/**
 * Generate chat completion using OpenAI
 */
export async function generateChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  const client = makeOpenAIClient();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: MODEL_ID,
    messages,
  });

  return response.choices[0]?.message?.content ?? "";
}
