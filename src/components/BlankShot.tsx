import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ParticleDust } from "./ParticleDust";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * 空镜头（blank shot）：刻意留白的静止画面。
 * 暗场 + 极缓慢的呼吸暗角 + 稀疏尘埃 + 可选的一行 faint 公式。
 * 为观众按下暂停，留出沉思与情感的余地。
 */
export const BlankShot: React.FC<{
  /** 底色 */
  tint?: string;
  /** 可选 faint 公式，如 "∫₀^∞ peace dt = ∞" */
  formula?: string;
  formulaColor?: string;
  delayFrames?: number;
  fadeInFrames?: number;
  fadeOutAt?: number;
}> = ({
  tint = "#04060c",
  formula,
  formulaColor = "#6a6353",
  delayFrames = 0,
  fadeInFrames = 50,
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;
  if (local < 0) return null;

  let opacity = interpolate(local, [0, fadeInFrames], [0, 1], clamp);
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 40, fadeOutAt], [1, 0], clamp);
  }
  if (opacity <= 0) return null;

  // 极缓慢的呼吸：暗角在 4 秒周期里轻轻起伏
  const breathe = 0.5 + 0.08 * Math.sin(local / 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: tint,
        opacity,
        zIndex: 16,
        pointerEvents: "none",
      }}
    >
      <ParticleDust count={14} color="#7d8494" seed={99} drift="float" />
      {/* 呼吸暗角 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${breathe}) 100%)`,
        }}
      />
      {formula && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "center",
            fontSize: 34,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            color: formulaColor,
            letterSpacing: 5,
            opacity: interpolate(local, [fadeInFrames, fadeInFrames + 40], [0, 0.75], clamp),
          }}
        >
          {formula}
        </div>
      )}
    </div>
  );
};
