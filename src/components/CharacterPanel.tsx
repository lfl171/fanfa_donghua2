import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AssetImage } from "./AssetImage";

/**
 * 第三幕人物分格面板：四格（士兵/护士/工人/孩子）依次 spring 弹入，
 * 最后向中心收拢拼成电影海报构图，金边框亮起。
 * index 0-3 决定网格位（左上/右上/左下/右下）。
 */
export const CharacterPanel: React.FC<{
  src: string;
  title: string;
  index: number;
  delayFrames: number;
  /** 全部就位后开始收拢的帧（幕内全局帧），默认 1500 */
  gatherAt?: number;
  fadeOutAt?: number;
  /** 无面化：不渲染任何面孔/身份细节，只保留空白人形轮廓 */
  faceless?: boolean;
}> = ({ src, title, index, delayFrames, gatherAt = 1500, fadeOutAt = 1750, faceless = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // 收拢进度：向画面中心靠拢 4%
  const gather = interpolate(frame, [gatherAt, gatherAt + 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 网格位
  const col = index % 2;
  const row = Math.floor(index / 2);
  const baseLeft = 13 + col * 40; // %
  const baseTop = 10 + row * 44; // %

  // 向中心(50%, 50%)收拢
  const centerX = 31.5; // 面板中心应到的位置
  const centerY = 31;
  const curLeft = baseLeft + (centerX - baseLeft) * 0.13 * gather;
  const curTop = baseTop + (centerY - baseTop) * 0.13 * gather;

  const fadeOut = interpolate(frame, [fadeOutAt, fadeOutAt + 40], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 金边框在收拢后亮起
  const glow = interpolate(frame, [gatherAt + 100, gatherAt + 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: `${curLeft}%`,
        top: `${curTop}%`,
        width: "37%",
        height: "38%",
        opacity: Math.max(0, Math.min(1, enter)) * fadeOut,
        transform: `translateY(${(1 - enter) * 60}px)`,
        boxShadow: `0 0 ${glow * 24}px rgba(212, 175, 55, ${glow * 0.8})`,
        border: `${1 + glow * 2}px solid rgba(212, 175, 55, ${0.2 + glow * 0.8})`,
        borderRadius: 6,
        overflow: "hidden",
        background: "#14181f",
      }}
    >
      {faceless ? (
        /* 无面士兵：空白人形，没有面孔、没有身份——每一个无名者 */
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(170deg, #23262e 0%, #12141a 100%)",
          }}
        >
          <svg
            viewBox="0 0 400 300"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="facelessBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3d414c" />
                <stop offset="100%" stopColor="#1a1d24" />
              </linearGradient>
            </defs>
            {/* 头部：光滑椭圆，无五官 */}
            <ellipse cx={200} cy={118} rx={46} ry={56} fill="url(#facelessBody)" />
            {/* 肩部轮廓 */}
            <path
              d="M 96 300 C 100 216 144 182 200 182 C 256 182 300 216 304 300 Z"
              fill="url(#facelessBody)"
            />
            {/* 轮廓微光 */}
            <ellipse
              cx={200}
              cy={118}
              rx={46}
              ry={56}
              fill="none"
              stroke="rgba(212,175,55,0.25)"
              strokeWidth={1.5}
            />
          </svg>
        </div>
      ) : (
        <AssetImage src={src} fallbackColors={["#3a3f4a", "#1e222b"]} />
      )}
      {/* 底部角色名 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: "14px 0",
          textAlign: "center",
          background:
            "linear-gradient(transparent, rgba(0,0,0,0.75) 60%)",
          color: "#e8dcc0",
          fontSize: 30,
          fontFamily: "serif",
          letterSpacing: 10,
          opacity: interpolate(enter, [0.6, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {title}
      </div>
    </div>
  );
};
