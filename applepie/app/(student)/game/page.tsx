"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GameCanvas } from "@/components/game/GameCanvas";
import { startGameStream, requestSceneStream, type GamePhase } from "@applepie/game/client";
import type { Session, Scene, Character, StoryState, Beat, BeatChoice, BeatChoiceEffect } from "@infiplot/types";
import Link from "next/link";

// ================================================================
// localStorage keys for game session persistence
// ================================================================
const SAVE_KEY = "applepie_game_save";

// ================================================================
// Game entry cards (shown before game starts)
// ================================================================
function GameEntry({
  onStart,
  hasSave,
  onContinue,
}: {
  onStart: (theme: string) => void;
  hasSave: boolean;
  onContinue: () => void;
}) {
  const [starting, setStarting] = useState(false);

  const handleStart = async (theme: string) => {
    setStarting(true);
    onStart(theme);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <h1 className="text-xl font-bold text-foreground">🎮 AI 互动游戏</h1>

      {/* Continue saved game */}
      {hasSave && (
        <button
          onClick={onContinue}
          disabled={starting}
          className="w-full text-left bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-4 text-white disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">▶️</span>
            <div>
              <h2 className="text-base font-bold">继续上次的游戏</h2>
              <p className="text-xs text-white/70 mt-0.5">从上次离开的节点继续冒险</p>
            </div>
          </div>
        </button>
      )}

      <button
        onClick={() => handleStart("space")}
        disabled={starting}
        className="w-full text-left bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white disabled:opacity-50"
      >
        <div className="text-3xl mb-3">🌌</div>
        <h2 className="text-lg font-bold">星际探险</h2>
        <p className="text-sm text-white/80 mt-1">
          在浩瀚宇宙中解开数学与物理的谜题
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs">约 20 分钟</span>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs">难度：中等</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleStart("history")}
          disabled={starting}
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors text-left disabled:opacity-50"
        >
          <div className="text-2xl">🏛️</div>
          <div className="text-sm font-semibold text-foreground mt-2">古文明解密</div>
          <div className="text-xs text-muted mt-1">文史向 · 历史探秘</div>
        </button>
        <button
          onClick={() => handleStart("ecology")}
          disabled={starting}
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors text-left disabled:opacity-50"
        >
          <div className="text-2xl">🌿</div>
          <div className="text-sm font-semibold text-foreground mt-2">生态守护</div>
          <div className="text-xs text-muted mt-1">生物地理向</div>
        </button>
      </div>

      {starting && (
        <div className="text-center text-sm text-muted animate-pulse">
          正在启动 AI 引擎...
        </div>
      )}
    </div>
  );
}

