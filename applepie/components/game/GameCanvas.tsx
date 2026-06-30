"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Beat, BeatChoice } from "@infiplot/types";
import type { GamePhase } from "@applepie/game/client";

// ================================================================
// Typewriter hook
// ================================================================
function useTypewriter(text: string, resetKey: string, speedMs = 30) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const [prevKey, setPrevKey] = useState(resetKey);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on key change
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setShown("");
    setDone(false);
  }

  useEffect(() => {
    if (!text) return;

    let i = 0;
    setShown("");
    setDone(false);

    timerRef.current = setInterval(() => {
      i += 1;
      if (i >= text.length) {
        setShown(text);
        setDone(true);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setShown(text.slice(0, i + 1));
      }
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, resetKey, speedMs]);

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShown(text);
    setDone(true);
  }, [text]);

  return { shown, done, skip };
}

// ================================================================
// GameCanvas Props
// ================================================================
interface GameCanvasProps {
  phase: GamePhase;
  imageUrl: string | null;
  beat: Beat | null;
  choices: BeatChoice[] | null;
  error: string | null;
  sceneCount: number;
  /** Progress message during loading/generating */
  progressMsg?: string;
  /** Progress percentage 0-100 */
  progressPct?: number;
  /** Called when player taps to advance a continue beat */
  onAdvance: () => void;
  /** Called when player selects a choice */
  onSelectChoice: (choice: BeatChoice) => void;
  /** Called when player wants to start/restart */
  onStart?: () => void;
}

// ================================================================
// Component
// ================================================================
export function GameCanvas({
  phase,
  imageUrl,
  beat,
  choices,
  error,
  sceneCount,
  progressMsg,
  progressPct = 0,
  onAdvance,
  onSelectChoice,
  onStart,
}: GameCanvasProps) {
  // Typewriter for current beat text
  const displayText = beat?.narration ?? beat?.line ?? "";
  const speaker = beat?.speaker ?? "";
  const beatKey = beat?.id ?? "";

  const { shown, done, skip } = useTypewriter(displayText, beatKey, 35);

  // Handle tap
  const handleTap = () => {
    if (phase === "choosing") return; // Don't skip choices

    if (!done && phase === "playing") {
      // Skip typewriter
      skip();
      return;
    }

    if (done && phase === "playing") {
      // Advance to next beat
      onAdvance();
    }
  };

  // Loading / Generating state with progress bar
  if (phase === "loading" || phase === "generating") {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        {/* Background placeholder */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : null}
        <div className="relative z-10 text-center text-white px-8 w-full max-w-xs">
          {/* Icon */}
          <div className="text-4xl mb-6">
            {phase === "loading" ? "🌌" : "⏳"}
          </div>

          {/* Progress message */}
          <p className="text-base text-white/90 mb-4 font-medium">
            {progressMsg || (phase === "loading" ? "正在生成你的专属故事..." : "剧情发展中...")}
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPct, 8)}%` }}
            />
          </div>

          {/* Percentage */}
          <p className="text-xs text-white/40">{Math.round(progressPct)}%</p>

          {/* Scene count */}
          {sceneCount > 0 && (
            <p className="text-xs text-white/30 mt-3">第 {sceneCount} 幕</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (phase === "error") {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white px-8">
          <div className="text-4xl mb-4">😥</div>
          <h2 className="text-lg font-semibold mb-2">生成出错了</h2>
          <p className="text-sm text-white/60 mb-4">{error ?? "未知错误"}</p>
          {onStart && (
            <button
              onClick={onStart}
              className="px-6 py-2 bg-white/20 text-white rounded-full text-sm"
            >
              重新开始
            </button>
          )}
        </div>
      </div>
    );
  }

  // Idle / finished
  if (phase === "idle") {
    return (
      <div className="relative w-full h-screen bg-gradient-to-b from-indigo-900 to-black flex items-center justify-center">
        <div className="text-center text-white px-8">
          <div className="text-5xl mb-6">🎮</div>
          <h2 className="text-xl font-bold mb-2">准备好了吗？</h2>
          <p className="text-sm text-white/60 mb-6">AI 将为你生成一个专属的学习冒险故事</p>
          {onStart && (
            <button
              onClick={onStart}
              className="px-8 py-3 bg-brand text-white rounded-full text-base font-semibold shadow-lg"
            >
              开始游戏
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white px-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">冒险结束！</h2>
          <p className="text-sm text-white/60 mb-2">你完成了 {sceneCount} 个场景的旅程</p>
          <p className="text-xs text-white/40 mb-6">AI 正在分析你的学习表现...</p>
          {onStart && (
            <button
              onClick={onStart}
              className="px-6 py-2 bg-white/20 text-white rounded-full text-sm"
            >
              再来一局
            </button>
          )}
        </div>
      </div>
    );
  }

  // Playing / Choosing / Typing
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" onClick={handleTap}>
      {/* Background image */}
      {imageUrl && (
        <img
          key={imageUrl}
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Dark gradient fallback when no image */}
      {!imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

      {/* Scene count badge */}
      <div className="absolute top-4 right-4 z-20">
        <span className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white/60 text-xs">
          第 {sceneCount} 幕
        </span>
      </div>

      {/* Dialogue area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-8">
        {/* Speaker name */}
        {speaker && (
          <div className="mb-2">
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium">
              {speaker}
            </span>
          </div>
        )}

        {/* Dialogue text box */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 mb-3 border border-white/10 shadow-lg">
          <p className="text-white text-sm leading-relaxed min-h-[3em]">
            {shown}
            {!done && (
              <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* Choices */}
        {done && choices && choices.length > 0 && phase === "choosing" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChoice(choice);
                }}
                className="w-full text-left px-4 py-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm hover:bg-white/25 active:bg-white/30 transition-colors"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* Tap hint */}
        {done && (!choices || choices.length === 0) && (
          <div className="text-center">
            <span className="text-white/40 text-xs animate-pulse">轻触继续</span>
          </div>
        )}
      </div>
    </div>
  );
}
