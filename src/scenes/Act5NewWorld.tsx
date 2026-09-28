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
 * 第五幕《和平的新世界》150-180s：
 * 废墟长绿 → 黎明城市 + 孩子奔跑 + 太阳升起 → 白底地图 + 三行结语
 */
export const Act5NewWorld: React.FC<{ config: SceneConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round(config.duration * fps);

  // 太阳升起（300-560）：黎明城市段的背景光源
  const sunY = interpolate(frame, [300, 560], [200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const sunGlow = interpolate(frame, [300, 560], [0.3, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sunVisible = frame >= 280 && frame < 620;
  const sunFadeOut = interpolate(frame, [580, 620], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 结尾白底渐入（600 起，由 final_map 层的 background 配合）
  const whiteBg = interpolate(frame, [600, 660], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#101010", overflow: "hidden" }}>
      {/* 结尾白底 */}
      <AbsoluteFill style={{ backgroundColor: "#fdfaf2", opacity: whiteBg }} />

      <FilmCamera moves={config.camera} durationInFrames={duration}>
        {/* 升起的太阳（在黎明城市图之后、白底地图之前） */}
        {sunVisible && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "38%",
              width: 260,
              height: 260,
              marginLeft: -130,
              transform: `translateY(${sunY}px)`,
              opacity: sunGlow * sunFadeOut,
              background:
                "radial-gradient(circle, #fff3d6 0%, #ffd977 35%, rgba(255,180,80,0.5) 60%, transparent 75%)",
              borderRadius: "50%",
              filter: "blur(6px)",
              zIndex: 1,
            }}
          />
        )}
        <SceneLayers layers={config.layers} />
      </FilmCamera>
      <AudioPlaceholder music={config.music} beatMarkers={config.beatMarkers} />
    </AbsoluteFill>
  );
};
