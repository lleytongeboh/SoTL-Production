import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GOOGLE_API_KEY;
if (!key) {
  console.error("NO GOOGLE_API_KEY");
  process.exit(1);
}

const modelId = process.env.GEMINI_MODEL || "gemini-1.5-flash";

try {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelId });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: "Say hi in five words" }] }],
  });

  console.log("OK:", result.response.text());
} catch (e) {
  console.error("ERR:", e.status ?? e.code ?? "", e.message);
  if (e.cause?.message) console.error("CAUSE:", e.cause.message);
}