// ================================================================
// Main Game Page
// ================================================================
export default function GamePage() {
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [beat, setBeat] = useState<Beat | null>(null);
  const [choices, setChoices] = useState<BeatChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sceneCount, setSceneCount] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [hasSave, setHasSave] = useState(false);

  // Check for saved game on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) setHasSave(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Save game state to localStorage
  const saveGame = useCallback(() => {
    const session = sessionRef.current;
    const scene = sceneRef.current;
    if (!session || !scene) return;
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          session,
          currentScene: scene,
          imageUrl,
          beat,
          sceneCount,
          savedAt: Date.now(),
        })
      );
      setHasSave(true);
    } catch {
      // localStorage full or unavailable
    }
  }, [imageUrl, beat, sceneCount]);

  // Clear saved game
  const clearSave = useCallback(() => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
    setHasSave(false);
  }, []);

  // Mutable refs for session (avoids stale closures in SSE callbacks)
  const sessionRef = useRef<Session | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const resolveChoicesRef = useRef<((exit: { kind: "choice"; choiceId: string; label: string; nextSceneSeed: string }) => void) | null>(null);

  // Navigate beats within current scene
  const navigateToBeat = useCallback((beatId: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const nextBeat = scene.beats.find((b) => b.id === beatId);
    if (!nextBeat) return;

    setBeat(nextBeat);

    // Check if this beat has choices
    if (nextBeat.next.type === "choice") {
      setChoices(nextBeat.next.choices);
      setPhase("choosing");
    } else {
      setChoices(null);
      setPhase("playing");
    }
  }, []);

  // Advance past a continue beat
  const handleAdvance = useCallback(() => {
    const currentBeat = beat;
    if (!currentBeat) return;

    if (currentBeat.next.type === "continue") {
      navigateToBeat(currentBeat.next.nextBeatId);
    }
    // If choice beat, tap doesn't advance (player must pick)
  }, [beat, navigateToBeat]);

  // Handle choice selection
  const handleSelectChoice = useCallback(async (choice: BeatChoice) => {
    const effect: BeatChoiceEffect = choice.effect;

    if (effect.kind === "advance-beat") {
      // Stay within scene — just navigate
      navigateToBeat(effect.targetBeatId);
      return;
    }

    if (effect.kind === "change-scene") {
      // Scene transition — call API
      setPhase("generating");
      setChoices(null);

      const session = sessionRef.current;
      if (!session) {
        setError("Session lost");
        setPhase("error");
        return;
      }

      try {
        const exit = {
          kind: "choice" as const,
          choiceId: choice.id,
          label: choice.label,
          nextSceneSeed: effect.nextSceneSeed,
        };

        const result = await requestSceneStream(session, exit, {
          onPhaseChange: (p) => {
            setPhase(p);
            if (p === "generating") {
              setProgressMsg("正在构思下一幕...");
              setProgressPct(10);
            }
          },
          onBeatChange: (b) => {
            setBeat(b);
            setProgressMsg("剧情生成中...");
            setProgressPct((prev) => Math.min(prev + 8, 60));
          },
          onImageChange: (url) => {
            setImageUrl(url);
            setProgressMsg("画面绘制完成");
            setProgressPct(80);
          },
          onChoicesChange: (c) => {
            setChoices(c);
            setProgressMsg("即将就绪...");
            setProgressPct(90);
          },
          onError: (e) => setError(e),
        });

        // Update scene
        sceneRef.current = result.scene;

        // Update session
        const newEntry = {
          scene: result.scene,
          visitedBeatIds: [result.scene.entryBeatId],
          exit,
        };

        sessionRef.current = {
          ...session,
          history: [...session.history, newEntry],
          characters: result.characters,
          storyState: result.storyState,
        };

        setImageUrl(result.imageUrl);
        setSceneCount((c) => c + 1);
        navigateToBeat(result.scene.entryBeatId);

        // Save after scene loads
        setTimeout(() => saveGame(), 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scene fetch failed");
        setPhase("error");
      }
    }
  }, [navigateToBeat]);

  // Start game
  const handleStart = useCallback(async (theme: string) => {
    clearSave(); // New game replaces any saved progress
    setPlaying(true);
    setPhase("loading");
    setError(null);
    setProgressMsg("正在连接 AI 引擎...");
    setProgressPct(5);

    try {
      const result = await startGameStream(
        { theme, difficulty: "normal", duration: 20 },
        {
          onPhaseChange: (p) => {
            setPhase(p);
            if (p === "generating") {
              setProgressMsg("正在构思下一幕...");
              setProgressPct(10);
            }
          },
          onBeatChange: (b) => {
            setBeat(b);
            setProgressMsg("剧情生成中...");
            setProgressPct((prev) => Math.min(prev + 8, 60));
          },
          onImageChange: (url) => {
            setImageUrl(url);
            setProgressMsg("画面绘制完成");
            setProgressPct(80);
          },
          onChoicesChange: (c) => {
            setChoices(c);
            setProgressMsg("即将就绪...");
            setProgressPct(90);
          },
          onError: (e) => setError(e),
        }
      );

      // Build initial session
      const initialSession: Session = {
        id: result.sessionId,
        createdAt: Date.now(),
        worldSetting: "", // Stored server-side, not needed on client
        styleGuide: "",
        history: [
          {
            scene: result.scene,
            visitedBeatIds: [result.scene.entryBeatId],
          },
        ],
        characters: result.characters,
        storyState: result.storyState,
      };

      sessionRef.current = initialSession;
      sceneRef.current = result.scene;
      setImageUrl(result.imageUrl);
      setSceneCount(1);

      // Navigate to entry beat
      const entryBeat = result.scene.beats.find((b) => b.id === result.scene.entryBeatId);
      if (entryBeat) {
        setBeat(entryBeat);
        if (entryBeat.next.type === "choice") {
          setChoices(entryBeat.next.choices);
          setPhase("choosing");
        } else {
          setPhase("playing");
        }
      }

      // Save game after first scene loads
      setTimeout(() => saveGame(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
      setPhase("error");
    }
  }, []);

  // Continue from saved game
  const handleContinue = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      sessionRef.current = saved.session;
      sceneRef.current = saved.currentScene;
      setImageUrl(saved.imageUrl ?? null);
      setSceneCount(saved.sceneCount ?? 1);
      setPlaying(true);
      setPhase("playing");

      // Restore current beat
      const entryBeat = saved.currentScene?.beats?.find(
        (b: Beat) => b.id === saved.currentScene.entryBeatId
      );
      if (entryBeat) {
        setBeat(entryBeat);
        if (entryBeat.next?.type === "choice") {
          setChoices(entryBeat.next.choices);
          setPhase("choosing");
        }
      }
    } catch {
      clearSave();
    }
  }, [clearSave]);

  // Reset to entry
  const handleReset = useCallback(() => {
    clearSave();
    setPlaying(false);
    setPhase("idle");
    setImageUrl(null);
    setBeat(null);
    setChoices(null);
    setError(null);
    setSceneCount(0);
    sessionRef.current = null;
    sceneRef.current = null;
  }, [clearSave]);

  if (!playing) {
    return (
      <GameEntry
        onStart={handleStart}
        hasSave={hasSave}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <GameCanvas
      phase={phase}
      imageUrl={imageUrl}
      beat={beat}
      choices={choices}
      error={error}
      sceneCount={sceneCount}
      progressMsg={progressMsg}
      progressPct={progressPct}
      onAdvance={handleAdvance}
      onSelectChoice={handleSelectChoice}
      onStart={handleReset}
    />
  );
}
