import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * 数学公式层：以衬线斜体呈现公式，如星言般浮现又隐去。
 * 公式既是信息载体，也是浪漫主义的抽象装饰。
 */
export const MathFormula: React.FC<{
  formula: string;
  /** 顶部位置，如 "24%"，默认居中 */
  top?: string;
  size?: number;
  color?: string;
  delayFrames?: number;
  fadeOutAt?: number;
}> = ({
  formula,
  top,
  size = 42,
  color = "#c9b98a",
  delayFrames = 0,
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;
  if (local < 0) return null;

  let opacity = interpolate(local, [0, 45], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 35, fadeOutAt], [1, 0], clamp);
  }
  if (opacity <= 0) return null;

  const rise = interpolate(local, [0, 45], [16, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        textAlign: "center",
        top: top ?? "50%",
        transform: top ? undefined : `translateY(calc(-50% + ${rise}px))`,
        opacity,
        zIndex: 18,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontSize: size,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          color,
          letterSpacing: 6,
          textShadow: `0 0 24px ${color}66`,
        }}
      >
        {formula}
      </span>
    </div>
  );
};
