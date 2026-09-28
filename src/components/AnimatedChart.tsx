import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Datum {
  label: string;
  value: number;
}

/** 解析 "1939,3; 1940,8; ..." 格式 */
export function parseChartData(s: string): Datum[] {
  return s.split(";").map((seg) => {
    const [label, v] = seg.split(",");
    return { label: label.trim(), value: Number(v) };
  });
}

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 绘图区几何（1920x1080）
const X0 = 300;
const X1 = 1680;
const YB = 840;
const YT = 400;

/**
 * 数据可视化图表（数学感 / 炫酷）：
 * - mode "line" → 折线：匀速画线 + 辉光扫描头 + 数据点 spring 弹入 + 面积渐变 + 大数字滚动计数器
 * - mode "bars" → 柱状：柱子错峰 spring 生长 + 柱顶数值滚动
 * 全部由 JSON 字符串驱动，与 WorldMap 同一套配置约定。
 */
export const AnimatedChart: React.FC<{
  mode?: "line" | "bars";
  /** "标签,值; 标签,值; ..." */
  data: string;
  title?: string;
  subtitle?: string;
  /** y 轴单位，如 "百万" */
  yUnit?: string;
  /** 折线主色 */
  color?: string;
  /** 计数器/强调色 */
  accent?: string;
  /** 大数字滚动目标值（原始数值，自动加千分位） */
  counterTo?: number;
  counterLabel?: string;
  /** 柱状模式：高亮第 N 根柱子（用 accent 金色） */
  highlightIndex?: number;
  /** 画线持续帧数 */
  drawFrames?: number;
  delayFrames?: number;
  fadeOutAt?: number;
}> = ({
  mode = "line",
  data: dataStr,
  title,
  subtitle,
  yUnit = "",
  color = "#ff5a3c",
  accent = "#f2d38a",
  counterTo,
  counterLabel,
  highlightIndex,
  drawFrames = 150,
  delayFrames = 0,
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delayFrames;

  const data = parseChartData(dataStr);
  const maxV = Math.max(...data.map((d) => d.value));
  let yMax = Math.ceil(maxV / 10) * 10;
  if (yMax <= maxV) yMax += 10;

  const n = data.length;
  // 折线：点铺满两端；柱状：柱子居中于各自槽位，避免压到 y 轴刻度
  const px = (i: number) =>
    mode === "bars"
      ? X0 + ((i + 0.5) / n) * (X1 - X0)
      : n === 1
        ? (X0 + X1) / 2
        : X0 + (i / (n - 1)) * (X1 - X0);
  const py = (v: number) => YB - (v / yMax) * (YB - YT);
  const pts = data.map((d, i) => ({ x: px(i), y: py(d.value), ...d }));

  // 折线累计长度（用于描画进度 → 数据点时机 / 扫描头位置）
  const segLens: number[] = [];
  let totalLen = 0;
  for (let i = 1; i < n; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segLens.push(l);
    totalLen += l;
  }
  const cumT: number[] = [0];
  {
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      acc += segLens[i];
      cumT.push(acc / totalLen);
    }
  }

  const DRAW_START = 45;
  // 画线进度：匀速（扫描头位置才精确）
  const p = interpolate(local, [DRAW_START, DRAW_START + drawFrames], [0, 1], {
    ...clamp,
  });

  // 整体透明度
  let opacity = interpolate(local, [0, 22], [0, 1], { ...clamp });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 40, fadeOutAt], [1, 0], {
      ...clamp,
    });
  }
  if (opacity <= 0) return null;

  // 标题入场
  const titleP = interpolate(local, [0, 25], [0, 1], { ...clamp, easing: EASE });

  // 计数器滚动（与画线进度严格同步：线性，扫描头到哪儿数字滚到哪儿）
  const counter =
    counterTo !== undefined
      ? Math.round(
          interpolate(local, [DRAW_START, DRAW_START + drawFrames], [0, counterTo], {
            ...clamp,
          })
        )
      : 0;

  // 扫描头位置（按弧长比例在折线段上插值）
  const tipAt = (t: number) => {
    if (t <= 0) return pts[0];
    if (t >= 1) return pts[n - 1];
    const target = t * totalLen;
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      if (acc + segLens[i] >= target) {
        const k = (target - acc) / segLens[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * k,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * k,
        };
      }
      acc += segLens[i];
    }
    return pts[n - 1];
  };
  const tip = tipAt(p);

  const lineD = pts
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");
  const areaD = `${lineD} L ${pts[n - 1].x} ${YB} L ${pts[0].x} ${YB} Z`;

  const gridRows = [0, 1, 2, 3, 4].map((k) => ({
    v: (yMax / 4) * k,
    y: py((yMax / 4) * k),
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
        zIndex: 15,
      }}
    >
      {/* 标题区 */}
      {title && (
        <div
          style={{
            position: "absolute",
            left: X0 - 40,
            top: 150,
            opacity: titleP,
            transform: `translateY(${20 * (1 - titleP)}px)`,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: "bold",
              fontFamily: "serif",
              color: "#e8e4da",
              letterSpacing: 10,
              textShadow: "0 0 26px rgba(232,228,218,0.35)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 24,
                fontFamily: "serif",
                color: "#8a94a6",
                letterSpacing: 5,
                marginTop: 14,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* 大数字计数器 */}
      {counterTo !== undefined && (
        <div
          style={{
            position: "absolute",
            right: 1920 - X1 - 20,
            top: 130,
            textAlign: "right",
            opacity: titleP,
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: "bold",
              fontFamily: "serif",
              fontVariantNumeric: "tabular-nums",
              color: accent,
              letterSpacing: 2,
              textShadow: `0 0 34px ${accent}88`,
            }}
          >
            {counter.toLocaleString("en-US")}
          </div>
          {counterLabel && (
            <div
              style={{
                fontSize: 24,
                fontFamily: "serif",
                color: "#8a94a6",
                letterSpacing: 6,
                marginTop: 6,
              }}
            >
              {counterLabel}
            </div>
          )}
        </div>
      )}

      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="chartBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.25} />
          </linearGradient>
          <linearGradient id="chartBarGradHi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.25} />
          </linearGradient>
        </defs>

        {/* 网格：横向 + 纵向，错峰淡入 */}
        {gridRows.map((g, k) => {
          const gOp = interpolate(local, [8 + k * 4, 26 + k * 4], [0, 1], clamp);
          return (
            <g key={k} opacity={gOp}>
              <line
                x1={X0}
                y1={g.y}
                x2={X1}
                y2={g.y}
                stroke={k === 0 ? "rgba(232,228,218,0.35)" : "rgba(232,228,218,0.09)"}
                strokeWidth={k === 0 ? 2 : 1}
              />
              <text
                x={X0 - 20}
                y={g.y + 8}
                textAnchor="end"
                fill="#8a94a6"
                fontSize={24}
                fontFamily="serif"
              >
                {g.v}
                {k === 4 && yUnit ? ` ${yUnit}` : ""}
              </text>
            </g>
          );
        })}
        {pts.map((pt, i) => (
          <g key={`v${i}`} opacity={0.5}>
            <line
              x1={pt.x}
              y1={YT - 10}
              x2={pt.x}
              y2={YB}
              stroke="rgba(232,228,218,0.05)"
              strokeWidth={1}
            />
            <text
              x={pt.x}
              y={YB + 46}
              textAnchor="middle"
              fill={i === highlightIndex ? accent : "#8a94a6"}
              fontSize={i === highlightIndex ? 30 : 26}
              fontFamily="serif"
              letterSpacing={2}
              opacity={interpolate(
                local,
                [
                  DRAW_START + (mode === "bars" ? i * 10 : cumT[i] * drawFrames),
                  DRAW_START + (mode === "bars" ? i * 10 : cumT[i] * drawFrames) + 15,
                ],
                [0, 1],
                clamp
              )}
            >
              {pt.label}
            </text>
          </g>
        ))}

        {mode === "line" && (
          <>
            {/* 面积渐变：随画线进度显现 */}
            <path d={areaD} fill="url(#chartAreaGrad)" opacity={p * 0.9} />
            {/* 辉光底层 + 主折线：pathLength 描画 */}
            <path
              d={lineD}
              fill="none"
              stroke={color}
              strokeWidth={11}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              opacity={0.3}
              style={{ filter: `drop-shadow(0 0 14px ${color})` }}
            />
            <path
              d={lineD}
              fill="none"
              stroke="url(#chartLineGrad)"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
            {/* 扫描头：竖直扫描线 + 辉光点 */}
            {p > 0 && p < 1 && (
              <g>
                <line
                  x1={tip.x}
                  y1={YT - 16}
                  x2={tip.x}
                  y2={YB}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="6 8"
                  opacity={0.4}
                />
                <circle cx={tip.x} cy={tip.y} r={26} fill={color} opacity={0.25} />
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r={9}
                  fill="#fff"
                  style={{ filter: `drop-shadow(0 0 12px ${color})` }}
                />
              </g>
            )}
            {/* 数据点：折线到达时 spring 弹入 + 数值标签 */}
            {pts.map((pt, i) => {
              const dotFrame = DRAW_START + cumT[i] * drawFrames;
              const pop = spring({
                frame: local - dotFrame,
                fps,
                config: { damping: 11, stiffness: 160 },
              });
              if (local < dotFrame) return null;
              return (
                <g key={`d${i}`}>
                  <circle cx={pt.x} cy={pt.y} r={16 * pop} fill={color} opacity={0.3} />
                  <circle cx={pt.x} cy={pt.y} r={Math.max(0.1, 6.5 * pop)} fill="#fff" />
                  <text
                    x={pt.x}
                    y={pt.y - 26 - 8 * (1 - pop)}
                    textAnchor="middle"
                    fill="#e8e4da"
                    fontSize={27}
                    fontFamily="serif"
                    fontWeight="bold"
                    opacity={pop}
                    style={{ textShadow: `0 0 10px ${color}` }}
                  >
                    {pt.value}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {mode === "bars" &&
          pts.map((pt, i) => {
            const barFrame = DRAW_START + i * 10;
            const grow = spring({
              frame: local - barFrame,
              fps,
              config: { damping: 14, stiffness: 90 },
            });
            if (local < barFrame) return null;
            const bw = Math.min(130, ((X1 - X0) / n) * 0.5);
            const h = (pt.value / yMax) * (YB - YT) * Math.max(0, grow);
            const shown = Math.round(
              interpolate(Math.max(0, Math.min(1, grow)), [0, 1], [0, pt.value])
            );
            const hi = i === highlightIndex;
            const barColor = hi ? accent : color;
            return (
              <g key={`b${i}`}>
                {hi && (
                  <rect
                    x={pt.x - bw / 2 - 10}
                    y={YB - h - 10}
                    width={bw + 20}
                    height={h + 10}
                    rx={8}
                    fill={accent}
                    opacity={0.12 * grow}
                  />
                )}
                <rect
                  x={pt.x - bw / 2}
                  y={YB - h}
                  width={bw}
                  height={h}
                  rx={4}
                  fill={hi ? "url(#chartBarGradHi)" : "url(#chartBarGrad)"}
                  style={{ filter: `drop-shadow(0 0 ${hi ? 18 : 10}px ${barColor}${hi ? "aa" : "66"})` }}
                />
                <text
                  x={pt.x}
                  y={YB - h - 18}
                  textAnchor="middle"
                  fill={hi ? accent : "#e8e4da"}
                  fontSize={hi ? 36 : 30}
                  fontFamily="serif"
                  fontWeight="bold"
                  opacity={grow}
                  style={hi ? { filter: `drop-shadow(0 0 12px ${accent})` } : undefined}
                >
                  {shown}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
};
