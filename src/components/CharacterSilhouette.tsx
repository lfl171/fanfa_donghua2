import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

type Variant = "father-child" | "child-run" | "soldier" | "nurse" | "worker";

/**
 * 人物剪影（SVG path）：
 * - father-child：父亲牵孩子，战前和平生活
 * - child-run：孩子奔跑，黎明结尾
 * 行走步伐由 sin 颠簸模拟，横向位移由 from/to + 帧区间驱动。
 */
export const CharacterSilhouette: React.FC<{
  variant: Variant;
  from?: number; // translateX %
  to?: number;
  startFrame?: number;
  endFrame?: number;
  scale?: number;
  color?: string;
}> = ({
  variant,
  from = -10,
  to = 110,
  startFrame = 0,
  endFrame = 340,
  scale = 1,
  color = "#0d0d0f",
}) => {
  const frame = useCurrentFrame();

  const x = interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  const bob = Math.sin(frame / 6) * 3; // 步伐颠簸
  const legSwing = Math.sin(frame / 6) * 12; // 腿部摆动角度

  const visible = frame >= startFrame && frame <= endFrame + 30;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "12%",
        left: `${x}%`,
        transform: `translateY(${bob}px) scale(${scale})`,
        width: 220,
        height: 300,
      }}
    >
      {variant === "father-child" ? (
        <svg viewBox="0 0 220 300" width="100%" height="100%">
          {/* 父亲 */}
          <g fill={color}>
            <circle cx={80} cy={52} r={20} />
            <path d={`M 80 72 L 74 150 L ${64 + legSwing * 0.4} 230 L 58 290 L 74 290 L ${80 + legSwing * 0.3} 210 L 86 290 L 102 290 L ${96 - legSwing * 0.4} 230 L 88 150 Z`} />
            {/* 伸向孩子的手臂 */}
            <path d="M 86 110 L 128 160 L 122 168 L 82 122 Z" />
          </g>
          {/* 孩子 */}
          <g fill={color}>
            <circle cx={150} cy={140} r={14} />
            <path d={`M 150 154 L 145 200 L ${140 - legSwing * 0.3} 250 L 136 285 L 148 285 L ${152 - legSwing * 0.2} 232 L 158 285 L 170 285 L ${164 + legSwing * 0.3} 250 L 158 200 Z`} />
            {/* 抬起牵手的手臂 */}
            <path d="M 146 170 L 124 162 L 126 154 L 148 162 Z" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 220 300" width="100%" height="100%">
          {/* 奔跑的孩子：身体前倾，双腿大跨步 */}
          <g fill={color}>
            <circle cx={115} cy={60} r={18} />
            <path
              d={`M 110 80 L 96 160 L ${60 + legSwing} 240 L 48 286 L 64 290 L ${88 + legSwing * 0.5} 210 L ${120 - legSwing} 236 L ${150 - legSwing * 0.6} 282 L 166 274 L ${136 - legSwing * 0.5} 196 L 130 120 Z`}
            />
            {/* 向后摆的手臂 */}
            <path d={`M 108 100 L ${70 - legSwing * 0.6} 150 L 78 160 L 112 118 Z`} />
            {/* 向前摆的手臂 */}
            <path d={`M 122 96 L ${156 + legSwing * 0.6} 132 L 148 142 L 118 112 Z`} />
          </g>
        </svg>
      )}
    </div>
  );
};
