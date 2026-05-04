// server/src/routes/llmRoutes.ts
import { Router } from "express";
import { generateChatCompletion } from "../services/openai";

type LLMMessage = { sender: "user" | "system"; text: string };

const router = Router();

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_KEY   = process.env.OPENAI_API_KEY || "";

/** POST /api/llm/chat  body: { messages: LLMMessage[], rolePrompt?: string } */
router.post("/chat", async (req, res) => {
  try {
    // Debug helper: ?echo=1 just returns the last user message
    if (req.query.echo === "1") {
      const { messages } = req.body as { messages: LLMMessage[] };
      const last = (messages || []).filter(m => m?.sender === "user").pop();
      return res.json({ reply: `[echo] ${last?.text || "(no text)"}` });
    }

    if (!OPENAI_KEY) {
      return res.status(503).json({ error: "Server missing OPENAI_API_KEY" });
    }

    const { messages, rolePrompt } = req.body as {
      messages?: LLMMessage[];
      rolePrompt?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    // Merge any system messages with the optional rolePrompt
    const sysFromMsgs = messages
      .filter(m => m?.sender === "system" && m?.text?.trim())
      .map(m => m.text.trim())
      .join("\n\n");

    const systemInstruction = [rolePrompt || "", sysFromMsgs || ""]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    // Map to OpenAI chat format
    const openAIMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    if (systemInstruction) {
      openAIMessages.push({ role: "system", content: systemInstruction });
    }

    for (const m of messages) {
      if (m?.sender === "user" && m?.text?.trim()) {
        openAIMessages.push({ role: "user", content: m.text });
      }
    }

    if (openAIMessages.filter(m => m.role === "user").length === 0) {
      return res.status(400).json({ error: "At least one user message is required" });
    }

    // Optional per-request model override (?model=...)
    const model = (req.query.model as string)?.trim() || OPENAI_MODEL;

    const reply = await generateChatCompletion(openAIMessages.map(m => ({ ...m })));
    if (!reply) {
      return res.status(502).json({ error: "AI generation failed: empty response" });
    }

    return res.json({ reply });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("❌ OpenAI error:", msg);
    const dev = process.env.NODE_ENV !== "production";
    return res.status(502).json({ error: dev ? `AI generation failed: ${msg}` : "AI generation failed" });
  }
});

/** GET /api/llm/ping */
router.get("/ping", (_req, res) => {
  res.json({ ok: !!OPENAI_KEY, model: OPENAI_MODEL });
});

export default router;
