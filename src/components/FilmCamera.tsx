import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraMove } from "../config/scene.schema";

/**
 * 电影运镜包装器：所有场景的最外层。
 * 支持叠加多个运镜（如 slow zoom + left pan），并可叠加手持微晃。
 */
export const FilmCamera: React.FC<{
  moves: CameraMove[];
  durationInFrames: number;
  handheld?: boolean;
  children: React.ReactNode;
}> = ({ moves, durationInFrames, handheld = false, children }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  let scale = 1;
  let x = 0; // %
  let y = 0; // %

  for (const move of moves) {
    switch (move) {
      case "slow zoom":
        scale *= interpolate(progress, [0, 1], [1, 1.12]);
        break;
      case "zoom out":
        scale *= interpolate(progress, [0, 1], [1.15, 1]);
        break;
      case "left pan":
        x += interpolate(progress, [0, 1], [0, -3]);
        break;
      case "right pan":
        x += interpolate(progress, [0, 1], [0, 3]);
        break;
      case "tilt up":
        y += interpolate(progress, [0, 1], [2, -2]);
        break;
      case "static":
        break;
    }
  }

  // 手持微晃（亚像素级，避免抖动穿帮）
  const shakeX = handheld ? Math.sin(frame / 7) * 0.4 : 0;
  const shakeY = handheld ? Math.cos(frame / 9) * 0.3 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${scale}) translate(${x}%, ${y}%) translate(${shakeX}px, ${shakeY}px)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
