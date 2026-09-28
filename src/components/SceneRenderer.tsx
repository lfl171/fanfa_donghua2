import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { SceneLayer } from "../config/scene.schema";
import { componentRegistry } from "../config/parser";
import { ParticleDust } from "./ParticleDust";

/** 电影感文字层：标题 + 副标题，渐入渐出 */
export const LayerText: React.FC<{ layer: SceneLayer }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const delay = layer.delayFrames ?? 0;
  const local = frame - delay;
  const p = layer.params ?? {};
  const fadeOutAt = typeof p.fadeOutAt === "number" ? p.fadeOutAt : undefined;
  const fontSize = typeof p.fontSize === "number" ? p.fontSize : 64;
  const titleColor = typeof p.titleColor === "string" ? p.titleColor : "#e8e4da";
  const position = typeof p.position === "string" ? p.position : undefined; // 如 "42%"
  const bottom = p.bottom === true;

  if (local < 0) return null;

  let opacity = interpolate(local, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  if (fadeOutAt !== undefined) {
    opacity *= interpolate(local, [fadeOutAt - 30, fadeOutAt], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (opacity <= 0) return null;

  const translateY = interpolate(local, [0, 40], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        textAlign: "center",
        top: position ?? (bottom ? undefined : "50%"),
        bottom: bottom ? "6%" : undefined,
        transform: position || bottom ? undefined : `translateY(calc(-50% + ${translateY}px))`,
        opacity,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: "bold",
          fontFamily: "serif",
          color: titleColor,
          letterSpacing: 12,
          textShadow: `0 0 30px ${titleColor}55`,
        }}
      >
        {layer.text?.main}
      </div>
      {layer.text?.sub && (
        <div
          style={{
            fontSize: fontSize * 0.4,
            color: "#9aa0aa",
            marginTop: 18,
            letterSpacing: 6,
            fontFamily: "serif",
          }}
        >
          {layer.text.sub}
        </div>
      )}
    </div>
  );
};

/** 渲染单个图层（JSON → 组件 的核心映射） */
const Layer: React.FC<{ layer: SceneLayer }> = ({ layer }) => {
  if (layer.type === "text") {
    return <LayerText layer={layer} />;
  }

  if (layer.type === "particles") {
    return (
      <ParticleDust
        count={layer.params?.count as number | undefined}
        color={layer.params?.color as string | undefined}
        seed={layer.params?.seed as number | undefined}
        drift={layer.params?.drift as "up" | "float" | undefined}
      />
    );
  }

  const Comp = layer.component ? componentRegistry[layer.component] : null;
  if (!Comp) {
    if (layer.component) {
      console.warn(`未知组件: ${layer.component}`);
    }
    return null;
  }

  // 将 layer 的 props 平铺传给组件（src + params + delayFrames）
  const props: Record<string, unknown> = {
    ...(layer.params ?? {}),
    delayFrames: layer.delayFrames ?? 0,
  };
  if (layer.src) props.src = layer.src;

  return <Comp {...props} />;
};

/** 2.5D 视差：按 depth 分层包裹 */
const ParallaxLayer: React.FC<{ layer: SceneLayer }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const depth = layer.depth;

  const inner = <Layer layer={layer} />;
  if (depth === undefined || depth >= 1) return inner;

  // 远景(depth 小)移动少，近景(depth 大)移动多
  const camX = interpolate(frame, [0, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shift = camX * (1 - depth) * 40;

  return (
    <div
      style={{
        position: "absolute",
        inset: "-5%", // 略放大防止边缘露馅
        transform: `translateX(${shift}px) scale(1.05)`,
      }}
    >
      {inner}
    </div>
  );
};

/** 场景图层渲染器：按 scene.json layers 顺序渲染 */
export const SceneLayers: React.FC<{ layers: SceneLayer[] }> = ({ layers }) => {
  return (
    <>
      {layers.map((layer, i) => (
        <ParallaxLayer key={i} layer={layer} />
      ))}
    </>
  );
};
