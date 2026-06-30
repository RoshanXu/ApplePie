import "server-only";

import type { EngineConfig, ProviderProtocol } from "@infiplot/types";

const VALID_PROTOCOLS = [
  "openai_compatible",
  "openai",
  "runware",
] as const;

function readVar(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function readOptionalVar(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function readOptionalPositiveInt(name: string): number | undefined {
  const v = readOptionalVar(name);
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function readProvider(name: string): ProviderProtocol | undefined {
  const v = readOptionalVar(name)?.trim().toLowerCase();
  if (!v) return undefined;
  if ((VALID_PROTOCOLS as readonly string[]).includes(v)) {
    return v as ProviderProtocol;
  }
  throw new Error(
    `Invalid ${name}: "${v}". Must be one of: ${VALID_PROTOCOLS.join(", ")}`,
  );
}

/**
 * Load engine config from environment variables.
 * MVP: server-side keys only (no BYOK support).
 * TTS is optional — game runs silently when TTS_* vars are unset.
 */
export function loadEngineConfig(): EngineConfig {
  return {
    text: {
      baseUrl: readVar("TEXT_BASE_URL"),
      apiKey: readVar("TEXT_API_KEY"),
      model: readVar("TEXT_MODEL"),
      provider: readProvider("TEXT_PROVIDER"),
    },
    image: {
      baseUrl: readVar("IMAGE_BASE_URL"),
      apiKey: readVar("IMAGE_API_KEY"),
      model: readVar("IMAGE_MODEL"),
      provider: readProvider("IMAGE_PROVIDER"),
    },
    vision: {
      baseUrl: readVar("VISION_BASE_URL"),
      apiKey: readVar("VISION_API_KEY"),
      model: readVar("VISION_MODEL"),
      provider: readProvider("VISION_PROVIDER"),
    },
    tts: loadTtsConfig(),
    mockImage: readOptionalVar("MOCK_IMAGE") === "true",
    imageTimeoutMs: readOptionalPositiveInt("IMAGE_TIMEOUT_MS"),
    imageHedgeMs: readOptionalPositiveInt("IMAGE_HEDGE_MS"),
  };
}

function loadTtsConfig() {
  const baseUrl = readOptionalVar("TTS_BASE_URL");
  const apiKey = readOptionalVar("TTS_API_KEY");
  const speechModel = readOptionalVar("TTS_SPEECH_MODEL");
  if (!baseUrl || !apiKey || !speechModel) return undefined;
  return { baseUrl, apiKey, speechModel };
}
