import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetImage } from "./AssetImage";

/**
 * Ken Burns 照片活化：缓慢推进 + 平移 + 渐入，
 * 让静态历史照片"活起来"。
 */
export const PhotoReveal: React.FC<{
  src: string;
  fromScale?: number;
  toScale?: number;
  panX?: number; // %
  panY?: number; // %
  rotateTo?: number; // deg，幕2 地球仪用
  reveal?: "fade" | "clip";
  delayFrames?: number;
  kenBurnsFrames?: number; // 运镜持续帧数，默认 150
  grayscale?: boolean;
  fadeInFrames?: number;
  fadeOutAt?: number; // 幕内全局帧，到达后淡出
  fadeOutFrames?: number;
  background?: string; // 底层背景色（如结尾白底）
  fallbackColors?: [string, string];
}> = ({
  src,
  fromScale = 1,
  toScale = 1.15,
  panX = 0,
  panY = 0,
  rotateTo,
  reveal = "fade",
  delayFrames = 0,
  kenBurnsFrames = 150,
  grayscale = false,
  fadeInFrames = 30,
  fadeOutAt,
  fadeOutFrames = 40,
  background,
  fallbackColors,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;

  const scale = interpolate(local, [0, kenBurnsFrames], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const x = interpolate(local, [0, kenBurnsFrames], [0, panX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(local, [0, kenBurnsFrames], [0, panY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotate =
    rotateTo !== undefined
      ? interpolate(local, [0, kenBurnsFrames], [0, rotateTo], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  let opacity = interpolate(local, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(
      local,
      [fadeOutAt - fadeOutFrames, fadeOutAt],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  // clip 揭示：从中间向上下揭开
  const clipPath =
    reveal === "clip"
      ? `inset(${interpolate(local, [0, fadeInFrames], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}% 0 ${interpolate(local, [0, fadeInFrames], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}% 0)`
      : undefined;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background,
        opacity,
      }}
    >
      <AssetImage
        src={src}
        fallbackColors={fallbackColors}
        style={{
          clipPath,
          filter: grayscale ? "grayscale(1) contrast(1.05)" : undefined,
          transform: `scale(${scale}) translate(${x}%, ${y}%) rotate(${rotate}deg)`,
        }}
      />
    </div>
  );
};
