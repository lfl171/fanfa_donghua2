import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneConfig } from "../config/scene.schema";
import { FilmCamera } from "../components/FilmCamera";
import { SceneLayers } from "../components/SceneRenderer";
import { AudioPlaceholder } from "../components/AudioPlaceholder";

/**
 * 第一幕《和平破碎之前》0-25s：
 * 纯黑开场 → 灰色光束 → 尘埃 → 文字 → 报纸展开 → 照片脱离 → 街道生活剪影
 */
export const Act1PeaceBefore: React.FC<{ config: SceneConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round(config.duration * fps);

  // 开场灰色光束（0-90）：从顶部垂下，渐亮
  const beamOpacity = interpolate(frame, [0, 60], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beamScaleY = interpolate(frame, [0, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const beamFade = interpolate(frame, [180, 320], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 幕尾整体渐隐
  const outro = interpolate(frame, [700, 750], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070c", overflow: "hidden" }}>
      <FilmCamera moves={config.camera} durationInFrames={duration}>
        {/* 顶部灰色光束 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "35%",
            width: "30%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(154,167,184,0.55) 0%, rgba(154,167,184,0.08) 60%, transparent 100%)",
            transform: `scaleY(${beamScaleY})`,
            transformOrigin: "top center",
            opacity: beamOpacity * beamFade,
            filter: "blur(18px)",
          }}
        />
        <SceneLayers layers={config.layers} />
      </FilmCamera>
      {/* 幕尾渐隐遮罩 */}
      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: 1 - outro }}
      />
      <AudioPlaceholder music={config.music} beatMarkers={config.beatMarkers} />
    </AbsoluteFill>
  );
};
