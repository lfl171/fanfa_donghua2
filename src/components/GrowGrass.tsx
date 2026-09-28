import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** mulberry32 种子伪随机 */
const mulberry32 = (seed: number) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface Blade {
  x: number; // %
  h: number; // 高度 px
  lean: number; // 倾斜 deg
  delay: number; // 帧
  color: string;
}

const GREENS = ["#4a7c3a", "#5d9448", "#6fae56", "#3d6b30"];

/**
 * 第五幕：废墟上长出绿色植物。
 * SVG 草叶 spring scaleY 交错生长，寓意生命恢复。
 */
export const GrowGrass: React.FC<{
  count?: number;
  seed?: number;
  fadeOutAt?: number;
}> = ({ count = 20, seed = 11, fadeOutAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blades = useMemo<Blade[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: 2 + rand() * 96,
      h: 60 + rand() * 130,
      lean: (rand() - 0.5) * 30,
      delay: i * 6,
      color: GREENS[Math.floor(rand() * GREENS.length)],
    }));
  }, [count, seed]);

  const fadeOut =
    fadeOutAt !== undefined
      ? interpolate(frame, [fadeOutAt - 40, fadeOutAt], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {blades.map((b, i) => {
        const grow = spring({
          frame: frame - b.delay,
          fps,
          config: { damping: 12 },
        });
        const sway = Math.sin(frame / 25 + i) * 2;
        return (
          <svg
            key={i}
            viewBox="0 0 20 200"
            style={{
              position: "absolute",
              bottom: "8%",
              left: `${b.x}%`,
              width: 14,
              height: b.h,
              transform: `scaleY(${Math.max(0, grow)}) rotate(${b.lean + sway}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <path
              d="M 10 200 Q 6 120 10 20 Q 14 120 10 200"
              fill={b.color}
            />
          </svg>
        );
      })}
    </div>
  );
};
