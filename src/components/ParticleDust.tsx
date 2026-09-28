import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

/** mulberry32 种子伪随机 —— 保证逐帧渲染确定性 */
const mulberry32 = (seed: number) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface Particle {
  x: number; // %
  y: number; // %
  size: number; // px
  phase: number;
  speed: number;
  driftX: number;
  opacity: number;
}

export const ParticleDust: React.FC<{
  count?: number;
  color?: string;
  seed?: number;
  drift?: "up" | "float";
  speed?: number;
}> = ({ count = 50, color = "#9aa7b8", seed = 42, drift = "float", speed = 1 }) => {
  const frame = useCurrentFrame();

  // 粒子属性由种子预生成，不随帧变化
  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 3,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.7,
      driftX: (rand() - 0.5) * 20,
      opacity: 0.15 + rand() * 0.45,
    }));
  }, [count, seed]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {particles.map((p, i) => {
        const t = frame * 0.02 * speed * p.speed;
        const floatY = drift === "up" ? -(frame * 0.15 * p.speed) % 120 : Math.sin(t + p.phase) * 15;
        const floatX = Math.cos(t * 0.7 + p.phase) * p.driftX;
        const twinkle = 0.6 + 0.4 * Math.sin(frame * 0.08 * p.speed + p.phase);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: p.opacity * twinkle,
              transform: `translate(${floatX}px, ${floatY}px)`,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};
