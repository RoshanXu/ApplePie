// ================================================================
// MiMo ASR — speech-to-text via Xiaomi MiMo chat completions
// ================================================================

import type { TtsConfig } from "@infiplot/types";
import { normalizeBaseUrl } from "./normalizeUrl";
import { fetchWithRetry } from "./fetchWithRetry";

interface AsrResult {
  text: string;
  audioTokens: number;
}

/**
 * Transcribe audio to Chinese text using MiMo's audio input capability.
 *
 * @param cfg   TTS config (MiMo uses same endpoint for both TTS and ASR).
 * @param audio Audio URL (https://...) or base64 data URI.
 * @returns     Transcribed text and token usage.
 */
export async function mimoTranscribe(
  cfg: TtsConfig,
  audio: string,
): Promise<AsrResult> {
  const baseUrl = normalizeBaseUrl(cfg.baseUrl, "openai_compatible");
  const endpoint = `${baseUrl}/chat/completions`;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const body = {
    model: cfg.speechModel, // e.g. "mimo-v2.5"
    messages: [
      {
        role: "system",
        content:
          `You are MiMo, an AI assistant developed by Xiaomi. Today is date: ${today}. Your knowledge cutoff date is December 2024.`,
      },
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: audio,
            },
          },
          {
            type: "text",
            text: "请将这段音频转写为中文文字，只输出转写结果，不要添加任何解释。",
          },
        ],
      },
    ],
    max_completion_tokens: 1024,
  };

  const res = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": cfg.apiKey,
    },
    body: JSON.stringify(body),
    retries: 1,
    timeoutMs: 30000,
  });

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        reasoning_content?: string;
      };
    }>;
    usage?: {
      prompt_tokens_details?: { audio_tokens?: number };
    };
    error?: { message?: string };
  };

  if (!res.ok || json.error) {
    throw new Error(
      `MiMo ASR ${res.status}: ${json.error?.message ?? JSON.stringify(json).slice(0, 300)}`,
    );
  }

  const msg = json.choices?.[0]?.message;
  const text = (msg?.content || msg?.reasoning_content || "").trim();

  return {
    text,
    audioTokens: json.usage?.prompt_tokens_details?.audio_tokens ?? 0,
  };
}
