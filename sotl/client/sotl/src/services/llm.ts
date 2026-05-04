// frontend/src/services/llm.ts
export type LLMMessage = { sender: "user" | "system"; text: string };

type ChatResponse = { reply: string };
type ErrorResponse = { error?: string };

// Resolve API base in this order:
// 1) VITE_API_BASE
// 2) If running on Vite (517x), assume backend at http://localhost:5000
// 3) Same-origin relative
// 4) Fallback http://localhost:5000
function resolveApiBase(): string {
  const viteBase = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
  if (viteBase && viteBase.trim()) return viteBase.replace(/\/+$/, "");

  const isBrowser = typeof window !== "undefined" && !!window.location;
  if (isBrowser) {
    const { hostname, port, protocol } = window.location;
    const isViteDev = /^(5173|5174|5175)$/.test(port || "");
    if (isViteDev) return "http://localhost:5000"; // dev default
    // same-origin (nginx proxy /api → backend)
    return ""; // use relative: fetch('/api/...')
  }

  return "http://localhost:5000";
}

const API_BASE = resolveApiBase();
const toUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

async function jsonFetch<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 20000, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      if (contentType.includes("application/json")) {
        const errJson = (await res.json().catch(() => ({}))) as ErrorResponse;
        throw new Error(errJson.error || `HTTP ${res.status} ${res.statusText}`);
      }
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `HTTP ${res.status} ${res.statusText}`);
    }

    if (!contentType.includes("application/json")) {
      const txt = await res.text().catch(() => "");
      throw new Error(
        `Unexpected response content-type. Expected JSON. Body: ${txt?.slice(0, 200)}`
      );
    }

    return (await res.json()) as T;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Request to AI timed out. Please try again.");
    const msg =
      e?.message?.includes("Failed to fetch") || e?.message?.includes("NetworkError")
        ? "Network error contacting AI. Check backend URL or connection."
        : e?.message || "Unknown error contacting AI.";
    throw new Error(msg);
  } finally {
    clearTimeout(id);
  }
}

/** Quick health check */
export async function pingLLM(): Promise<{ ok: boolean; model?: string }> {
  try {
    return await jsonFetch<{ ok: boolean; model?: string }>(toUrl("/api/llm/ping"), {
      method: "GET",
      timeoutMs: 5000,
    });
  } catch {
    return { ok: false };
  }
}

/** Send chat messages to backend LLM */
export async function sendToLLM(messages: LLMMessage[], rolePrompt?: string): Promise<string> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages[] required");
  }
  const data = await jsonFetch<ChatResponse>(toUrl("/api/llm/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    timeoutMs: 30000,
    body: JSON.stringify({ messages, rolePrompt }),
  });
  return (data?.reply ?? "").toString();
}
