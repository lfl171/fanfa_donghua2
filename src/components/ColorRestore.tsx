import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetImage } from "./AssetImage";
import { LightSweep } from "./LightSweep";

/**
 * 黑白变彩色三层叠加（第四幕视觉核心）：
 *   Layer1(底): 同图 grayscale 滤镜现算 → 黑白照片
 *   Layer2(中): 彩色原图，clipPath 随扫光进度从左向右揭示
 *   Layer3(顶): LightSweep 暖光扫过，mixBlendMode screen
 * 只存彩色原图，黑白由滤镜现算，保证两层像素级对齐。
 */
export const ColorRestore: React.FC<{
  src: string;
  sweepStart?: number; // 扫光开始的幕内帧
  sweepEnd?: number; // 扫光结束的幕内帧
  sweep?: boolean;
}> = ({ src, sweepStart = 150, sweepEnd = 750, sweep = true }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [sweepStart, sweepEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 扫光尾段整体饱和度提升，彩色"醒来"
  const saturate = interpolate(progress, [0.9, 1], [1, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* 底：黑白层（滤镜现算） */}
      <AssetImage
        src={src}
        fallbackColors={["#2a2f38", "#12151c"]}
        style={{ filter: "grayscale(1) brightness(0.9) contrast(1.08)" }}
      />
      {/* 中：彩色层，随扫光从左向右揭示 */}
      <AssetImage
        src={src}
        fallbackColors={["#c8a86a", "#7a5c34"]}
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          filter: `saturate(${saturate})`,
        }}
      />
      {/* 顶：扫光 */}
      {sweep && progress > 0 && progress < 1 && (
        <LightSweep progress={progress} />
      )}
      {/* 收尾暖金色调渐入 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255, 200, 120, 0.15)",
          opacity: interpolate(progress, [0.85, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
