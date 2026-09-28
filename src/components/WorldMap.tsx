import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AssetImage } from "./AssetImage";

export interface InkPoint {
  x: number; // %
  y: number; // %
  delay: number; // 帧
  maxR: number; // px
}

export interface MapNode {
  x: number; // %
  y: number; // %
  delay: number; // 帧
  label?: string;
}

export interface MapLink {
  from: number; // nodes 下标
  to: number;
  delay: number; // 画线开始帧
}

/** 解析 "x,y,delay,maxR; x,y,delay,maxR" 格式 */
export function parseInkPoints(s: string): InkPoint[] {
  return s.split(";").map((seg) => {
    const [x, y, delay, maxR] = seg.split(",").map(Number);
    return { x, y, delay, maxR: maxR || 320 };
  });
}

/** 解析 "x,y,delay,label; ..." 格式 */
export function parseNodes(s: string): MapNode[] {
  return s.split(";").map((seg) => {
    const parts = seg.split(",");
    return {
      x: Number(parts[0]),
      y: Number(parts[1]),
      delay: Number(parts[2]),
      label: parts[3]?.trim() || undefined,
    };
  });
}

/** 解析 "from-to,delay; ..." 格式 */
export function parseLinks(s: string): MapLink[] {
  return s.split(";").map((seg) => {
    const [pair, delay] = seg.split(",");
    const [from, to] = pair.split("-").map(Number);
    return { from, to, delay: Number(delay) };
  });
}

/**
 * 动态地图（技术难度最高组件）：
 * - mode "ink"     → 墨水扩散：SVG mask 内墨点错峰扩散 + blur 晕染，黑暗覆盖地图
 * - mode "network" → 光点网络：节点 spring 弹入 + 连线绘制 + 呼吸发光
 */
export const WorldMap: React.FC<{
  src: string;
  mode: "ink" | "network";
  inkPoints?: string; // "x,y,delay,maxR; ..."
  inkColor?: string;
  nodes?: string; // "x,y,delay,label; ..."
  links?: string; // "from-to,delay; ..."
  fadeInFrames?: number;
  fadeOutAt?: number;
  delayFrames?: number;
  fallbackColors?: [string, string];
}> = ({
  src,
  mode,
  inkPoints,
  inkColor = "#060a14",
  nodes,
  links,
  fadeInFrames = 40,
  fadeOutAt,
  delayFrames = 0,
  fallbackColors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delayFrames;
  if (local < 0) return null;

  let opacity = interpolate(local, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 40, fadeOutAt], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const points = inkPoints ? parseInkPoints(inkPoints) : [];
  const nodeList = nodes ? parseNodes(nodes) : [];
  const linkList = links ? parseLinks(links) : [];

  return (
    <div style={{ position: "absolute", inset: 0, opacity, overflow: "hidden" }}>
      <AssetImage
        src={src}
        fallbackColors={fallbackColors ?? ["#1c2634", "#0a0f1e"]}
      />

      {mode === "ink" && (
        <svg
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="inkBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={28} />
            </filter>
            <mask id="inkMask">
              <rect width="1920" height="1080" fill="black" />
              {points.map((p, i) => {
                const r = interpolate(
                  local,
                  [p.delay, p.delay + 60],
                  [0, p.maxR],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }
                );
                return (
                  <circle
                    key={i}
                    cx={(p.x / 100) * 1920}
                    cy={(p.y / 100) * 1080}
                    r={r}
                    fill="white"
                    filter="url(#inkBlur)"
                  />
                );
              })}
            </mask>
          </defs>
          {/* 黑暗从墨点向全图蔓延 */}
          <rect
            width="1920"
            height="1080"
            fill={inkColor}
            opacity={0.92}
            mask="url(#inkMask)"
          />
        </svg>
      )}

      {mode === "network" && (
        <svg
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* 连线：两端点都出现后开始绘制 */}
          {linkList.map((l, i) => {
            const a = nodeList[l.from];
            const b = nodeList[l.to];
            if (!a || !b) return null;
            const p = interpolate(local, [l.delay, l.delay + 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            return (
              <line
                key={i}
                x1={(a.x / 100) * 1920}
                y1={(a.y / 100) * 1080}
                x2={(b.x / 100) * 1920}
                y2={(b.y / 100) * 1080}
                stroke="#ffd700"
                strokeWidth={2.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                style={{ filter: "drop-shadow(0 0 6px #ffd700)" }}
                opacity={0.9}
              />
            );
          })}
          {/* 光点：spring 弹入 + 呼吸 */}
          {nodeList.map((n, i) => {
            const enter = spring({
              frame: local - n.delay,
              fps,
              config: { damping: 10, stiffness: 100 },
            });
            const breathe = 0.7 + 0.3 * Math.sin(local / 12 + i * 2);
            const cx = (n.x / 100) * 1920;
            const cy = (n.y / 100) * 1080;
            return (
              <g key={i} opacity={Math.max(0, Math.min(1, enter))}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={26 * enter}
                  fill="rgba(255, 215, 0, 0.18)"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.max(0.1, 7 * enter)}
                  fill="#ffd700"
                  opacity={breathe}
                  style={{ filter: "drop-shadow(0 0 10px #ffd700)" }}
                />
                {n.label && (
                  <text
                    x={cx}
                    y={cy - 30}
                    textAnchor="middle"
                    fill="#ffe9a8"
                    fontSize={30}
                    fontFamily="serif"
                    letterSpacing={4}
                    opacity={enter * breathe}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
