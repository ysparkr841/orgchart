const BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL ?? "llama3.2:3b";
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? "qwen2.5vl:7b";
const TIMEOUT_MS = 30_000;

export interface OllamaMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // base64
}

export interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
}

export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new OllamaError(`Ollama 요청 타임아웃 (${timeoutMs}ms)`);
    }
    throw new OllamaError("Ollama 연결 실패", err);
  } finally {
    clearTimeout(timer);
  }
}

export async function chat(
  messages: OllamaMessage[],
  model: string = TEXT_MODEL,
  timeoutMs: number = TIMEOUT_MS,
): Promise<string> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
    },
    timeoutMs,
  );

  if (!res.ok) {
    throw new OllamaError(`Ollama HTTP ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as OllamaResponse;
  return data.message.content;
}

export async function chatWithImage(
  prompt: string,
  imageBase64: string,
  timeoutMs: number = TIMEOUT_MS,
): Promise<string> {
  return chat(
    [{ role: "user", content: prompt, images: [imageBase64] }],
    VISION_MODEL,
    timeoutMs,
  );
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/tags`,
      { method: "GET" },
      5_000,
    );
    return res.ok;
  } catch {
    return false;
  }
}
