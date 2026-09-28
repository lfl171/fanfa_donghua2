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
 * 第二幕《黑暗扩散》25-60s：
 * 旧地球仪浮现推进(0-380) → 墨水扩散覆盖地图(330-740) + 红色进军箭头(540-700)
 * → 数据图表《战争的代价》(700-1050)
 */
export const Act2DarknessSpreads: React.FC<{ config: SceneConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round(config.duration * fps);

  // 红色进军箭头（540-700，墨水扩散期间）：strokeDashoffset 画线
  const arrowProgress = interpolate(frame, [545, 635], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const outro = interpolate(frame, [640, 700], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050810", overflow: "hidden" }}>
      <FilmCamera moves={config.camera} durationInFrames={duration} handheld>
        {/* 宇宙星空底（地球仪出现前） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 60%, #101a2e 0%, #050810 70%)",
          }}
        />
        <SceneLayers layers={config.layers} />

        {/* 红色进军箭头 */}
        {frame >= 540 && frame < 700 && (
          <svg
            viewBox="0 0 1920 1080"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: outro,
            }}
          >
            <path
              d="M 700 380 Q 850 400 980 480 T 1250 620"
              fill="none"
              stroke="#8b0000"
              strokeWidth={5}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arrowProgress}
              style={{ filter: "drop-shadow(0 0 8px #8b0000)" }}
            />
            <path
              d="M 700 420 Q 800 520 900 600 T 1100 760"
              fill="none"
              stroke="#a01010"
              strokeWidth={4}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arrowProgress}
              style={{ filter: "drop-shadow(0 0 6px #a01010)" }}
              opacity={0.8}
            />
          </svg>
        )}
      </FilmCamera>
      <AudioPlaceholder music={config.music} beatMarkers={config.beatMarkers} />
    </AbsoluteFill>
  );
};
