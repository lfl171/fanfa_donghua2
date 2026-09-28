import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneConfig } from "../config/scene.schema";
import { FilmCamera } from "../components/FilmCamera";
import { SceneLayers } from "../components/SceneRenderer";
import { AudioPlaceholder } from "../components/AudioPlaceholder";

/**
 * 第四幕《黎明出现》120-150s（冷→暖关键转折）：
 * 黑白照片 + 胶片颗粒 → 扫光从左到右 → 彩色恢复
 */
export const Act4DawnAppears: React.FC<{ config: SceneConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round(config.duration * fps);

  // 胶片颗粒闪烁（扫光开始后渐弱）
  const grainBase = interpolate(frame, [150, 750], [0.06, 0.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const grain = grainBase + Math.sin(frame / 3) * 0.02;

  const outro = interpolate(frame, [860, 900], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d", overflow: "hidden" }}>
      <FilmCamera moves={config.camera} durationInFrames={duration} handheld>
        <SceneLayers layers={config.layers} />
        {/* 胶片颗粒 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-conic-gradient(rgba(255,255,255,0.5) 0% 0.0001%, transparent 0.0002% 0.0004%)",
            backgroundSize: "4px 4px",
            opacity: Math.max(0, grain),
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      </FilmCamera>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: 1 - outro }} />
      <AudioPlaceholder music={config.music} beatMarkers={config.beatMarkers} />
    </AbsoluteFill>
  );
};
