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
 * 第三幕《世界联合抵抗》60-120s（视觉高潮）：
 * 世界地图光点网络 → 四人物分格弹入 → 收拢成海报构图
 */
export const Act3UnitedResistance: React.FC<{ config: SceneConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round(config.duration * fps);

  // 金色环境光随网络成型渐强
  const warmGlow = interpolate(frame, [400, 900], [0, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const outro = interpolate(frame, [1760, 1800], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1017", overflow: "hidden" }}>
      <FilmCamera moves={config.camera} durationInFrames={duration}>
        <SceneLayers layers={config.layers} />
        {/* 暖金环境光 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(255, 200, 100, 0.35) 0%, transparent 70%)",
            opacity: warmGlow,
            pointerEvents: "none",
          }}
        />
      </FilmCamera>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: 1 - outro }} />
      <AudioPlaceholder music={config.music} beatMarkers={config.beatMarkers} />
    </AbsoluteFill>
  );
};
