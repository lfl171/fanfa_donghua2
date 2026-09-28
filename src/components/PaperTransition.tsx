import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetImage } from "./AssetImage";

/**
 * 报纸/纸张从黑暗中展开：3D rotateX 展开 + 标题浮现。
 */
export const PaperTransition: React.FC<{
  src: string;
  delayFrames?: number;
  unfold?: "rotateX" | "scaleY";
  fadeOutAt?: number;
  headline?: string;
}> = ({ src, delayFrames = 0, unfold = "rotateX", fadeOutAt, headline }) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;

  const unfoldProgress = interpolate(local, [0, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const rotateX =
    unfold === "rotateX" ? interpolate(unfoldProgress, [0, 1], [-75, 0]) : 0;
  const scaleY =
    unfold === "scaleY" ? interpolate(unfoldProgress, [0, 1], [0.05, 1]) : 1;
  const scale = interpolate(unfoldProgress, [0, 1], [0.85, 1]);

  let opacity = interpolate(local, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 40, fadeOutAt], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const headlineOpacity = headline
    ? interpolate(local, [110, 170], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        perspective: 1200,
        opacity,
      }}
    >
      <div
        style={{
          width: "70%",
          height: "80%",
          position: "relative",
          transform: `rotateX(${rotateX}deg) scaleY(${scaleY}) scale(${scale})`,
          transformOrigin: "center top",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
      >
        <AssetImage
          src={src}
          fallbackColors={["#d8cdb4", "#b8a888"]}
          style={{ borderRadius: 4 }}
        />
        {headline && (
          <div
            style={{
              position: "absolute",
              top: "12%",
              width: "100%",
              textAlign: "center",
              opacity: headlineOpacity,
              fontSize: 44,
              fontWeight: "bold",
              fontFamily: "serif",
              color: "#1a1410",
              letterSpacing: 6,
            }}
          >
            {headline}
          </div>
        )}
      </div>
    </div>
  );
};
