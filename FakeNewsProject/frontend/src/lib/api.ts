export const API = "https://fakenewsproject-bltn.onrender.com/api";

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error("API error: " + res.status);
  return res.json();
}

export const api = {
  health: () => req("/health"),
  stats: () => req("/stats"),
  predict: (payload: { title?: string; text: string }) =>
    req("/predict", { method: "POST", body: JSON.stringify(payload) }),
  compare: (payload: { title_a?: string; text_a: string; title_b?: string; text_b: string }) =>
    req("/compare", { method: "POST", body: JSON.stringify(payload) }),
  keywords: (payload: { text: string; keyword: string }) =>
    req("/keywords", { method: "POST", body: JSON.stringify(payload) }),
  history: () => req("/history"),
  reports: () => req("/reports"),
  createReport: (payload: { title: string; content: string }) =>
    req("/reports", { method: "POST", body: JSON.stringify(payload) }),
};

export async function streamAI(
  payload: Record<string, unknown>,
  onDelta: (text: string) => void
): Promise<void> {
  const res = await fetch(API + "/ai/analysis/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error("Stream failed");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.delta) onDelta(parsed.delta);
      } catch {
        // ignore partial chunks
      }
    }
  }
}
