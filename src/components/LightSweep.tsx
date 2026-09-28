import React from "react";

/**
 * 光线扫过条：一道倾斜的暖光从左向右扫过画面。
 * progress 由父组件 interpolate 驱动（0-1）。
 */
export const LightSweep: React.FC<{
  progress: number;
  color?: string;
  angle?: number;
}> = ({ progress, color = "rgba(255, 214, 140, 0.85)", angle = 8 }) => {
  const left = progress * 130 - 15; // -15% → 115%

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: `${left}%`,
          width: "18%",
          height: "140%",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          filter: "blur(30px)",
          transform: `rotate(${angle}deg)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};
