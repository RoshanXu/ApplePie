"use client";

// ================================================================
// Game Client — SSE stream consumer & session state manager
// ================================================================

import type {
  SceneStreamEvent,
  Scene,
  Character,
  StoryState,
  Session,
  Beat,
  BeatChoice,
} from "@infiplot/types";

/** Game phase */
export type GamePhase =
  | "idle"           // Not started
  | "loading"        // Waiting for first scene
  | "playing"        // Beat is being shown
  | "typing"         // Typewriter in progress
  | "choosing"       // Waiting for player choice
  | "generating"     // Waiting for next scene (SSE streaming)
  | "finished"       // Game over (no more scenes)
  | "error";         // Error state

/** Current game state */
export interface GameState {
  phase: GamePhase;
  sessionId: string | null;
  session: Session | null;
  currentScene: Scene | null;
  currentBeat: Beat | null;
  imageUrl: string | null;
  choices: BeatChoice[] | null;
  characters: Character[];
  storyState: StoryState | null;
  error: string | null;
  sceneCount: number;
}

/** Callbacks for state changes */
export interface GameClientCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onBeatChange: (beat: Beat) => void;
  onImageChange: (url: string) => void;
  onChoicesChange: (choices: BeatChoice[]) => void;
  onError: (error: string) => void;
}

/**
 * Parse SSE stream into typed events.
 */
async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SceneStreamEvent | { type: "done"; response: Record<string, unknown> }> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        yield data as SceneStreamEvent;
      } catch {
        // Skip malformed lines
      }
    }
  }
}

/**
 * Fetch and stream a game start request via SSE.
 * Returns the final done event response.
 */
export async function startGameStream(
  params: { theme?: string; difficulty?: string; duration?: number },
  callbacks: GameClientCallbacks
): Promise<{ sessionId: string; scene: Scene; imageUrl: string; characters: Character[]; storyState: StoryState }> {
  const res = await fetch("/api/game/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();

  for await (const event of parseSSEStream(reader)) {
    switch (event.type) {
      case "plan":
        // Plan ready — downstream media generation starts
        break;
      case "beat": {
        // Single beat received during streaming
        callbacks.onBeatChange((event as { type: "beat"; beat: Beat }).beat);
        break;
      }
      case "background":
        callbacks.onImageChange((event as { type: "background"; imageUrl: string }).imageUrl);
        break;
      case "choices":
        callbacks.onChoicesChange((event as { type: "choices"; choices: BeatChoice[] }).choices);
        break;
      case "done": {
        const resp = (event as { type: "done"; response: Record<string, unknown> }).response;
        return resp as unknown as { sessionId: string; scene: Scene; imageUrl: string; characters: Character[]; storyState: StoryState };
      }
      case "error":
        callbacks.onError((event as { type: "error"; message: string }).message);
        break;
    }
  }

  throw new Error("Stream ended without done event");
}

/**
 * Fetch the next scene via SSE.
 */
export async function requestSceneStream(
  session: Session,
  exit: { kind: "choice"; choiceId: string; label: string; nextSceneSeed: string },
  callbacks: GameClientCallbacks
): Promise<{ scene: Scene; imageUrl: string; characters: Character[]; storyState: StoryState }> {
  // Attach exit to session history
  const lastEntry = session.history[session.history.length - 1];
  const reqSession = {
    ...session,
    history: [
      ...session.history.slice(0, -1),
      { ...lastEntry, exit },
    ],
  };

  const res = await fetch("/api/game/scene", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ session: reqSession }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();

  for await (const event of parseSSEStream(reader)) {
    switch (event.type) {
      case "plan":
        break;
      case "beat": {
        callbacks.onBeatChange((event as { type: "beat"; beat: Beat }).beat);
        break;
      }
      case "background":
        callbacks.onImageChange((event as { type: "background"; imageUrl: string }).imageUrl);
        break;
      case "choices":
        callbacks.onChoicesChange((event as { type: "choices"; choices: BeatChoice[] }).choices);
        break;
      case "done": {
        const resp = (event as { type: "done"; response: Record<string, unknown> }).response;
        return resp as unknown as { scene: Scene; imageUrl: string; characters: Character[]; storyState: StoryState };
      }
      case "error":
        callbacks.onError((event as { type: "error"; message: string }).message);
        break;
    }
  }

  throw new Error("Stream ended without done event");
}
